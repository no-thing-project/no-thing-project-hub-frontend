import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

// Constants for error messages
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

const boardCache = new LRUCache(MAX_CACHE_SIZE);

/**
 * Hook for managing boards and their members
 * @param {string|null} token - Authorization token
 * @param {function} onLogout - Function to handle logout
 * @param {function} navigate - Function for navigation
 * @returns {object} Object with states and methods for board operations
 */
export const useBoards = (token, onLogout, navigate) => {
  const [boards, setBoards] = useState([]);
  const [boardItem, setBoardItem] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [gateInfo, setGateInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
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

  // Normalize board members data
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

  // Reset hook state
  const resetState = useCallback(() => {
    setBoards([]);
    setBoardItem(null);
    setMembers([]);
    setPagination({});
    setGateInfo(null);
    setClassInfo(null);
    setError(null);
    boardCache.clear();
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

  // Fetch list of boards with caching
  const fetchBoardsList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:boards:${JSON.stringify(filters)}`;
      const cachedData = boardCache.get(cacheKey);
      if (cachedData) {
        setBoards(cachedData.boards || []);
        setPagination(cachedData.pagination || {});
        setGateInfo(null);
        setClassInfo(null);
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoards(token, filters, signal);
        if (!data) throw new Error('No data received');
        setBoards(data.boards || []);
        setPagination(data.pagination || {});
        setGateInfo(null);
        setClassInfo(null);
        boardCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const debouncedFetchBoardsList = useMemo(
    () => debounce(fetchBoardsList, DEBOUNCE_MS),
    [fetchBoardsList]
  );

  // Fetch boards by gate ID
  const fetchBoardsByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId?.trim()) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:gate:${gateId}:${JSON.stringify(filters)}`;
      const cachedData = boardCache.get(cacheKey);
      if (cachedData) {
        setBoards(cachedData.boards || []);
        setPagination(cachedData.pagination || []);
        setGateInfo(cachedData.gate || null);
        setClassInfo(null);
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardsByGateId(gateId, token, filters, signal);
        if (!data) throw new Error('No data received');
        setBoards(data.boards || []);
        setPagination(data.pagination || {});
        setGateInfo(data.gate || null);
        setClassInfo(null);
        boardCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const debouncedFetchBoardsByGate = useMemo(
    () => debounce(fetchBoardsByGate, DEBOUNCE_MS),
    [fetchBoardsByGate]
  );

  // Fetch boards by class ID
  const fetchBoardsByClass = useCallback(
    async (classId, filters = {}, signal) => {
      if (!token || !classId?.trim()) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:class:${classId}:${JSON.stringify(filters)}`;
      const cachedData = boardCache.get(cacheKey);
      if (cachedData) {
        setBoards(cachedData.boards || []);
        setPagination(cachedData.pagination || {});
        setClassInfo(cachedData.class || null);
        setGateInfo(null);
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardsByClassId(classId, token, filters, signal);
        if (!data) throw new Error('No data received');
        setBoards(data.boards || []);
        setPagination(data.pagination || {});
        setClassInfo(data.class || null);
        setGateInfo(null);
        boardCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  const debouncedFetchBoardsByClass = useMemo(
    () => debounce(fetchBoardsByClass, DEBOUNCE_MS),
    [fetchBoardsByClass]
  );

  // Fetch a single board by ID
  const fetchBoard = useCallback(
    async (boardId, signal) => {
      if (!token || !boardId?.trim()) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:board:${boardId}`;
      const cachedData = boardCache.get(cacheKey);
      if (cachedData) {
        setBoardItem(cachedData);
        setMembers(normalizeMembers(cachedData.members));
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const [boardData, membersData] = await Promise.all([
          fetchBoardById(boardId, token, signal),
          fetchBoardMembers(boardId, token, signal),
        ]);
        if (!boardData) throw new Error('No board data received');
        const data = { ...boardData, members: membersData?.members || [] };
        setBoardItem(data);
        setMembers(normalizeMembers(data.members));
        boardCache.set(cacheKey, data);
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.BOARD_NOT_FOUND);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Create a new board
  const createNewBoard = useCallback(
    async (boardData) => {
      if (!token || !boardData?.name?.trim()) {
        setError(token ? ERROR_MESSAGES.BOARD_NAME_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
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
        return newBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Create a new board in a gate
  const createNewBoardInGate = useCallback(
    async (gateId, boardData) => {
      if (!token || !gateId?.trim() || !boardData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !gateId
            ? ERROR_MESSAGES.GATE_ID_MISSING
            : ERROR_MESSAGES.BOARD_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const newBoard = await createBoardInGate(gateId, boardData, token);
        if (!newBoard) throw new Error('Failed to create board in gate');
        setBoards((prev) => [...prev, newBoard]);
        boardCache.clear();
        return newBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Create a new board in a class
  const createNewBoardInClass = useCallback(
    async (classId, boardData) => {
      if (!token || !classId?.trim() || !boardData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !classId
            ? ERROR_MESSAGES.CLASS_ID_MISSING
            : ERROR_MESSAGES.BOARD_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const { class_id, ...cleanedBoardData } = boardData;
        const newBoard = await createBoardInClass(classId, cleanedBoardData, token);
        if (!newBoard) throw new Error('Failed to create board in class');
        setBoards((prev) => [...prev, newBoard]);
        boardCache.clear();
        return newBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Create a new board in another board
  const createNewBoardInBoard = useCallback(
    async (parentBoardId, boardData) => {
      if (!token || !parentBoardId?.trim() || !boardData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !parentBoardId
            ? ERROR_MESSAGES.PARENT_BOARD_ID_MISSING
            : ERROR_MESSAGES.BOARD_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const newBoard = await createBoardInBoard(parentBoardId, boardData, token);
        if (!newBoard) throw new Error('Failed to create board in board');
        setBoards((prev) => [...prev, newBoard]);
        boardCache.clear();
        return newBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Update an existing board
  const updateExistingBoard = useCallback(
    async (boardId, boardData) => {
      if (!token || !boardId?.trim() || !boardData?.name?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !boardId
            ? ERROR_MESSAGES.BOARD_ID_MISSING
            : ERROR_MESSAGES.BOARD_NAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const { board_id, ...updateData } = boardData;
        const updatedBoard = await updateBoard(boardId, updateData, token);
        if (!updatedBoard) throw new Error('Failed to update board');
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
        boardCache.clear();
        return updatedBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Update board status
  const updateBoardStatusById = useCallback(
    async (boardId, statusData) => {
      if (!token || !boardId?.trim() || !statusData) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !boardId
            ? ERROR_MESSAGES.BOARD_ID_MISSING
            : ERROR_MESSAGES.STATUS_DATA_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedBoard = await updateBoardStatus(boardId, statusData, token);
        if (!updatedBoard) throw new Error('Failed to update board status');
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
        boardCache.clear();
        return updatedBoard;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Delete a board
  const deleteExistingBoard = useCallback(
    async (boardId) => {
      if (!token || !boardId?.trim()) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteBoard(boardId, token);
        setBoards((prev) => prev.filter((b) => b.board_id !== boardId));
        setBoardItem((prev) => (prev?.board_id === boardId ? null : prev));
        boardCache.clear();
        return true;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError]
  );

  // Add a member to a board
  const addMemberToBoard = useCallback(
    async (boardId, { username, role = 'viewer' }) => {
      if (!token || !boardId?.trim() || !username?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !boardId
            ? ERROR_MESSAGES.BOARD_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const board = await addMember(boardId, { username, role }, token);
        if (!board) throw new Error('Failed to add member');
        setMembers(normalizeMembers(board.members));
        setBoardItem((prev) => (prev?.board_id === boardId ? board : prev));
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? board : b)));
        boardCache.clear();
        return board;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Remove a member from a board
  const removeMemberFromBoard = useCallback(
    async (boardId, username) => {
      if (!token || !boardId?.trim() || !username?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !boardId
            ? ERROR_MESSAGES.BOARD_ID_MISSING
            : ERROR_MESSAGES.USERNAME_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const board = await removeMember(boardId, username, token);
        if (!board) throw new Error('Failed to remove member');
        setMembers(normalizeMembers(board.members));
        setBoardItem((prev) => (prev?.board_id === boardId ? board : prev));
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? board : b)));
        boardCache.clear();
        return board;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Update a member's role in a board
  const updateMemberRole = useCallback(
    async (boardId, username, role) => {
      if (!token || !boardId?.trim() || !username?.trim() || !role?.trim()) {
        setError(
          !token
            ? ERROR_MESSAGES.AUTH_REQUIRED
            : !boardId
            ? ERROR_MESSAGES.BOARD_ID_MISSING
            : !username
            ? ERROR_MESSAGES.USERNAME_MISSING
            : ERROR_MESSAGES.ROLE_MISSING
        );
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const board = await updateMember(boardId, username, { role }, token);
        if (!board) throw new Error('Failed to update member role');
        setMembers(normalizeMembers(board.members));
        setBoardItem((prev) => (prev?.board_id === boardId ? board : prev));
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? board : b)));
        boardCache.clear();
        return board;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Fetch board members list
  const fetchBoardMembersList = useCallback(
    async (boardId, signal) => {
      if (!token || !boardId?.trim()) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardMembers(boardId, token, signal);
        if (!data) throw new Error('No members data received');
        setMembers(normalizeMembers(data.members));
        return data;
      } catch (err) {
        return handleError(err, ERROR_MESSAGES.GENERIC);
      } finally {
        setLoading(false);
      }
    },
    [token, handleError, normalizeMembers]
  );

  // Toggle favorite status for a board
  const toggleFavoriteBoard = useCallback(
    async (boardId, isFavorited) => {
      if (!token || !boardId?.trim()) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedBoard = isFavorited
          ? await unfavoriteBoard(boardId, token)
          : await favoriteBoard(boardId, token);
        if (!updatedBoard) throw new Error('Failed to toggle favorite status');
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
        boardCache.clear();
        return updatedBoard;
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
    debouncedFetchBoardsList({}, controller.signal).catch((err) => {
      if (err.name !== 'AbortError') {
        console.error('Initial fetch boards error:', err);
      }
    });

    return () => {
      cleanupAbortControllers();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [token, debouncedFetchBoardsList, resetState, createAbortController, cleanupAbortControllers]);

  // Memoized return object
  return useMemo(
    () => ({
      boards,
      boardItem,
      members,
      pagination,
      gateInfo,
      classInfo,
      loading,
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
      fetchBoardMembersList,
      toggleFavoriteBoard,
      resetState,
    }),
    [
      boards,
      boardItem,
      members,
      pagination,
      gateInfo,
      classInfo,
      loading,
      error,
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
      fetchBoardMembersList,
      toggleFavoriteBoard,
      resetState,
    ]
  );
};

export default useBoards;