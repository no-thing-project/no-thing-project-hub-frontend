import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  fetchGates,
  fetchGateById,
  createGate,
  updateGate,
  updateGateStatus,
  deleteGate,
  addGateMember,
  removeGateMember,
  favoriteGate,
  unfavoriteGate,
  updateGateMember,
  fetchGateMembers,
} from '../api/gatesApi';

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  GATE_ID_MISSING: 'Gate ID is missing.',
  GATE_NAME_MISSING: 'Gate name is missing.',
  GATE_NOT_FOUND: 'Gate not found.',
  STATUS_DATA_MISSING: 'Status data is missing.',
  USERNAME_MISSING: 'Username is missing.',
  ROLE_MISSING: 'Role is missing.',
  DATA_MISSING: 'Required data is missing.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later.',
  GENERIC: 'An error occurred.',
};

// Constants for cache
const MAX_CACHE_SIZE = 10;
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const DEBOUNCE_MS = 300;

// Cache for gate lists and items
const gateListCache = new Map();
const gateItemCache = new Map();

export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const isCacheExpired = useCallback((cacheEntry) => {
    return Date.now() - cacheEntry.timestamp > CACHE_EXPIRY_MS;
  }, []);

  const handleError = useCallback(
    async (err, retryCount = 0) => {
      if (err.message === 'canceled') {
        console.debug('Gate fetch canceled');
        return null;
      }
      const status = err.status || 500;
      if (status === 429 && retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return;
      }
      if (status === 401 || status === 403) {
        onLogout('Your session has expired. Please log in again.');
        navigate('/login');
      }
      setError(
        status === 429
          ? ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
          : status === 404
          ? ERROR_MESSAGES.GATE_NOT_FOUND
          : err.message || ERROR_MESSAGES.GENERIC
      );
      return null;
    },
    [onLogout, navigate]
  );

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

  const resetState = useCallback((fullReset = true) => {
    ReactDOM.unstable_batchedUpdates(() => {
      setGates([]);
      setGate(null);
      setMembers([]);
      setStats(null);
      if (fullReset) setPagination({});
      setError(null);
      setLastUpdated(null);
      gateListCache.clear();
      gateItemCache.clear();
    });
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const debounce = useCallback((fn, ms) => {
    return (...args) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (err) {
            resolve(null);
          }
        }, ms);
      });
    };
  }, []);

  const fetchGatesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${JSON.stringify(filters)}`;
      if (gateListCache.has(cacheKey) && !isCacheExpired(gateListCache.get(cacheKey))) {
        const cachedData = gateListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setGates(cachedData.gates || []);
          setPagination(cachedData.pagination || {});
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        console.debug('Fetching gates with signal:', signal instanceof AbortSignal); // Debug
        const data = await fetchGates(token, filters, signal);
        if (!data) throw new Error('No data received');
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setGates(data.gates || []);
          setPagination(data.pagination || {});
          setLastUpdated(timestamp);
        });

        if (gateListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = gateListCache.keys().next().value;
          gateListCache.delete(oldestKey);
        }
        gateListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error('Fetch gates error:', err);
          return handleError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, isCacheExpired]
  );

  const debouncedFetchGatesList = useMemo(
    () => debounce(fetchGatesList, DEBOUNCE_MS),
    [fetchGatesList]
  );

  const fetchGate = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${gateId}`;
      if (gateItemCache.has(cacheKey) && !isCacheExpired(gateItemCache.get(cacheKey))) {
        const cachedData = gateItemCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setGate(cachedData);
          setMembers(normalizeMembers(cachedData.members));
          setStats(cachedData.stats || null);
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const gateData = await fetchGateById(gateId, token, signal);
        if (!gateData) throw new Error('No gate data received');
        const timestamp = Date.now();
        const normalizedData = {
          ...gateData,
          members: normalizeMembers(gateData.members || []),
          classes: normalizeClasses(gateData.classes || []),
        };
        ReactDOM.unstable_batchedUpdates(() => {
          setGate(normalizedData);
          setMembers(normalizedData.members);
          setStats(gateData.stats || null);
          setLastUpdated(timestamp);
        });

        if (gateItemCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = gateItemCache.keys().next().value;
          gateItemCache.delete(oldestKey);
        }
        gateItemCache.set(cacheKey, { ...normalizedData, timestamp });
        return normalizedData;
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error('Fetch gate error:', err);
          return handleError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers, normalizeClasses, isCacheExpired]
  );

  const createNewGate = useCallback(
    async (gateData, retryCount = 0) => {
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
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setGates((prev) => [...prev, newGate]);
          setLastUpdated(timestamp);
        });
        gateListCache.clear();
        gateItemCache.clear();
        return newGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewGate(gateData, retryCount + 1);
        }
        console.error('Create gate error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const updateExistingGate = useCallback(
    async (gateId, gateData, retryCount = 0) => {
      if (!token || !gateId?.trim() || !gateData?.name?.trim()) {
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
        if (!updatedGate) throw new Error('Failed to update gate');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setLastUpdated(Date.now());
        });
        gateListCache.forEach((value, key) => {
          if (value.gates.some((g) => g.gate_id === gateId)) {
            gateListCache.set(key, {
              ...value,
              gates: value.gates.map((g) => (g.gate_id === gateId ? updatedGate : g)),
              timestamp: Date.now(),
            });
          }
        });
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateExistingGate(gateId, gateData, retryCount + 1);
        }
        console.error('Update gate error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const updateGateStatusById = useCallback(
    async (gateId, statusData, retryCount = 0) => {
      if (!token || !gateId?.trim() || !statusData) {
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
      try {
        const updatedGate = await updateGateStatus(gateId, statusData, token);
        if (!updatedGate) throw new Error('Failed to update gate status');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setLastUpdated(Date.now());
        });
        gateListCache.forEach((value, key) => {
          if (value.gates.some((g) => g.gate_id === gateId)) {
            gateListCache.set(key, {
              ...value,
              gates: value.gates.map((g) => (g.gate_id === gateId ? updatedGate : g)),
              timestamp: Date.now(),
            });
          }
        });
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateGateStatusById(gateId, statusData, retryCount + 1);
        }
        console.error('Update gate status error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const deleteExistingGate = useCallback(
    async (gateId, retryCount = 0) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteGate(gateId, token);
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setGates((prev) => prev.filter((g) => g.gate_id !== gateId));
          setGate((prev) => (prev?.gate_id === gateId ? null : prev));
          setLastUpdated(Date.now());
        });
        gateListCache.forEach((value, key) => {
          if (value.gates.some((g) => g.gate_id === gateId)) {
            gateListCache.set(key, {
              ...value,
              gates: value.gates.filter((g) => g.gate_id !== gateId),
              timestamp: Date.now(),
            });
          }
        });
        gateItemCache.delete(cacheKey);
        return true;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return deleteExistingGate(gateId, retryCount + 1);
        }
        console.error('Delete gate error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const addMemberToGate = useCallback(
    async (gateId, { username, role = 'viewer' }, retryCount = 0) => {
      if (!token || !gateId?.trim() || !username?.trim()) {
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
        const updatedGate = await addGateMember(gateId, { username, role }, token);
        if (!updatedGate) throw new Error('Failed to add member');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(updatedGate.members));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setLastUpdated(Date.now());
        });
        gateListCache.clear();
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return addMemberToGate(gateId, { username, role }, retryCount + 1);
        }
        console.error('Add member error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  const removeMemberFromGate = useCallback(
    async (gateId, username, retryCount = 0) => {
      if (!token || !gateId?.trim() || !username?.trim()) {
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
        const updatedGate = await removeGateMember(gateId, username, token);
        if (!updatedGate) throw new Error('Failed to remove member');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(updatedGate.members));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setLastUpdated(Date.now());
        });
        gateListCache.clear();
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return removeMemberFromGate(gateId, username, retryCount + 1);
        }
        console.error('Remove member error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  const updateMemberRole = useCallback(
    async (gateId, username, role, retryCount = 0) => {
      if (!token || !gateId?.trim() || !username?.trim() || !role?.trim()) {
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
        const updatedGate = await updateGateMember(gateId, username, { role }, token);
        if (!updatedGate) throw new Error('Failed to update member role');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(updatedGate.members));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setLastUpdated(Date.now());
        });
        gateListCache.clear();
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateMemberRole(gateId, username, role, retryCount + 1);
        }
        console.error('Update member role error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  const fetchGateMembersList = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchGateMembers(gateId, token, signal);
        if (!data) throw new Error('No members data received');
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(data.members));
          setLastUpdated(Date.now());
        });
        return data;
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error('Fetch gate members error:', err);
          return handleError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  const toggleFavoriteGate = useCallback(
    async (gateId, isFavorited, retryCount = 0) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedGate = isFavorited ? await unfavoriteGate(gateId, token) : await favoriteGate(gateId, token);
        if (!updatedGate) throw new Error('Failed to toggle favorite status');
        const cacheKey = `${CACHE_VERSION}:${gateId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
          setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
          setLastUpdated(Date.now());
        });
        gateListCache.forEach((value, key) => {
          if (value.gates.some((g) => g.gate_id === gateId)) {
            gateListCache.set(key, {
              ...value,
              gates: value.gates.map((g) => (g.gate_id === gateId ? updatedGate : g)),
              timestamp: Date.now(),
            });
          }
        });
        gateItemCache.set(cacheKey, { ...updatedGate, timestamp: Date.now() });
        return updatedGate;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return toggleFavoriteGate(gateId, isFavorited, retryCount + 1);
        }
        console.error('Toggle favorite error:', err);
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  useEffect(() => {
    if (!token) {
      cleanup();
      resetState();
      return;
    }

    abortControllerRef.current = new AbortController();
    debouncedFetchGatesList({}, abortControllerRef.current.signal).catch((err) => {
      if (err.name !== 'CanceledError' && err.message !== 'canceled') {
        console.error('Initial fetch gates error:', err);
      }
    });

    return () => {
      cleanup();
    };
  }, [token, debouncedFetchGatesList, resetState, cleanup]);

  return useMemo(
    () => ({
      gates,
      gate,
      members,
      stats,
      pagination,
      loading,
      error,
      lastUpdated,
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
      lastUpdated,
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

export default useGates;