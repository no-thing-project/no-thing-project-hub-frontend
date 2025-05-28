import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
} from '../api/classesApi';
import { debounce } from 'lodash';
import isEqual from 'lodash/isEqual';

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  CLASS_ID_MISSING: 'Class ID is missing.',
  CLASS_NAME_MISSING: 'Class name is missing.',
  CLASS_NOT_FOUND: 'Class not found.',
  STATUS_DATA_MISSING: 'Status data is missing.',
  USERNAME_MISSING: 'Username is missing.',
  ROLE_MISSING: 'Role is missing.',
  GATE_ID_MISSING: 'Gate ID is missing for public class.',
  DATA_MISSING: 'Required data is missing.',
  MEMBER_LIMIT_EXCEEDED: 'Member limit exceeded.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded, please try again later.',
  GENERIC: 'An error occurred.',
};

// Constants for cache
const MAX_CACHE_SIZE = 10;
const CACHE_VERSION = 'v1';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Cache for class lists and items
const classListCache = new Map();
const classItemCache = new Map();

/**
 * Hook for managing classes and their members
 * @param {string|null} token - Authorization token
 * @param {function} onLogout - Function to handle logout
 * @param {function} navigate - Function for navigation
 * @returns {object} Object with states and methods for class operations
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
   * Handle authentication errors with retry for 429
   * @param {Error} err - Error object
   * @param {number} [retryCount=0] - Retry count
   * @returns {null} Always returns null
   */
  const handleAuthError = useCallback(
    async (err, retryCount = 0) => {
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
          ? ERROR_MESSAGES.CLASS_NOT_FOUND
          : err.message || ERROR_MESSAGES.GENERIC
      );
      return null;
    },
    [onLogout, navigate]
  );

  /**
   * Reset hook state
   * @param {boolean} [fullReset=true] - Whether to reset all states
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
   * Normalize class members data
   * @param {Array} members - Array of members
   * @returns {Array} Normalized array of members
   */
  const normalizeMembers = useCallback((members = []) => {
    return members.map((member) => ({
      member_id: member.member_id || member.anonymous_id || '',
      username: member.username || 'Unknown',
      role: member.role || 'viewer',
      joined_at: member.joined_at || null,
      avatar: member.avatar || null,
      total_points: member.total_points || 0,
      anonymous_id: member.anonymous_id || member.member_id || '',
    }));
  }, []);

  /**
   * Check if cache entry is expired
   * @param {object} cacheEntry - Cache entry with timestamp
   * @returns {boolean} True if expired
   */
  const isCacheExpired = useCallback((cacheEntry) => {
    return Date.now() - cacheEntry.timestamp > CACHE_EXPIRY_MS;
  }, []);

  /**
   * Fetch list of classes with caching
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Classes data or null if error
   */
  const fetchClassesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${JSON.stringify(filters)}`;
      if (classListCache.has(cacheKey) && !isCacheExpired(classListCache.get(cacheKey))) {
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
        if (!data) throw new Error('No data received');
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
        if (err.name !== 'AbortError') {
          console.error('Fetch classes error:', err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, isCacheExpired]
  );

  /**
   * Fetch classes by gate ID
   * @param {string} gateId - Gate ID
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Classes data or null if error
   */
  const fetchClassesByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:gate:${gateId}:${JSON.stringify(filters)}`;
      if (classListCache.has(cacheKey) && !isCacheExpired(classListCache.get(cacheKey))) {
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
        if (!data) throw new Error('No data received');
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
        if (err.name !== 'AbortError') {
          console.error('Fetch classes by gate error:', err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, isCacheExpired]
  );

  /**
   * Fetch a single class by ID
   * @param {string} classId - Class ID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Class data or null if error
   */
  const fetchClass = useCallback(
    async (classId, signal) => {
      if (!token || !classId?.trim()) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${classId}`;
      if (classItemCache.has(cacheKey) && !isCacheExpired(classItemCache.get(cacheKey))) {
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
        const classData = await fetchClassById(classId, token, signal);
        if (!classData) throw new Error('No class data received');
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setClassItem(classData);
          setMembers(normalizeMembers(classData.members || []));
          setStats(classData.stats || null);
          setLastUpdated(timestamp);
        });

        if (classItemCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = classItemCache.keys().next().value;
          classItemCache.delete(oldestKey);
        }
        classItemCache.set(cacheKey, { ...classData, timestamp });
        return classData;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Fetch class error:', err);
          return handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers, isCacheExpired]
  );

  /**
   * Debounced fetch class members list
   */
  const debouncedFetchClassMembers = useMemo(
    () =>
      debounce(async (classId, signal, callback) => {
        if (!token || !classId?.trim()) {
          setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
          callback(null);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const data = await fetchClassMembers(classId, token, signal);
          if (!data) throw new Error('No members data received');
          const normalized = normalizeMembers(data.members);
          if (!isEqual(members, normalized)) {
            ReactDOM.unstable_batchedUpdates(() => {
              setMembers(normalized);
              setLastUpdated(Date.now());
            });
          }
          callback(data);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Fetch class members error:', err);
            handleAuthError(err);
            callback(null);
          }
        } finally {
          setLoading(false);
        }
      }, 500),
    [token, handleAuthError, normalizeMembers, members]
  );

  /**
   * Fetch class members list
   * @param {string} classId - Class ID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Members data or null if error
   */
  const fetchClassMembersList = useCallback(
    (classId, signal) =>
      new Promise((resolve) => {
        debouncedFetchClassMembers(classId, signal, resolve);
      }),
    [debouncedFetchClassMembers]
  );

  /**
   * Create a new class
   * @param {object} classData - Class data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Created class or null if error
   */
  const createNewClass = useCallback(
    async (classData, retryCount = 0) => {
      if (!token || !classData?.name?.trim()) {
        setError(token ? ERROR_MESSAGES.CLASS_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }
      if (classData.is_public && !classData.gate_id?.trim()) {
        setError(ERROR_MESSAGES.GATE_ID_MISSING);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        let newClass;
        if (classData.is_public && classData.gate_id) {
          const { gate_id, ...cleanedClassData } = classData;
          newClass = await createClassInGate(gate_id, cleanedClassData, token);
        } else {
          newClass = await createClass(
            {
              ...classData,
              visibility: classData.visibility || 'private',
              settings: {
                max_members: classData.settings?.max_members || 100,
                board_creation_cost: classData.settings?.board_creation_cost || 50,
                ai_moderation_enabled: classData.settings?.ai_moderation_enabled ?? true,
                auto_archive_after: classData.settings?.auto_archive_after || 30,
                ...classData.settings,
              },
            },
            token
          );
        }
        if (!newClass) throw new Error('Failed to create class');
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setClasses((prev) => [...prev, newClass]);
          setLastUpdated(timestamp);
        });
        classListCache.clear();
        classItemCache.clear();
        return newClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewClass(classData, retryCount + 1);
        }
        console.error('Create class error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Update an existing class
   * @param {string} classId - Class ID
   * @param {object} classData - Updated class data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const updateExistingClass = useCallback(
    async (classId, classData, retryCount = 0) => {
      if (!token || !classId?.trim() || !classData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : ERROR_MESSAGES.CLASS_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const { class_id, ...updateData } = classData;
        const updatedClass = await updateClass(classId, updateData, token);
        if (!updatedClass) throw new Error('Failed to update class');
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
        console.error('Update class error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Update class status
   * @param {string} classId - Class ID
   * @param {object} statusData - Status data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const updateClassStatusById = useCallback(
    async (classId, statusData, retryCount = 0) => {
      if (!token || !classId?.trim() || !statusData) {
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
        if (!updatedClass) throw new Error('Failed to update class status');
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
        console.error('Update class status error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Delete an existing class
   * @param {string} classId - Class ID
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<boolean|null>} True if deleted, null if error
   */
  const deleteExistingClass = useCallback(
    async (classId, retryCount = 0) => {
      if (!token || !classId?.trim()) {
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
        console.error('Delete class error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Add a member to a class
   * @param {string} classId - Class ID
   * @param {object} memberData - Member data { username, role }
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const addMemberToClass = useCallback(
    async (classId, { username, role = 'viewer' }, retryCount = 0) => {
      if (!token || !classId?.trim() || !username?.trim()) {
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
        const updatedClass = await addClassMember(classId, { username, role }, token);
        if (!updatedClass) throw new Error('Failed to add member');
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        const normalizedMembers = normalizeMembers(updatedClass.members);
        if (!isEqual(members, normalizedMembers)) {
          ReactDOM.unstable_batchedUpdates(() => {
            setMembers(normalizedMembers);
            setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
            setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
            setLastUpdated(Date.now());
          });
        }
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return addMemberToClass(classId, { username, role }, retryCount + 1);
        }
        console.error('Add member error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers, members]
  );

  /**
   * Remove a member from a class
   * @param {string} classId - Class ID
   * @param {string} username - Username
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const removeMemberFromClass = useCallback(
    async (classId, username, retryCount = 0) => {
      if (!token || !classId?.trim() || !username?.trim()) {
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
        const updatedClass = await removeClassMember(classId, username, token);
        if (!updatedClass) throw new Error('Failed to remove member');
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        const normalizedMembers = normalizeMembers(updatedClass.members);
        if (!isEqual(members, normalizedMembers)) {
          ReactDOM.unstable_batchedUpdates(() => {
            setMembers(normalizedMembers);
            setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
            setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
            setLastUpdated(Date.now());
          });
        }
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return removeMemberFromClass(classId, username, retryCount + 1);
        }
        console.error('Remove member error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers, members]
  );

  /**
   * Update a member's role in a class
   * @param {string} classId - Class ID
   * @param {string} username - Username
   * @param {string} role - New role
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const updateMemberRole = useCallback(
    async (classId, username, role, retryCount = 0) => {
      if (!token || !classId?.trim() || !username?.trim() || !role?.trim()) {
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
        const updatedClass = await updateClassMember(classId, username, { role }, token);
        if (!updatedClass) throw new Error('Failed to update member role');
        const cacheKey = `${CACHE_VERSION}:${classId}`;
        const normalizedMembers = normalizeMembers(updatedClass.members);
        if (!isEqual(members, normalizedMembers)) {
          ReactDOM.unstable_batchedUpdates(() => {
            setMembers(normalizedMembers);
            setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
            setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
            setLastUpdated(Date.now());
          });
        }
        classItemCache.set(cacheKey, { ...updatedClass, timestamp: Date.now() });
        return updatedClass;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateMemberRole(classId, username, role, retryCount + 1);
        }
        console.error('Update member role error:', err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, normalizeMembers, members]
  );

  /**
   * Toggle favorite status for a class
   * @param {string} classId - Class ID
   * @param {boolean} isFavorited - Current favorite status
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated class or null if error
   */
  const toggleFavoriteClass = useCallback(
    async (classId, isFavorited, retryCount = 0) => {
      if (!token || !classId?.trim()) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedClass = isFavorited
          ? await unfavoriteClass(classId, token)
          : await favoriteClass(classId, token);
        if (!updatedClass) throw new Error('Failed to toggle favorite status');
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
        console.error('Toggle favorite error:', err);
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
      classListCache.clear();
      classItemCache.clear();
      resetState();
      return;
    }

    const controller = new AbortController();
    let timeoutId;

    const fetchData = async () => {
      try {
        await fetchClassesList({}, controller.signal);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Initial fetch classes error:', err);
        }
      }
    };

    // Debounce fetch to prevent multiple rapid calls
    timeoutId = setTimeout(fetchData, 100);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      debouncedFetchClassMembers.cancel();
    };
  }, [token, fetchClassesList, resetState, debouncedFetchClassMembers]);

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

export default useClasses;