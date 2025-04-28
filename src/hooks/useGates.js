import { useState, useCallback, useEffect, useMemo } from "react";
import {
  fetchGates,
  fetchGateById,
  createGate,
  updateGate,
  updateGateStatus,
  deleteGate,
  addGateMember,
  removeGateMember,
  fetchGateMembers,
  favoriteGate,
  unfavoriteGate,
  updateGateMember,
} from "../api/gatesApi";

// Константи для повідомлень про помилки
const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required.",
  GATE_ID_MISSING: "Gate ID is missing.",
  GATE_NAME_MISSING: "Gate name is missing.",
  STATUS_DATA_MISSING: "Status data is missing.",
  USERNAME_MISSING: "Username is missing.",
  ROLE_MISSING: "Role is missing.",
  GENERIC: "An error occurred.",
};

// Константа для максимального розміру кешу
const MAX_CACHE_SIZE = 10;

// Кеш для списків гейтів
const gateListCache = new Map();

/**
 * Хук для управління гейтами та їх членами
 * @param {string|null} token - Токен авторизації
 * @param {function} onLogout - Функція для обробки виходу
 * @param {function} navigate - Функція для навігації
 * @returns {object} Об'єкт із станами та методами для роботи з гейтами
 */
export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Обробка помилок авторизації
   * @param {Error} err - Об'єкт помилки
   * @returns {null} Завжди повертає null
   */
  const handleAuthError = useCallback(
    (err) => {
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || ERROR_MESSAGES.GENERIC);
      return null;
    },
    [onLogout, navigate]
  );

  /**
   * Скидання стану хука
   */
  const resetState = useCallback(() => {
    setGates([]);
    setGate(null);
    setMembers([]);
    setStats(null);
    setPagination({});
    setError(null);
  }, []);

  /**
   * Нормалізація даних членів гейта
   * @param {Array} members - Масив членів
   * @returns {Array} Нормалізований масив членів
   */
  const normalizeMembers = useCallback((members = []) => {
    return members.map((member) => ({
      member_id: member.member_id || member.anonymous_id || "",
      username: member.username || "Unknown",
      role: member.role || "viewer",
      joined_at: member.joined_at || null,
      avatar: member.avatar || null,
      total_points: member.total_points || 0,
      anonymous_id: member.anonymous_id || member.member_id || "",
    }));
  }, []);

  /**
   * Отримання списку гейтів із кешуванням
   * @param {object} [filters={}] - Фільтри для запиту
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані гейтів або null у разі помилки
   */
  const fetchGatesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = JSON.stringify(filters);
      if (gateListCache.has(cacheKey)) {
        const cachedData = gateListCache.get(cacheKey);
        setGates(cachedData.gates || []);
        setPagination(cachedData.pagination || {});
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchGates(token, filters, signal);
        if (!data) throw new Error("No data received");
        setGates(data.gates || []);
        setPagination(data.pagination || {});

        if (gateListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = gateListCache.keys().next().value;
          gateListCache.delete(oldestKey);
        }
        gateListCache.set(cacheKey, data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch gates error:", err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Отримання даних одного гейта
   * @param {string} gateId - ID гейта
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані гейта або null у разі помилки
   */
  const fetchGate = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchGateById(gateId, token, signal);
        if (!data) throw new Error("No gate data received");
        setGate(data);
        setMembers(normalizeMembers(data.members));
        setStats(data.stats || null);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch gate error:", err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Створення нового гейта
   * @param {object} gateData - Дані гейта
   * @returns {Promise<object|null>} Створений гейт або null у разі помилки
   */
  const createNewGate = useCallback(
    async (gateData) => {
      if (!token || !gateData?.name?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const newGate = await createGate(
          {
            ...gateData,
            is_public: gateData.is_public ?? true,
            visibility: gateData.visibility || (gateData.is_public ? "public" : "private"),
            settings: {
              class_creation_cost: gateData.settings?.class_creation_cost || 100,
              board_creation_cost: gateData.settings?.board_creation_cost || 50,
              max_members: gateData.settings?.max_members || 1000,
              ai_moderation_enabled: gateData.settings?.ai_moderation_enabled ?? true,
              ...gateData.settings,
            },
          },
          token
        );
        if (!newGate) throw new Error("Failed to create gate");
        setGates((prev) => [...prev, newGate]);
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return newGate;
      } catch (err) {
        console.error("Create gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Оновлення існуючого гейта
   * @param {string} gateId - ID гейта
   * @param {object} gateData - Дані для оновлення
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const updateExistingGate = useCallback(
    async (gateId, gateData) => {
      if (!token || !gateId || !gateData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : ERROR_MESSAGES.GATE_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const { gate_id, ...updateData } = gateData;
        const updatedGate = await updateGate(gateId, updateData, token);
        if (!updatedGate) throw new Error("Failed to update gate");
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return updatedGate;
      } catch (err) {
        console.error("Update gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Оновлення статусу гейта
   * @param {string} gateId - ID гейта
   * @param {object} statusData - Дані статусу
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const updateGateStatusById = useCallback(
    async (gateId, statusData) => {
      if (!token || !gateId || !statusData) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : ERROR_MESSAGES.STATUS_DATA_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedGate = await updateGateStatus(gateId, statusData, token);
        if (!updatedGate) throw new Error("Failed to update gate status");
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return updatedGate;
      } catch (err) {
        console.error("Update gate status error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Видалення гейта
   * @param {string} gateId - ID гейта
   * @returns {Promise<boolean|null>} true у разі успіху, null у разі помилки
   */
  const deleteExistingGate = useCallback(
    async (gateId) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteGate(gateId, token);
        setGates((prev) => prev.filter((g) => g.gate_id !== gateId));
        setGate(null);
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return true;
      } catch (err) {
        console.error("Delete gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Додавання члена до гейта
   * @param {string} gateId - ID гейта
   * @param {object} memberData - Дані члена { username, role }
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const addMemberToGate = useCallback(
    async (gateId, { username, role = "viewer" }) => {
      if (!token || !gateId || !username?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const gate = await addGateMember(gateId, { username, role }, token);
        if (!gate) throw new Error("Failed to add member");
        setMembers(normalizeMembers(gate.members));
        setGate((prev) => (prev?.gate_id === gateId ? gate : prev));
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? gate : g)));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return gate;
      } catch (err) {
        console.error("Add member error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Видалення члена з гейта
   * @param {string} gateId - ID гейта
   * @param {string} username - Ім'я користувача
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const removeMemberFromGate = useCallback(
    async (gateId, username) => {
      if (!token || !gateId || !username) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const gate = await removeGateMember(gateId, username, token);
        if (!gate) throw new Error("Failed to remove member");
        setMembers(normalizeMembers(gate.members));
        setGate((prev) => (prev?.gate_id === gateId ? gate : prev));
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? gate : g)));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return gate;
      } catch (err) {
        console.error("Remove member error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Оновлення ролі члена гейта
   * @param {string} gateId - ID гейта
   * @param {string} username - Ім'я користувача
   * @param {string} role - Нова роль
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const updateMemberRole = useCallback(
    async (gateId, username, role) => {
      if (!token || !gateId || !username || !role) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : !username
            ? ERROR_MESSAGES.USERNAME_MISSING
            : ERROR_MESSAGES.ROLE_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const gate = await updateGateMember(gateId, username, { role }, token);
        if (!gate) throw new Error("Failed to update member role");
        setMembers(normalizeMembers(gate.members));
        setGate((prev) => (prev?.gate_id === gateId ? gate : prev));
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? gate : g)));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return gate;
      } catch (err) {
        console.error("Update member role error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Отримання списку членів гейта
   * @param {string} gateId - ID гейта
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані членів або null у разі помилки
   */
  const fetchGateMembersList = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchGateMembers(gateId, token, signal);
        if (!data) throw new Error("No members data received");
        setMembers(normalizeMembers(data.members));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch gate members error:", err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Перемикання статусу "улюблене" для гейта
   * @param {string} gateId - ID гейта
   * @param {boolean} isFavorited - Поточний статус
   * @returns {Promise<object|null>} Оновлений гейт або null у разі помилки
   */
  const toggleFavoriteGate = useCallback(
    async (gateId, isFavorited) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedGate = isFavorited
          ? await unfavoriteGate(gateId, token)
          : await favoriteGate(gateId, token);
        if (!updatedGate) throw new Error("Failed to toggle favorite status");
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
        gateListCache.clear(); // Очищення кешу
        setError(null);
        return updatedGate;
      } catch (err) {
        console.error("Toggle favorite error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Очищення кешу та скидання стану при зміні токена
  useEffect(() => {
    if (!token) {
      gateListCache.clear();
      resetState();
    }
  }, [token, resetState]);

  return useMemo(
    () => ({
      gates,
      gate,
      members,
      stats,
      pagination,
      loading,
      error,
      fetchGatesList,
      fetchGate,
      createNewGate,
      updateExistingGate,
      updateGateStatusById,
      deleteExistingGate,
      addMemberToGate,
      removeMemberFromGate,
      updateMemberRole,
      fetchGateMembersList,
      toggleFavoriteGate,
      resetState,
    }),
    [
      gates,
      gate,
      members,
      stats,
      pagination,
      loading,
      error,
      fetchGatesList,
      fetchGate,
      createNewGate,
      updateExistingGate,
      updateGateStatusById,
      deleteExistingGate,
      addMemberToGate,
      removeMemberFromGate,
      updateMemberRole,
      fetchGateMembersList,
      toggleFavoriteGate,
      resetState,
    ]
  );
};