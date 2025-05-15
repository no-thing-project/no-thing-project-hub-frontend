import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  fetchPoints,
  transferPoints,
  fetchTopContributors,
  updatePoints,
} from '../api/pointsApi';

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  USER_ID_MISSING: 'User ID is missing.',
  AMOUNT_MISSING: 'Points amount is missing.',
  REASON_MISSING: 'Reason for points update is missing.',
  DATA_MISSING: 'Required data is missing.',
  GENERIC: 'An error occurred.',
};

// Constants for configuration
const MAX_CACHE_SIZE = 10;
const DEBOUNCE_MS = 300;
const CACHE_VERSION = 'v1';

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

const pointsCache = new LRUCache(MAX_CACHE_SIZE);

/**
 * Hook for managing points and top contributors
 * @param {string|null} token - Authorization token
 * @param {function} onLogout - Function to handle logout
 * @param {function} navigate - Function for navigation
 * @returns {object} Object with states and methods for points operations
 */
export const usePoints = (token, onLogout, navigate) => {
  const [pointsData, setPointsData] = useState(null);
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceTimer = useRef(null);
  const abortControllers = useRef(new Set());

  // Centralized error handling
  const handleError = useCallback(
    (err, customMessage) => {
      if (err.name === 'AbortError') return null;
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout('Your session has expired. Please log in again.');
        navigate('/login');
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

  // Normalize top contributors data
  const normalizeContributors = useCallback((contributors = []) => {
    return contributors.map((contributor) => ({
      member_id: contributor.member_id || contributor.anonymous_id || '',
      username: contributor.username || 'Unknown',
      total_points: contributor.total_points || 0,
      avatar: contributor.avatar || null,
      anonymous_id: contributor.anonymous_id || contributor.member_id || '',
    }));
  }, []);

  // Reset hook state
  const resetState = useCallback(() => {
    setPointsData(null);
    setTopContributors([]);
    setError(null);
    pointsCache.clear();
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

  // Fetch points data with caching
  const fetchPointsData = useCallback(
    async (signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:points`;
      const cachedData = pointsCache.get(cacheKey);
      if (cachedData) {
        setPointsData(cachedData);
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPoints(token, signal);
        if (!data) throw new Error('No points data received');
        setPointsData(data);
        pointsCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const debouncedFetchPointsData = useMemo(
    () => debounce(fetchPointsData, DEBOUNCE_MS),
    [fetchPointsData]
  );

  // Fetch top contributors with caching
  const fetchTopContributorsList = useCallback(
    async (limit = 10, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:topContributors:${limit}`;
      const cachedData = pointsCache.get(cacheKey);
      if (cachedData) {
        setTopContributors(normalizeContributors(cachedData));
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchTopContributors(token, limit, signal);
        if (!data) throw new Error('No contributors data received');
        setTopContributors(normalizeContributors(data));
        pointsCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeContributors]
  );

  const debouncedFetchTopContributorsList = useMemo(
    () => debounce(fetchTopContributorsList, DEBOUNCE_MS),
    [fetchTopContributorsList]
  );

  // Transfer points to another user
  const transferUserPoints = useCallback(
    async (recipientId, amount) => {
      if (!token || !recipientId?.trim() || !amount) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !recipientId
            ? ERROR_MESSAGES.USER_ID_MISSING
            : ERROR_MESSAGES.AMOUNT_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await transferPoints(recipientId, amount, token);
        if (!data) throw new Error('Failed to transfer points');
        setPointsData((prev) => ({
          ...prev,
          total_points: data.sender_points,
          donated_points: (prev?.donated_points || 0) + amount,
        }));
        pointsCache.clear();
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Update points for a user
  const updatePointsData = useCallback(
    async (targetUserId, amount, reason) => {
      if (!token || !targetUserId?.trim() || !amount || !reason?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !targetUserId
            ? ERROR_MESSAGES.USER_ID_MISSING
            : !amount
            ? ERROR_MESSAGES.AMOUNT_MISSING
            : ERROR_MESSAGES.REASON_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await updatePoints(targetUserId, amount, reason, token);
        if (!data) throw new Error('Failed to update points');
        pointsCache.clear();
        return data;
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
    debouncedFetchPointsData(controller.signal).catch((err) => {
      if (err.name !== 'AbortError') {
        console.error('Initial fetch points error:', err);
      }
    });

    return () => {
      cleanupAbortControllers();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [token, debouncedFetchPointsData, resetState, createAbortController, cleanupAbortControllers]);

  // Memoized return object
  return useMemo(
    () => ({
      pointsData,
      topContributors,
      loading,
      error,
      fetchPointsData: debouncedFetchPointsData,
      fetchTopContributorsList: debouncedFetchTopContributorsList,
      transferUserPoints,
      updatePointsData,
      resetState,
    }),
    [
      pointsData,
      topContributors,
      loading,
      error,
      debouncedFetchPointsData,
      debouncedFetchTopContributorsList,
      transferUserPoints,
      updatePointsData,
      resetState,
    ]
  );
};

export default usePoints;