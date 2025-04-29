import { useState, useCallback, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  fetchClasses,
  fetchClassesByGateId,
  fetchClassById,
  createClass,
  createClassInGate,
  updateClass,
  updateClassStatus,
  deleteClass,
  addClassMember,
  removeClassMember,
  fetchClassMembers,
  favoriteClass,
  unfavoriteClass,
  updateClassMember,
} from "../api/classesApi";

// Константи для повідомлень про помилки
const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required.",
  CLASS_ID_MISSING: "Class ID is missing.",
  CLASS_NAME_MISSING: "Class name is missing.",
  CLASS_NOT_FOUND: "Class not found.",
  STATUS_DATA_MISSING: "Status data is missing.",
  USERNAME_MISSING: "Username is missing.",
  ROLE_MISSING: "Role is missing.",
  GATE_ID_MISSING: "Gate ID is missing for public class.",
  DATA_MISSING: "Required data is missing.",
  MEMBER_LIMIT_EXCEEDED: "Member limit exceeded.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded, please try again later.",
  GENERIC: "An error occurred.",
};

// Константа для максимального розміру кешу
const MAX_CACHE_SIZE = 10;
const CACHE_VERSION = "v1"; // Для інвалідизації кешу при змінах схеми

// Кеш для списків класів і окремих класів
const classListCache = new Map();
const classItemCache = new Map();

/**
 * Хук для управління класами та їх членами
 * @param {string|null} token - Токен авторизації
 * @param {function} onLogout - Функція для обробки виходу
 * @param {function} navigate - Функція для навігації
 * @returns {object} Об'єкт із станами та методами для роботи з класами
 * @example
 * const { classes, fetchClassesList } = useClasses(token, handleLogout, navigate);
 * useEffect(() => { fetchClassesList(); }, [fetchClassesList]);
 */
export const useClasses = (token, onLogout, navigate) => {
  const [classes, setClasses] = useState([]);
  const [classItem, setClassItem] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Обробка помилок авторизації з підтримкою повторних спроб для 429
   * @param {Error} err - Об'єкт помилки
   * @param {number} [retryCount=0] - Кількість повторних спроб
   * @returns {null} Завжди повертає null
   */
  const handleAuthError = useCallback(
    async (err, retryCount = 0) => {
      const status = err.status || 500;
      if (status === 429 && retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return; // Повторна спроба буде викликана в оригінальній функції
      }
      if (status === 401 || status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(
        status === 429
          ? ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
          : status === 404
          ? ERROR_MESSAGES.CLASS_NOT_FOUND
          : err.message || ERROR_MESSAGES.GENERIC
      );
      return null;
    },
    [onLogout, navigate]
  );

  /**
   * Скидання стану хука
   * @param {boolean} [fullReset=true] - Чи очищати всі стани
   */
  const resetState = useCallback((fullReset = true) => {
    ReactDOM.unstable_batchedUpdates(() => {
      setClasses([]);
      setClassItem(null);
      setMembers([]);
      setStats(null);
      if (fullReset) setPagination({});
      setError(null);
      setLastUpdated(null);
      classListCache.clear();
      classItemCache.clear();
    });
  }, []);

  /**
   * Нормалізація даних членів класу
   * @param {Array} members - Масив членів
   * @returns {Array} Нормалізований масив членів
   * @example
   * normalizeMembers([{ username: "user1" }]) // [{ username: "user1", role: "viewer", ... }]
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
   * Отримання списку класів із кешуванням
   * @param {object} [filters={}] - Фільтри для запиту
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані класів або null у разі помилки
   */
  const fetchClassesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${JSON.stringify(filters)}`;
      if (classListCache.has(cacheKey)) {
        const cachedData = classListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses(cachedData.classes || []);
          setPagination(cachedData.pagination || {});
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchClasses(token, filters, signal);
        if (!data) throw new Error("No data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses(data.classes || []);
          setPagination(data.pagination || {});
          setLastUpdated(timestamp);
        });

        if (classListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = classListCache.keys().next().value;
          classListCache.delete(oldestKey);
        }
        classListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch classes error:", err);
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
   * Отримання класів за ID гейта
   * @param {string} gateId - ID гейта
   * @param {object} [filters={}] - Фільтри для запиту
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані класів або null у разі помилки
   */
  const fetchClassesByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:gate:${gateId}:${JSON.stringify(filters)}`;
      if (classListCache.has(cacheKey)) {
        const cachedData = classListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses(cachedData.classes || []);
          setPagination(cachedData.pagination || {});
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchClassesByGateId(gateId, token, filters, signal);
        if (!data) throw new Error("No data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses(data.classes || []);
          setPagination(data.pagination || {});
          setLastUpdated(timestamp);
        });

        if (classListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = classListCache.keys().next().value;
          classListCache.delete(oldestKey);
        }
        classListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch classes by gate error:", err);
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
   * Отримання даних одного класу
   * @param {string} classId - ID класу
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані класу або null у разі помилки
   */
  const fetchClass = useCallback(
    async (classId, signal) => {
      if (!token || !classId) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${classId}`;
      if (classItemCache.has(cacheKey)) {
        const cachedData = classItemCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setClassItem(cachedData);
          setMembers(normalizeMembers(cachedData.members));
          setStats(cachedData.stats || null);
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchClassById(classId, token, signal);
        if (!data) throw new Error("No class data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setClassItem(data);
          setMembers(normalizeMembers(data.members));
          setStats(data.stats || null);
          setLastUpdated(timestamp);
        });

        if (classItemCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = classItemCache.keys().next().value;
          classItemCache.delete(oldestKey);
        }
        classItemCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch class error:", err);
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
   * Створення нового класу
   * @param {object} classData - Дані класу
   * @returns {Promise<object|null>} Створений клас або null у разі помилки
   */
  const createNewClass = useCallback(
    async (classData, retryCount = 0) => {
      if (!token || !classData?.name?.trim()) {
        setError(token ? ERROR_MESSAGES.CLASS_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }
      if (classData.is_public && !classData.gate_id) {
        setError(ERROR_MESSAGES.GATE_ID_MISSING);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        let newClass;
        if (classData.is_public && classData.gate_id) {
          newClass = await createClassInGate(classData.gate_id, classData, token);
        } else {
          newClass = await createClass(
            {
              ...classData,
              is_public: classData.is_public ?? false,
              visibility: classData.visibility || (classData.is_public ? "public" : "private"),
              gate_id: classData.is_public ? classData.gate_id : undefined,
              settings: {
                max_boards: classData.settings?.max_boards || 100,
                max_members: classData.settings?.max_members || 50,
                board_creation_cost: classData.settings?.board_creation_cost || 50,
                tweet_cost: classData.settings?.tweet_cost || 1,
                allow_invites: classData.settings?.allow_invites ?? true,
                require_approval: classData.settings?.require_approval ?? false,
                ai_moderation_enabled: classData.settings?.ai_moderation_enabled ?? true,
                auto_archive_after: classData.settings?.auto_archive_after || 30,
              },
            },
            token
          );
        }
        if (!newClass) throw new Error("Failed to create class");
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => [...prev, newClass]);
          setLastUpdated(Date.now());
        });
        classListCache.clear();
        classItemCache.clear();
        return newClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewClass(classData, retryCount + 1);
        }
        console.error("Create class error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Оновлення існуючого класу
   * @param {string} classId - ID класу
   * @param {object} classData - Дані для оновлення
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  /**
   * Update an existing class
   * @param {string} classId - ID of the class
   * @param {object} classData - Data to update
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const updateExistingClass = useCallback(
    async (classId, classData, retryCount = 0) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }
      if (!classId || typeof classId !== "string") {
        setError(ERROR_MESSAGES.CLASS_ID_MISSING);
        return null;
      }
      if (!classData?.name?.trim()) {
        setError(ERROR_MESSAGES.CLASS_NAME_MISSING);
        return null;
      }
      if (classData.is_public && !classData.gate_id) {
        setError(ERROR_MESSAGES.GATE_ID_MISSING);
        return null;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        const { class_id, ...updateData } = classData;
        const updatedClass = await updateClass(
          classId,
          {
            ...updateData,
            gate_id: classData.is_public ? classData.gate_id : undefined,
          },
          token
        );
        if (!updatedClass) throw new Error("Failed to update class");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
          setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? updatedClass : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateExistingClass(classId, classData, retryCount + 1);
        }
        console.error("Update class error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Оновлення статусу класу
   * @param {string} classId - ID класу
   * @param {object} statusData - Дані статусу
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  const updateClassStatusById = useCallback(
    async (classId, statusData, retryCount = 0) => {
      if (!token || !classId || !statusData) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : ERROR_MESSAGES.STATUS_DATA_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedClass = await updateClassStatus(classId, statusData, token);
        if (!updatedClass) throw new Error("Failed to update class status");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
          setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? updatedClass : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateClassStatusById(classId, statusData, retryCount + 1);
        }
        console.error("Update class status error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Видалення класу
   * @param {string} classId - ID класу
   * @returns {Promise<boolean|null>} true у разі успіху, null у разі помилки
   */
  const deleteExistingClass = useCallback(
    async (classId, retryCount = 0) => {
      if (!token || !classId) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteClass(classId, token);
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => prev.filter((c) => c.class_id !== classId));
          setClassItem((prev) => (prev?.class_id === classId ? null : prev));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.filter((c) => c.class_id !== classId),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.delete(cacheKey);
        return true;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return deleteExistingClass(classId, retryCount + 1);
        }
        console.error("Delete class error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Додавання члена до класу
   * @param {string} classId - ID класу
   * @param {object} memberData - Дані члена { username, role }
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  const addMemberToClass = useCallback(
    async (classId, { username, role = "member" }, retryCount = 0) => {
      if (!token || !classId || !username?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const classItem = await addClassMember(classId, { username, role }, token);
        if (!classItem) throw new Error("Failed to add member");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(classItem.members));
          setClassItem((prev) => (prev?.class_id === classId ? classItem : prev));
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? classItem : c)));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? classItem : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...classItem, timestamp: Date.now() });
        return classItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return addMemberToClass(classId, { username, role }, retryCount + 1);
        }
        console.error("Add member error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Видалення члена з класу
   * @param {string} classId - ID класу
   * @param {string} username - Ім'я користувача
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  const removeMemberFromClass = useCallback(
    async (classId, username, retryCount = 0) => {
      if (!token || !classId || !username) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const classItem = await removeClassMember(classId, username, token);
        if (!classItem) throw new Error("Failed to remove member");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(classItem.members));
          setClassItem((prev) => (prev?.class_id === classId ? classItem : prev));
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? classItem : c)));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? classItem : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...classItem, timestamp: Date.now() });
        return classItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return removeMemberFromClass(classId, username, retryCount + 1);
        }
        console.error("Remove member error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Оновлення ролі члена класу
   * @param {string} classId - ID класу
   * @param {string} username - Ім'я користувача
   * @param {string} role - Нова роль
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  const updateMemberRole = useCallback(
    async (classId, username, role, retryCount = 0) => {
      if (!token || !classId || !username || !role) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : !username
            ? ERROR_MESSAGES.USERNAME_MISSING
            : ERROR_MESSAGES.ROLE_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const classItem = await updateClassMember(classId, username, { role }, token);
        if (!classItem) throw new Error("Failed to update member role");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(classItem.members));
          setClassItem((prev) => (prev?.class_id === classId ? classItem : prev));
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? classItem : c)));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? classItem : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...classItem, timestamp: Date.now() });
        return classItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateMemberRole(classId, username, role, retryCount + 1);
        }
        console.error("Update member role error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers]
  );

  /**
   * Отримання списку членів класу
   * @param {string} classId - ID класу
   * @param {AbortSignal} [signal] - Сигнал для скасування запиту
   * @returns {Promise<object|null>} Дані членів або null у разі помилки
   */
  const fetchClassMembersList = useCallback(
    async (classId, signal) => {
      if (!token || !classId) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchClassMembers(classId, token, signal);
        if (!data) throw new Error("No members data received");
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(data.members));
          setLastUpdated(Date.now());
        });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch class members error:", err);
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
   * Перемикання статусу "улюблене" для класу
   * @param {string} classId - ID класу
   * @param {boolean} isFavorited - Поточний статус
   * @returns {Promise<object|null>} Оновлений клас або null у разі помилки
   */
  const toggleFavoriteClass = useCallback(
    async (classId, isFavorited, retryCount = 0) => {
      if (!token || !classId) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedClass = isFavorited
          ? await unfavoriteClass(classId, token)
          : await favoriteClass(classId, token);
        if (!updatedClass) throw new Error("Failed to toggle favorite status");
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
          setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
          setLastUpdated(Date.now());
        });
        classListCache.forEach((value, key) => {
          if (value.classes.some((c) => c.class_id === classId)) {
            classListCache.set(key, {
              ...value,
              classes: value.classes.map((c) => (c.class_id === classId ? updatedClass : c)),
              timestamp: Date.now(),
            });
          }
        });
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return toggleFavoriteClass(classId, isFavorited, retryCount + 1);
        }
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
      classListCache.clear();
      classItemCache.clear();
      resetState();
    }
  }, [token, resetState]);

  return useMemo(
    () => ({
      classes,
      classItem,
      members,
      stats,
      pagination,
      loading,
      error,
      lastUpdated,
      fetchClassesList,
      fetchClassesByGate,
      fetchClass,
      createNewClass,
      updateExistingClass,
      updateClassStatusById,
      deleteExistingClass,
      addMemberToClass,
      removeMemberFromClass,
      updateMemberRole,
      fetchClassMembersList,
      toggleFavoriteClass,
      resetState,
    }),
    [
      classes,
      classItem,
      members,
      stats,
      pagination,
      loading,
      error,
      lastUpdated,
      fetchClassesList,
      fetchClassesByGate,
      fetchClass,
      createNewClass,
      updateExistingClass,
      updateClassStatusById,
      deleteExistingClass,
      addMemberToClass,
      removeMemberFromClass,
      updateMemberRole,
      fetchClassMembersList,
      toggleFavoriteClass,
      resetState,
    ]
  );
};