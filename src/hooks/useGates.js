/**
 * @module useGates
 * @description React hook for managing gates and their members with caching and debounced API calls.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
import {
  fetchGates,
  fetchGateById,
  createGate,
  updateGate,
  updateGateStatus,
  deleteGate,
  addGateMember,
  removeGateMember,
  updateGateMember,
  favoriteGate,
  unfavoriteGate,
  fetchGateMembers,
} from '../api/gatesApi';

// Constants
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  GATE_ID_MISSING: 'Gate ID is missing.',
  GATE_NAME_MISSING: 'Gate name is missing.',
  GATE_NOT_FOUND: 'Gate not found.',
  STATUS_DATA_MISSING: 'Status data is missing.',
  USERNAME_MISSING: 'Username is missing.',
  ROLE_MISSING: 'Role is missing.',
  GENERIC: 'An error occurred.',
};

const CONFIG = {
  MAX_CACHE_SIZE: 10,
  CACHE_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
  DEBOUNCE_MS: 300,
  DEFAULT_LIMIT: 20,
  CACHE_VERSION: 'v1',
};

// LRU Cache implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const { value, timestamp } = this.cache.get(key);
    if (Date.now() - timestamp > CONFIG.CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, { value, timestamp });
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const gateCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

/**
 * Hook for managing gates and their members.
 * @param {string|null} token - Authentication token.
 * @param {function} onLogout - Logout callback.
 * @param {function} navigate - Navigation callback.
 * @returns {object} Gate management functions and state.
 */
export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((err, message) => {
    if (err.name === 'AbortError') return Promise.resolve(null);
    const status = err.status || 500;
    if (status === 401 || status === 403) {
      onLogout('Session expired. Please log in again.');
      navigate('/login');
    }
    const errorMessage = message || err.message || ERROR_MESSAGES.GENERIC;
    setError(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }, [onLogout, navigate]);

  const normalizeMembers = useCallback((members = []) => {
    return members.map((member) => ({
      member_id: member.user?.anonymous_id || member.anonymous_id || '',
      username: member.user?.username || 'Unknown',
      role: member.role || 'viewer',
      joined_at: member.joined_at || null,
      avatar: member.user?.avatar || null,
      total_points: member.user?.total_points || 0,
      anonymous_id: member.user?.anonymous_id || member.anonymous_id || '',
    }));
  }, []);

  const normalizeClasses = useCallback((classes = []) => {
    return classes.map((cls) => ({
      class_id: cls.class_id || '',
      name: cls.name || 'Untitled Class',
      description: cls.description || '',
      gate_id: cls.gate_id || '',
      creator_id: cls.creator_id || '',
      visibility: cls.visibility || 'private',
      access: cls.access || { is_public: false },
      settings: cls.settings || {},
      stats: {
        board_count: cls.board_count || 0,
        tweet_count: cls.tweet_count || 0,
        member_count: cls.members?.length || 0,
      },
      members: cls.members || [],
      favorited_by: cls.favorited_by || [],
      is_favorited: cls.is_favorited || false,
      tags: cls.tags || [],
      status: cls.status || 'active',
      created_at: cls.created_at || null,
      updated_at: cls.updated_at || null,
    }));
  }, []);

  const resetState = useCallback(() => {
    setGates([]);
    setGate(null);
    setMembers([]);
    setStats(null);
    setPagination({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
    setError(null);
    gateCache.clear();
  }, []);

  const fetchGatesList = useCallback(async (filters = {}, signal, append = false) => {
    if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);

    const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
    const cacheKey = `${CONFIG.CACHE_VERSION}:gates:${JSON.stringify({ ...filters, page, limit })}`;
    const cachedData = gateCache.get(cacheKey);

    if (cachedData && !append) {
      setGates(cachedData.gates || []);
      setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
      return Promise.resolve(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGates(token, { ...filters, page, limit }, signal);
      if (!data) throw new Error('No data received');
      const newGates = data.gates || [];
      setGates((prev) => (append ? [...prev, ...newGates] : newGates));
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        hasMore: newGates.length === limit,
      });
      gateCache.set(cacheKey, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const debouncedFetchGatesList = useMemo(() => {
    return debounce((filters, signal, append, callback) => {
      fetchGatesList(filters, signal, append)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchGatesList]);

  const fetchGate = useCallback(async (gateId, signal) => {
    if (!token || !gateId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const cacheKey = `${CONFIG.CACHE_VERSION}:gate:${gateId}`;
    const cachedData = gateCache.get(cacheKey);

    if (cachedData) {
      setGate(cachedData);
      setMembers(normalizeMembers(cachedData.members));
      setStats(cachedData.stats || null);
      return Promise.resolve(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const gateData = await fetchGateById(gateId, token, signal);
      if (!gateData) throw new Error('No gate data received');
      const normalizedData = {
        ...gateData,
        members: normalizeMembers(gateData.members || []),
        classes: normalizeClasses(gateData.classes || []),
      };
      setGate(normalizedData);
      setMembers(normalizedData.members);
      setStats(gateData.stats || null);
      gateCache.set(cacheKey, normalizedData);
      return Promise.resolve(normalizedData);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GATE_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers, normalizeClasses]);

  const createNewGate = useCallback(async (gateData) => {
    if (!token || !gateData?.name?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      const newGate = await createGate(
        {
          ...gateData,
          is_public: gateData.is_public ?? true,
          visibility: gateData.visibility || (gateData.is_public ? 'public' : 'private'),
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
      if (!newGate) throw new Error('Failed to create gate');
      setGates((prev) => [...prev, newGate]);
      gateCache.clear();
      return Promise.resolve(newGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const updateExistingGate = useCallback(async (gateId, gateData) => {
    if (!token || !gateId?.trim() || !gateData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.GATE_NAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const { gate_id, ...updateData } = gateData;
      const updatedGate = await updateGate(gateId, updateData, token);
      if (!updatedGate) throw new Error('Failed to update gate');
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const updateGateStatusById = useCallback(async (gateId, statusData) => {
    if (!token || !gateId?.trim() || !statusData) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.STATUS_DATA_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedGate = await updateGateStatus(gateId, statusData, token);
      if (!updatedGate) throw new Error('Failed to update gate status');
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const deleteExistingGate = useCallback(async (gateId) => {
    if (!token || !gateId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      await deleteGate(gateId, token);
      setGates((prev) => prev.filter((g) => g.gate_id !== gateId));
      setGate((prev) => (prev?.gate_id === gateId ? null : prev));
      gateCache.clear();
      return Promise.resolve(true);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const addMemberToGate = useCallback(async (gateId, { username, role = 'viewer' }) => {
    if (!token || !gateId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedGate = await addGateMember(gateId, { username, role }, token);
      if (!updatedGate) throw new Error('Failed to add member');
      setMembers(normalizeMembers(updatedGate.members));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const removeMemberFromGate = useCallback(async (gateId, username) => {
    if (!token || !gateId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedGate = await removeGateMember(gateId, username, token);
      if (!updatedGate) throw new Error('Failed to remove member');
      setMembers(normalizeMembers(updatedGate.members));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const updateMemberRole = useCallback(async (gateId, username, role) => {
    if (!token || !gateId?.trim() || !username?.trim() || !role?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : !username ? ERROR_MESSAGES.USERNAME_MISSING : ERROR_MESSAGES.ROLE_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedGate = await updateGateMember(gateId, username, { role }, token);
      if (!updatedGate) throw new Error('Failed to update member role');
      setMembers(normalizeMembers(updatedGate.members));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const fetchGateMembersList = useCallback(async (gateId, signal) => {
    if (!token || !gateId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGateMembers(gateId, token, signal);
      if (!data) throw new Error('No members data received');
      setMembers(normalizeMembers(data.members));
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const toggleFavoriteGate = useCallback(async (gateId, isFavorited) => {
    if (!token || !gateId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedGate = isFavorited ? await unfavoriteGate(gateId, token) : await favoriteGate(gateId, token);
      if (!updatedGate) throw new Error('Failed to toggle favorite status');
      setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
      setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
      gateCache.clear();
      return Promise.resolve(updatedGate);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    if (!token) {
      resetState();
      return;
    }

    const controller = new AbortController();
    debouncedFetchGatesList({}, controller.signal, false, (err, result) => {
      if (err && err.name !== 'AbortError') {
        setError(err.message || ERROR_MESSAGES.GENERIC);
      }
    });

    return () => {
      controller.abort();
      debouncedFetchGatesList.cancel();
    };
  }, [token, resetState, debouncedFetchGatesList]);

  return useMemo(() => ({
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
  }), [
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
  ]);
};

export default useGates;