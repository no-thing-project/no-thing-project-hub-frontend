/**
 * @module useBoards
 * @description React hook for managing boards and their members with caching and debounced API calls.
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import debounce from 'lodash/debounce';
import {
  fetchBoards,
  fetchBoardsByGateId,
  fetchBoardsByClassId,
  fetchBoardById,
  createBoard,
  createBoardInGate,
  createBoardInClass,
  createBoardInBoard,
  updateBoard,
  updateBoardStatus,
  deleteBoard,
  addMember,
  removeMember,
  updateMember,
  favoriteBoard,
  unfavoriteBoard,
  fetchBoardMembers,
} from '../api/boardsApi';

// Constants
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  BOARD_ID_MISSING: 'Board ID is missing.',
  BOARD_NAME_MISSING: 'Board name is missing.',
  BOARD_NOT_FOUND: 'Board not found.',
  STATUS_DATA_MISSING: 'Status data is missing.',
  USERNAME_MISSING: 'Username is missing.',
  ROLE_MISSING: 'Role is missing.',
  GATE_ID_MISSING: 'Gate ID is required.',
  CLASS_ID_MISSING: 'Class ID is required.',
  PARENT_BOARD_ID_MISSING: 'Parent board ID is required.',
  GENERIC: 'An error occurred.',
};

const CONFIG = {
  MAX_CACHE_SIZE: 10,
  CACHE_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
  DEBOUNCE_MS: 300,
  DEFAULT_LIMIT: 50,
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

const boardCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

/**
 * Hook for managing boards and their members.
 * @param {string|null} token - Authentication token.
 * @param {function} onLogout - Logout callback.
 * @param {function} navigate - Navigation callback.
 * @param {boolean} skipInitialFetch - Skip initial boards fetch.
 * @returns {object} Board management functions and state.
 */
export const useBoards = (token, onLogout, navigate, skipInitialFetch = false) => {
  const [boards, setBoards] = useState([]);
  const [boardItem, setBoardItem] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
  const [gateInfo, setGateInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
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
    setBoards([]);
    setBoardItem(null);
    setMembers([]);
    setPagination({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
    setGateInfo(null);
    setClassInfo(null);
    setError(null);
    boardCache.clear();
  }, []);

  const fetchBoardsList = useCallback(async (filters = {}, signal, append = false) => {
    if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);

    const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
    const cacheKey = `${CONFIG.CACHE_VERSION}:boards:${JSON.stringify({ ...filters, page, limit })}`;
    const cachedData = boardCache.get(cacheKey);

    if (cachedData && !append) {
      setBoards(cachedData.boards || []);
      setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
      setGateInfo(null);
      setClassInfo(null);
      return Promise.resolve(cachedData);
    }
    setError(null);

    try {
      const data = await fetchBoards(token, { ...filters, page, limit }, signal);
      if (!data) throw new Error('No data received');
      const newBoards = data.boards || [];
      setBoards((prev) => (append ? [...prev, ...newBoards] : newBoards));
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        hasMore: newBoards.length === limit,
      });
      setGateInfo(null);
      setClassInfo(null);
      boardCache.set(cacheKey, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const debouncedFetchBoardsList = useMemo(() => {
    return debounce((filters, signal, append, callback) => {
      fetchBoardsList(filters, signal, append)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchBoardsList]);

  const fetchBoardsByGate = useCallback(async (gateId, filters = {}, signal, append = false) => {
    if (!token || !gateId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
    const cacheKey = `${CONFIG.CACHE_VERSION}:gate:${gateId}:${JSON.stringify({ ...filters, page, limit })}`;
    const cachedData = boardCache.get(cacheKey);

    if (cachedData && !append) {
      setBoards(cachedData.boards || []);
      setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
      setGateInfo(cachedData.gate || null);
      setClassInfo(null);
      return Promise.resolve(cachedData);
    }

    setError(null);

    try {
      const data = await fetchBoardsByGateId(gateId, token, { ...filters, page, limit }, signal);
      if (!data) throw new Error('No data received');
      const newBoards = data.boards || [];
      setBoards((prev) => (append ? [...prev, ...newBoards] : newBoards));
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        hasMore: newBoards.length === limit,
      });
      setGateInfo(data.gate || null);
      setClassInfo(null);
      boardCache.set(cacheKey, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const debouncedFetchBoardsByGate = useMemo(() => {
    return debounce((gateId, filters, signal, append, callback) => {
      fetchBoardsByGate(gateId, filters, signal, append)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchBoardsByGate]);

  const fetchBoardsByClass = useCallback(async (classId, filters = {}, signal, append = false) => {
    if (!token || !classId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
    const cacheKey = `${CONFIG.CACHE_VERSION}:class:${classId}:${JSON.stringify({ ...filters, page, limit })}`;
    const cachedData = boardCache.get(cacheKey);

    if (cachedData && !append) {
      setBoards(cachedData.boards || []);
      setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
      setClassInfo(cachedData.class || null);
      setGateInfo(null);
      return Promise.resolve(cachedData);
    }

    setError(null);

    try {
      const data = await fetchBoardsByClassId(classId, token, { ...filters, page, limit }, signal);
      if (!data) throw new Error('No data received');
      const newBoards = data.boards || [];
      setBoards((prev) => (append ? [...prev, ...newBoards] : newBoards));
      setPagination({
        page: data.pagination?.page || page,
        limit: data.pagination?.limit || limit,
        total: data.pagination?.total || 0,
        hasMore: newBoards.length === limit,
      });
      setClassInfo(data.class || null);
      setGateInfo(null);
      boardCache.set(cacheKey, data);
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const debouncedFetchBoardsByClass = useMemo(() => {
    return debounce((classId, filters, signal, append, callback) => {
      fetchBoardsByClass(classId, filters, signal, append)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchBoardsByClass]);

  const fetchBoard = useCallback(async (boardId, signal) => {
    if (!token || !boardId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    const cacheKey = `${CONFIG.CACHE_VERSION}:board:${boardId}`;
    const cachedData = boardCache.get(cacheKey);

    if (cachedData) {
      setBoardItem(cachedData);
      setMembers(normalizeMembers(cachedData.members));
      return Promise.resolve(cachedData);
    }

    setError(null);

    try {
      const boardData = await fetchBoardById(boardId, token, signal);
      if (!boardData) throw new Error('No board data received');
      setBoardItem(boardData);
      setMembers(normalizeMembers(boardData.members || []));
      boardCache.set(cacheKey, boardData);
      return Promise.resolve(boardData);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.BOARD_NOT_FOUND);
    }
  }, [token, handleError, normalizeMembers]);

  const fetchBoardMembersList = useCallback(async (boardId, signal) => {
    if (!token || !boardId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setError(null);

    try {
      const data = await fetchBoardMembers(boardId, token, signal);
      if (!data) throw new Error('No members data received');
      setMembers(normalizeMembers(data.members));
      return Promise.resolve(data);
    } catch (err) {
      if (err.name === 'AbortError') return Promise.resolve(null);
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError, normalizeMembers]);

  const debouncedFetchBoardMembersList = useMemo(() => {
    return debounce((boardId, signal, callback) => {
      fetchBoardMembersList(boardId, signal)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchBoardMembersList]);

  const createNewBoard = useCallback(async (boardData) => {
    if (!token || !boardData?.name?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.BOARD_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setError(null);

    try {
      const newBoard = await createBoard(
        {
          ...boardData,
          visibility: boardData.visibility || 'private',
          type: boardData.type || 'personal',
          settings: {
            max_tweets: boardData.settings?.max_tweets || 100,
            max_members: boardData.settings?.max_members || 50,
            tweet_cost: boardData.settings?.tweet_cost || 1,
            favorite_cost: boardData.settings?.favorite_cost || 1,
            points_to_creator: boardData.settings?.points_to_creator || 1,
            allow_invites: boardData.settings?.allow_invites ?? true,
            require_approval: boardData.settings?.require_approval ?? false,
            ai_moderation_enabled: boardData.settings?.ai_moderation_enabled ?? true,
            auto_archive_after: boardData.settings?.auto_archive_after || 30,
            ...boardData.settings,
          },
        },
        token
      );
      if (!newBoard) throw new Error('Failed to create board');
      setBoards((prev) => [...prev, newBoard]);
      boardCache.clear();
      return Promise.resolve(newBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const createNewBoardInGate = useCallback(async (gateId, boardData) => {
    if (!token || !gateId?.trim() || !boardData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !gateId ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.BOARD_NAME_MISSING);
    }

    setError(null);

    try {
      const newBoard = await createBoardInGate(gateId, boardData, token);
      if (!newBoard) throw new Error('Failed to create board in gate');
      setBoards((prev) => [...prev, newBoard]);
      boardCache.clear();
      return Promise.resolve(newBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const createNewBoardInClass = useCallback(async (classId, boardData) => {
    if (!token || !classId?.trim() || !boardData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !classId ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.BOARD_NAME_MISSING);
    }

    setError(null);

    try {
      const { class_id, ...cleanedBoardData } = boardData;
      const newBoard = await createBoardInClass(classId, cleanedBoardData, token);
      if (!newBoard) throw new Error('Failed to create board in class');
      setBoards((prev) => [...prev, newBoard]);
      boardCache.clear();
      return Promise.resolve(newBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const createNewBoardInBoard = useCallback(async (parentBoardId, boardData) => {
    if (!token || !parentBoardId?.trim() || !boardData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !parentBoardId ? ERROR_MESSAGES.PARENT_BOARD_ID_MISSING : ERROR_MESSAGES.BOARD_NAME_MISSING);
    }

    setError(null);

    try {
      const newBoard = await createBoardInBoard(parentBoardId, boardData, token);
      if (!newBoard) throw new Error('Failed to create board in board');
      setBoards((prev) => [...prev, newBoard]);
      boardCache.clear();
      return Promise.resolve(newBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const updateExistingBoard = useCallback(async (boardId, boardData) => {
    if (!token || !boardId?.trim() || !boardData?.name?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !boardId ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.BOARD_NAME_MISSING);
    }

    setError(null);

    try {
      const { board_id, ...updateData } = boardData;
      const updatedBoard = await updateBoard(boardId, updateData, token);
      if (!updatedBoard) throw new Error('Failed to update board');
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const updateBoardStatusById = useCallback(async (boardId, statusData) => {
    if (!token || !boardId?.trim() || !statusData) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !boardId ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.STATUS_DATA_MISSING);
    }

    setError(null);

    try {
      const updatedBoard = await updateBoardStatus(boardId, statusData, token);
      if (!updatedBoard) throw new Error('Failed to update board status');
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const deleteExistingBoard = useCallback(async (boardId) => {
    if (!token || !boardId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setError(null);

    try {
      await deleteBoard(boardId, token);
      setBoards((prev) => prev.filter((b) => b.board_id !== boardId));
      setBoardItem((prev) => (prev?.board_id === boardId ? null : prev));
      boardCache.clear();
      return Promise.resolve(true);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  const addMemberToBoard = useCallback(async (boardId, { username, role = 'viewer' }) => {
    if (!token || !boardId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !boardId ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setError(null);

    try {
      const updatedBoard = await addMember(boardId, { username, role }, token);
      if (!updatedBoard) throw new Error('Failed to add member');
      setMembers(normalizeMembers(updatedBoard.members));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError, normalizeMembers]);

  const removeMemberFromBoard = useCallback(async (boardId, username) => {
    if (!token || !boardId?.trim() || !username?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !boardId ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.USERNAME_MISSING);
    }

    setError(null);

    try {
      const updatedBoard = await removeMember(boardId, username, token);
      if (!updatedBoard) throw new Error('Failed to remove member');
      setMembers(normalizeMembers(updatedBoard.members));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError, normalizeMembers]);

  const updateMemberRole = useCallback(async (boardId, username, role) => {
    if (!token || !boardId?.trim() || !username?.trim() || !role?.trim()) {
      return handleError(new Error(), !token ? ERROR_MESSAGES.AUTH_REQUIRED : !boardId ? ERROR_MESSAGES.BOARD_ID_MISSING : !username ? ERROR_MESSAGES.USERNAME_MISSING : ERROR_MESSAGES.ROLE_MISSING);
    }

    setError(null);

    try {
      const updatedBoard = await updateMember(boardId, username, { role }, token);
      if (!updatedBoard) throw new Error('Failed to update member role');
      setMembers(normalizeMembers(updatedBoard.members));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError, normalizeMembers]);

  const toggleFavoriteBoard = useCallback(async (boardId, isFavorited) => {
    if (!token || !boardId?.trim()) {
      return handleError(new Error(), token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
    }

    setError(null);

    try {
      const updatedBoard = isFavorited ? await unfavoriteBoard(boardId, token) : await favoriteBoard(boardId, token);
      if (!updatedBoard) throw new Error('Failed to toggle favorite status');
      setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
      setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
      boardCache.clear();
      return Promise.resolve(updatedBoard);
    } catch (err) {
      return handleError(err, ERROR_MESSAGES.GENERIC);
    }
  }, [token, handleError]);

  useEffect(() => {
    if (!token || skipInitialFetch) {
      resetState();
      return;
    }

    const controller = new AbortController();
    debouncedFetchBoardsList({}, controller.signal, false, (err, result) => {
      if (err && err.name !== 'AbortError') {
        setError(err.message || ERROR_MESSAGES.GENERIC);
      }
    });

    return () => {
      controller.abort();
      debouncedFetchBoardsList.cancel();
      debouncedFetchBoardMembersList.cancel();
    };
  }, [token, skipInitialFetch, resetState, debouncedFetchBoardsList, debouncedFetchBoardMembersList]);

  return useMemo(() => ({
    boards,
    boardItem,
    members,
    pagination,
    gateInfo,
    classInfo,
    error,
    fetchBoardsList: debouncedFetchBoardsList,
    fetchBoardsByGate: debouncedFetchBoardsByGate,
    fetchBoardsByClass: debouncedFetchBoardsByClass,
    fetchBoard,
    createNewBoard,
    createNewBoardInGate,
    createNewBoardInClass,
    createNewBoardInBoard,
    updateExistingBoard,
    updateBoardStatusById,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    fetchBoardMembersList: debouncedFetchBoardMembersList,
    toggleFavoriteBoard,
    resetState,
  }), [
    boards,
    boardItem,
    members,
    pagination,
    gateInfo,
    classInfo,
    error,
    debouncedFetchBoardsList,
    debouncedFetchBoardsByGate,
    debouncedFetchBoardsByClass,
    fetchBoard,
    createNewBoard,
    createNewBoardInGate,
    createNewBoardInClass,
    createNewBoardInBoard,
    updateExistingBoard,
    updateBoardStatusById,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    debouncedFetchBoardMembersList,
    toggleFavoriteBoard,
    resetState,
  ]);
};

export default useBoards;