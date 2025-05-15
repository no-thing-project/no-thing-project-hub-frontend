import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

// Constants for configuration
const MAX_CACHE_SIZE = 10;
const DEBOUNCE_MS = 300;

// LRU Cache implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

const gateListCache = new LRUCache(MAX_CACHE_SIZE);

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

  const debounceTimer = useRef(null);
  const abortControllers = useRef(new Set());

  // Centralized error handling
  const handleError = useCallback(
    (err, customMessage) => {
      if (err.name === "AbortError") return null;
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(customMessage || err.message || ERROR_MESSAGES.GENERIC);
      return null;
    },
    [onLogout, navigate]
  );

  // Debounce utility
  const debounce = useCallback((fn, ms) => {
    return (...args) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      return new Promise((resolve) => {
        debounceTimer.current = setTimeout(async () => {
          const result = await fn(...args);
          resolve(result);
        }, ms);
      });
    };
  }, []);

  // Normalize gate members data
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

  // Reset hook state
  const resetState = useCallback(() => {
    setGates([]);
    setGate(null);
    setMembers([]);
    setStats(null);
    setPagination({});
    setError(null);
    gateListCache.clear();
  }, []);

  // Create AbortController with cleanup
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllers.current.add(controller);
    return controller;
  }, []);

  // Cleanup AbortControllers
  const cleanupAbortControllers = useCallback(() => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();
  }, []);

  // Fetch list of gates with caching
  const fetchGatesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = JSON.stringify(filters);
      const cachedData = gateListCache.get(cacheKey);
      if (cachedData) {
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
        gateListCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const debouncedFetchGatesList = useMemo(
    () => debounce(fetchGatesList, DEBOUNCE_MS),
    [fetchGatesList]
  );

  // Fetch a single gate by ID
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
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Create a new gate
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
        return newGate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Update an existing gate
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
        return updatedGate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Update gate status
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
        return updatedGate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Delete a gate
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
        return true;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Add a member to a gate
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
        return gate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Remove a member from a gate
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
        return gate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Update a member's role in a gate
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
        return gate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Fetch gate members list
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
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Toggle favorite status for a gate
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
        return updatedGate;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Handle token change and initial fetch
  useEffect(() => {
    if (!token) {
      cleanupAbortControllers();
      resetState();
      return;
    }

    const controller = createAbortController();
    debouncedFetchGatesList({}, controller.signal).catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Initial fetch gates error:", err);
      }
    });

    return () => {
      cleanupAbortControllers();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [token, debouncedFetchGatesList, resetState, createAbortController, cleanupAbortControllers]);

  // Memoized return object
  return useMemo(
    () => ({
      gates,
      gate,
      members,
      stats,
      pagination,
      loading,
      error,
      fetchGatesList: debouncedFetchGatesList,
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
      debouncedFetchGatesList,
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