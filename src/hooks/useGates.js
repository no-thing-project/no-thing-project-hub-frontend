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

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required.",
  GATE_ID_MISSING: "Gate ID is missing.",
  GATE_NAME_MISSING: "Gate name is missing.",
  STATUS_DATA_MISSING: "Status data is missing.",
  USERNAME_MISSING: "Username is missing.",
  ROLE_MISSING: "Role is missing.",
  GENERIC: "An error occurred.",
};

// Constant for maximum cache size
const MAX_CACHE_SIZE = 10;

// Cache for gate lists
const gateListCache = new Map();

/**
 * Hook for managing gates and their members
 * @param {string|null} token - Authorization token
 * @param {function} onLogout - Function to handle logout
 * @param {function} navigate - Function for navigation
 * @returns {object} Object with states and methods for gate operations
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
   * Handle authentication errors
   * @param {Error} err - Error object
   * @returns {null} Always returns null
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
   * Reset hook state
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
   * Normalize gate members data
   * @param {Array} members - Array of members
   * @returns {Array} Normalized array of members
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
   * Fetch list of gates with caching
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Gate data or null if error
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
   * Fetch a single gate by ID
   * @param {string} gateId - Gate ID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Gate data or null if error
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
   * Create a new gate
   * @param {object} gateData - Gate data
   * @returns {Promise<object|null>} Created gate or null if error
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
        gateListCache.clear();
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
   * Update an existing gate
   * @param {string} gateId - Gate ID
   * @param {object} gateData - Data to update
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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
   * Update gate status
   * @param {string} gateId - Gate ID
   * @param {object} statusData - Status data
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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
   * Delete a gate
   * @param {string} gateId - Gate ID
   * @returns {Promise<boolean|null>} True if successful, null if error
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
        gateListCache.clear();
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
   * Add a member to a gate
   * @param {string} gateId - Gate ID
   * @param {object} memberData - Member data { username, role }
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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
   * Remove a member from a gate
   * @param {string} gateId - Gate ID
   * @param {string} username - Username
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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
   * Update a member's role in a gate
   * @param {string} gateId - Gate ID
   * @param {string} username - Username
   * @param {string} role - New role
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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
   * Fetch gate members list
   * @param {string} gateId - Gate ID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Members data or null if error
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
        gateListCache.clear();
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
   * Toggle favorite status for a gate
   * @param {string} gateId - Gate ID
   * @param {boolean} isFavorited - Current favorite status
   * @returns {Promise<object|null>} Updated gate or null if error
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
        gateListCache.clear();
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

  // Clear cache and reset state on token change
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