/**
 * @module useClasses
 * @description React hook for managing classes and their members with caching and debounced API calls.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
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

// Constants
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  CLASS_ID_MISSING: 'Class ID is missing.',
  CLASS_NAME_MISSING: 'Class name is missing.',
  CLASS_NOT_FOUND: 'Class not found.',
  STATUS_DATA_MISSING: 'Status data is missing.',
  USERNAME_MISSING: 'Username is missing.',
  ROLE_MISSING: 'Role is missing.',
  GATE_ID_MISSING: 'Gate ID is required for public class.',
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

const classCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

/**
 * Hook for managing classes and their members.
 * @param {string|null} token - Authentication token.
 * @param {function} onLogout - Logout callback.
 * @param {function} navigate - Navigation callback.
 * @param {boolean} skipInitialFetch - Skip initial classes fetch.
 * @returns {object} Class management functions and state.
 */
export const useClasses = (token, onLogout, navigate, skipInitialFetch = false) => {
  const [classes, setClasses] = useState([]);
  const [classItem, setClassItem] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleError = useCallback((err, message) => {
    if (err.name === 'AbortError') return Promise.reject(err);
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
      member_id: member.member_id || member.anonymous_id || '',
      username: member.username || 'Unknown',
      role: member.role || 'viewer',
      joined_at: member.joined_at || null,
      avatar: member.avatar || null,
      total_points: member.total_points || 0,
      anonymous_id: member.anonymous_id || member.member_id || '',
    }));
  }, []);

  const resetState = useCallback(() => {
    setClasses([]);
    setClassItem(null);
    setMembers([]);
    setStats(null);
    setPagination({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
    setError(null);
    classCache.clear();
  }, []);

  const fetchClassesList = useCallback(async (filters = {}, signal, append = false, callback = () => {}) => {
    if (!token) {
      const err = new Error(ERROR_MESSAGES.AUTH_REQUIRED);
      callback(err);
      return handleError(err, ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
    const cacheKey = `${CONFIG.CACHE_VERSION}:classes:${JSON.stringify({ ...filters, page, limit })}`;
    const cachedData = classCache.get(cacheKey);

    if (cachedData && !append) {
      setClasses(cachedData.classes || []);
      setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
      callback(null, cachedData);
      return Promise.resolve(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchClasses(token, { ...filters, page, limit }, signal);
      if (!data) throw new Error('No data received');
      const newClasses = data.classes || [];
      setClasses((prev) => (append ? [...prev, ...newClasses] : newClasses));
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        hasMore: newClasses.length === limit,
      });
      classCache.set(cacheKey, data);
      callback(null, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        callback(err);
        return Promise.resolve(null);
      }
      callback(err);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const debouncedFetchClassesList = useMemo(() => {
    return debounce((filters, signal, append, callback) => {
      if (typeof callback !== 'function') {
        console.error('debouncedFetchClassesList: callback is not a function, providing default callback');
        callback = () => {};
      }
      fetchClassesList(filters, signal, append, callback);
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchClassesList]);

  const fetchClassesByGate = useCallback(async (gateId, filters = {}, signal, append = false, callback = () => {}) => {
    if (!token || !gateId?.trim()) {
      const err = new Error(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
      callback(err);
      return handleError(err, token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const cacheKey = `${CONFIG.CACHE_VERSION}:gate:${gateId}:${JSON.stringify(filters)}`;
    const cachedData = classCache.get(cacheKey);

    if (cachedData && !append) {
      setClasses(cachedData.classes || []);
      setPagination(cachedData.pagination || { page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
      callback(null, cachedData);
      return Promise.resolve(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchClassesByGateId(gateId, token, filters, signal);
      if (!data) throw new Error('No data received');
      const newClasses = data.classes || [];
      setClasses((prev) => (append ? [...prev, ...newClasses] : newClasses));
      setPagination({
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || CONFIG.DEFAULT_LIMIT,
        total: data.pagination?.total || 0,
        hasMore: newClasses.length === CONFIG.DEFAULT_LIMIT,
      });
      classCache.set(cacheKey, data);
      callback(null, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        callback(err);
        return Promise.resolve(null);
      }
      callback(err);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const debouncedFetchClassesByGate = useMemo(() => {
    return debounce((gateId, filters, signal, append, callback) => {
      if (typeof callback !== 'function') {
        console.error('debouncedFetchClassesByGate: callback is not a function, providing default callback');
        callback = () => {};
      }
      fetchClassesByGate(gateId, filters, signal, append, callback);
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchClassesByGate]);

  const fetchClass = useCallback(async (classId, signal, callback = () => {}) => {
    if (!token || !classId?.trim()) {
      const err = new Error(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
      callback(err);
      return handleError(err, token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const cacheKey = `${CONFIG.CACHE_VERSION}:class:${classId}`;
    const cachedData = classCache.get(cacheKey);

    if (cachedData) {
      setClassItem(cachedData);
      setMembers(normalizeMembers(cachedData.members));
      setStats(cachedData.stats || null);
      callback(null, cachedData);
      return Promise.resolve(cachedData);
    }

    setLoading(true);
    setError(null);

    try {
      const classData = await fetchClassById(classId, token, signal);
      if (!classData) throw new Error('No class data received');
      setClassItem(classData);
      setMembers(normalizeMembers(classData.members || []));
      setStats(classData.stats || null);
      classCache.set(cacheKey, classData);
      callback(null, classData);
      return Promise.resolve(classData);
    } catch (err) {
      if (err.name === 'AbortError') {
        callback(err);
        return Promise.resolve(null);
      }
      callback(err);
      return handleError(err, ERROR_MESSAGES.CLASS_NOT_FOUND);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const fetchClassMembersList = useCallback(async (classId, signal, callback = () => {}) => {
    if (!token || !classId?.trim()) {
      const err = new Error(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
      callback(err);
      return handleError(err, token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchClassMembers(classId, token, signal);
      if (!data) throw new Error('No members data received');
      setMembers(normalizeMembers(data.members));
      callback(null, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        callback(err);
        return Promise.resolve(null);
      }
      callback(err);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const debouncedFetchClassMembersList = useMemo(() => {
    return debounce((classId, signal, callback) => {
      if (typeof callback !== 'function') {
        console.error('debouncedFetchClassMembersList: callback is not a function, providing default callback');
        callback = () => {};
      }
      fetchClassMembersList(classId, signal, callback);
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchClassMembersList]);

  const createNewClass = useCallback(async (classData) => {
    if (!token || !classData?.name?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.CLASS_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }
    if (classData.is_public && !classData.gate_id?.trim()) {
      return handleError(new Error(), ERROR_MESSAGES.GATE_ID_MISSING);
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
      setClasses((prev) => [...prev, newClass]);
      classCache.clear();
      return Promise.resolve(newClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const updateExistingClass = useCallback(async (classId, classData) => {
    if (!token || !classId?.trim() || !classData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.CLASS_NAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const { class_id, ...updateData } = classData;
      const updatedClass = await updateClass(classId, updateData, token);
      if (!updatedClass) throw new Error('Failed to update class');
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const updateClassStatusById = useCallback(async (classId, statusData) => {
    if (!token || !classId?.trim() || !statusData) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.STATUS_DATA_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedClass = await updateClassStatus(classId, statusData, token);
      if (!updatedClass) throw new Error('Failed to update class status');
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const deleteExistingClass = useCallback(async (classId) => {
    if (!token || !classId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      await deleteClass(classId, token);
      setClasses((prev) => prev.filter((c) => c.class_id !== classId));
      setClassItem((prev) => (prev?.class_id === classId ? null : prev));
      classCache.clear();
      return Promise.resolve(true);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  const addMemberToClass = useCallback(async (classId, { username, role = 'viewer' }) => {
    if (!token || !classId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedClass = await addClassMember(classId, { username, role }, token);
      if (!updatedClass) throw new Error('Failed to add member');
      setMembers(normalizeMembers(updatedClass.members));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const removeMemberFromClass = useCallback(async (classId, username) => {
    if (!token || !classId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedClass = await removeClassMember(classId, username, token);
      if (!updatedClass) throw new Error('Failed to remove member');
      setMembers(normalizeMembers(updatedClass.members));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const updateMemberRole = useCallback(async (classId, username, role) => {
    if (!token || !classId?.trim() || !username?.trim() || !role?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : !username ? ERROR_MESSAGES.USERNAME_MISSING : ERROR_MESSAGES.ROLE_MISSING);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedClass = await updateClassMember(classId, username, { role }, token);
      if (!updatedClass) throw new Error('Failed to update member role');
      setMembers(normalizeMembers(updatedClass.members));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError, normalizeMembers]);

  const toggleFavoriteClass = useCallback(async (classId, isFavorited) => {
    if (!token || !classId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setLoading(true);
    setError(null);

    try {
      const updatedClass = isFavorited ? await unfavoriteClass(classId, token) : await favoriteClass(classId, token);
      if (!updatedClass) throw new Error('Failed to toggle favorite status');
      setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
      setClassItem((prev) => (prev?.class_id === classId ? updatedClass : prev));
      classCache.clear();
      return Promise.resolve(updatedClass);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    if (!token || skipInitialFetch) {
      resetState();
      return;
    }

    const controller = new AbortController();
    debouncedFetchClassesList({}, controller.signal, false, (err, result) => {
      if (err && err.name !== 'AbortError') {
        setError(err.message || ERROR_MESSAGES.GENERIC);
      }
    });

    return () => {
      controller.abort();
      debouncedFetchClassesList.cancel();
      debouncedFetchClassesByGate.cancel();
      debouncedFetchClassMembersList.cancel();
    };
  }, [token, skipInitialFetch, resetState, debouncedFetchClassesList, debouncedFetchClassesByGate, debouncedFetchClassMembersList]);

  return useMemo(() => ({
    classes,
    classItem,
    members,
    stats,
    pagination,
    loading,
    error,
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
  }), [
    classes,
    classItem,
    members,
    stats,
    pagination,
    loading,
    error,
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
  ]);
};

export default useClasses;