// hooks/useBoards.js
import { useState, useCallback, useEffect, useMemo } from "react";
import ReactDOM from "react-dom";
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
  inviteUser,
  acceptInvite,
} from "../api/boardsApi";

// Constants for error messages
const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Authentication required.",
  BOARD_ID_MISSING: "Board ID is missing.",
  BOARD_NAME_MISSING: "Board name is missing.",
  BOARD_NOT_FOUND: "Board not found.",
  STATUS_DATA_MISSING: "Status data is missing.",
  USERNAME_MISSING: "Username is missing.",
  ROLE_MISSING: "Role is missing.",
  GATE_ID_MISSING: "Gate ID is missing for public board.",
  CLASS_ID_MISSING: "Class ID is missing.",
  PARENT_BOARD_ID_MISSING: "Parent board ID is missing.",
  DATA_MISSING: "Required data is missing.",
  MEMBER_LIMIT_EXCEEDED: "Member limit exceeded.",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded, please try again later.",
  GENERIC: "An error occurred.",
};

// Constants for cache
const MAX_CACHE_SIZE = 10;
const CACHE_VERSION = "v1";

// Cache for board lists and items
const boardListCache = new Map();
const boardItemCache = new Map();

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
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(
        status === 429
          ? ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
          : status === 404
          ? ERROR_MESSAGES.BOARD_NOT_FOUND
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
      setBoards([]);
      setBoardItem(null);
      setMembers([]);
      if (fullReset) setPagination({});
      setGateInfo(null);
      setClassInfo(null);
      setError(null);
      setLastUpdated(null);
      boardListCache.clear();
      boardItemCache.clear();
    });
  }, []);

  /**
   * Normalize board members data
   * @param {Array} members - Array of members
   * @returns {Array} Normalized array of members
   */
  const normalizeMembers = useCallback((members = []) => {
    return members.map((member) => ({
      username: member.username || "Unknown",
      role: member.role || "viewer",
      joined_at: member.joined_at || null,
      avatar: member.avatar || null,
      total_points: member.total_points || 0,
    }));
  }, []);

  /**
   * Fetch list of boards with caching
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Boards data or null if error
   */
  const fetchBoardsList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError(ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${JSON.stringify(filters)}`;
      if (boardListCache.has(cacheKey)) {
        const cachedData = boardListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(cachedData.boards || []);
          setPagination(cachedData.pagination || {});
          setGateInfo(null);
          setClassInfo(null);
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoards(token, filters, signal);
        if (!data) throw new Error("No data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(data.boards || []);
          setPagination(data.pagination || {});
          setGateInfo(null);
          setClassInfo(null);
          setLastUpdated(timestamp);
        });

        if (boardListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = boardListCache.keys().next().value;
          boardListCache.delete(oldestKey);
        }
        boardListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch boards error:", err);
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
   * Fetch boards by gate ID
   * @param {string} gateId - Gate UUID
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Boards data or null if error
   */
  const fetchBoardsByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId) {
        setError(token ? ERROR_MESSAGES.GATE_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:gate:${gateId}:${JSON.stringify(filters)}`;
      if (boardListCache.has(cacheKey)) {
        const cachedData = boardListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(cachedData.boards || []);
          setPagination(cachedData.pagination || {});
          setGateInfo(cachedData.gate || null);
          setClassInfo(null);
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardsByGateId(gateId, token, filters, signal);
        if (!data) throw new Error("No data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(data.boards || []);
          setPagination(data.pagination || {});
          setGateInfo(data.gate || null);
          setClassInfo(null);
          setLastUpdated(timestamp);
        });

        if (boardListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = boardListCache.keys().next().value;
          boardListCache.delete(oldestKey);
        }
        boardListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch boards by gate error:", err);
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
   * Fetch boards by class ID
   * @param {string} classId - Class UUID
   * @param {object} [filters={}] - Query filters
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Boards data or null if error
   */
  const fetchBoardsByClass = useCallback(
    async (classId, filters = {}, signal) => {
      if (!token || !classId) {
        setError(token ? ERROR_MESSAGES.CLASS_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:class:${classId}:${JSON.stringify(filters)}`;
      if (boardListCache.has(cacheKey)) {
        const cachedData = boardListCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(cachedData.boards || []);
          setPagination(cachedData.pagination || {});
          setClassInfo(cachedData.class || null);
          setGateInfo(null);
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardsByClassId(classId, token, filters, signal);
        if (!data) throw new Error("No data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards(data.boards || []);
          setPagination(data.pagination || {});
          setClassInfo(data.class || null);
          setGateInfo(null);
          setLastUpdated(timestamp);
        });

        if (boardListCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = boardListCache.keys().next().value;
          boardListCache.delete(oldestKey);
        }
        boardListCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch boards by class error:", err);
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
   * Fetch a single board by ID
   * @param {string} boardId - Board UUID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Board data or null if error
   */
  const fetchBoard = useCallback(
    async (boardId, signal) => {
      if (!token || !boardId) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      const cacheKey = `${CACHE_VERSION}:${boardId}`;
      if (boardItemCache.has(cacheKey)) {
        const cachedData = boardItemCache.get(cacheKey);
        ReactDOM.unstable_batchedUpdates(() => {
          setBoardItem(cachedData);
          setMembers(normalizeMembers(cachedData.members));
          setLastUpdated(cachedData.timestamp);
        });
        return cachedData;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardById(boardId, token, signal);
        if (!data) throw new Error("No board data received");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoardItem(data);
          setMembers(normalizeMembers(data.members));
          setLastUpdated(timestamp);
        });

        if (boardItemCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = boardItemCache.keys().next().value;
          boardItemCache.delete(oldestKey);
        }
        boardItemCache.set(cacheKey, { ...data, timestamp });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch board error:", err);
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
   * Create a new board
   * @param {object} boardData - Board data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Created board or null if error
   */
  const createNewBoard = useCallback(
    async (boardData, retryCount = 0) => {
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
            visibility: boardData.visibility || "private",
            type: boardData.type || "personal",
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
            },
          },
          token
        );
        if (!newBoard) throw new Error("Failed to create board");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => [...prev, newBoard]);
          setLastUpdated(timestamp);
        });
        boardListCache.clear();
        boardItemCache.clear();
        return newBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewBoard(boardData, retryCount + 1);
        }
        console.error("Create board error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Create a new board in a gate
   * @param {string} gateId - Gate UUID
   * @param {object} boardData - Board data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Created board or null if error
   */
  const createNewBoardInGate = useCallback(
    async (gateId, boardData, retryCount = 0) => {
      if (!token || !gateId || !boardData?.name?.trim()) {
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
        if (!newBoard) throw new Error("Failed to create board in gate");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => [...prev, newBoard]);
          setLastUpdated(timestamp);
        });
        boardListCache.clear();
        boardItemCache.clear();
        return newBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewBoardInGate(gateId, boardData, retryCount + 1);
        }
        console.error("Create board in gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Create a new board in a class
   * @param {string} classId - Class UUID
   * @param {object} boardData - Board data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Created board or null if error
   */
  const createNewBoardInClass = useCallback(
    async (classId, boardData, retryCount = 0) => {
      if (!token || !classId || !boardData?.name?.trim()) {
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
        const newBoard = await createBoardInClass(classId, boardData, token);
        if (!newBoard) throw new Error("Failed to create board in class");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => [...prev, newBoard]);
          setLastUpdated(timestamp);
        });
        boardListCache.clear();
        boardItemCache.clear();
        return newBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewBoardInClass(classId, boardData, retryCount + 1);
        }
        console.error("Create board in class error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Create a new board in another board
   * @param {string} parentBoardId - Parent board UUID
   * @param {object} boardData - Board data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Created board or null if error
   */
  const createNewBoardInBoard = useCallback(
    async (parentBoardId, boardData, retryCount = 0) => {
      if (!token || !parentBoardId || !boardData?.name?.trim()) {
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
        if (!newBoard) throw new Error("Failed to create board in board");
        const timestamp = Date.now();
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => [...prev, newBoard]);
          setLastUpdated(timestamp);
        });
        boardListCache.clear();
        boardItemCache.clear();
        return newBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createNewBoardInBoard(parentBoardId, boardData, retryCount + 1);
        }
        console.error("Create board in board error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Update an existing board
   * @param {string} boardId - Board UUID
   * @param {object} boardData - Data to update
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const updateExistingBoard = useCallback(
    async (boardId, boardData, retryCount = 0) => {
      if (!token || !boardId || !boardData?.name?.trim()) {
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
        if (!updatedBoard) throw new Error("Failed to update board");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
          setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? updatedBoard : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...updatedBoard, timestamp: Date.now() });
        return updatedBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateExistingBoard(boardId, boardData, retryCount + 1);
        }
        console.error("Update board error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Update board status
   * @param {string} boardId - Board UUID
   * @param {object} statusData - Status data
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const updateBoardStatusById = useCallback(
    async (boardId, statusData, retryCount = 0) => {
      if (!token || !boardId || !statusData) {
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
        if (!updatedBoard) throw new Error("Failed to update board status");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
          setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? updatedBoard : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...updatedBoard, timestamp: Date.now() });
        return updatedBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateBoardStatusById(boardId, statusData, retryCount + 1);
        }
        console.error("Update board status error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Delete a board
   * @param {string} boardId - Board UUID
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<boolean|null>} True if successful, null if error
   */
  const deleteExistingBoard = useCallback(
    async (boardId, retryCount = 0) => {
      if (!token || !boardId) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        await deleteBoard(boardId, token);
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => prev.filter((b) => b.board_id !== boardId));
          setBoardItem((prev) => (prev?.board_id === boardId ? null : prev));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.filter((b) => b.board_id !== boardId),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.delete(cacheKey);
        return true;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return deleteExistingBoard(boardId, retryCount + 1);
        }
        console.error("Delete board error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Add a member to a board
   * @param {string} boardId - Board UUID
   * @param {object} memberData - Member data { username, role }
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const addMemberToBoard = useCallback(
    async (boardId, { username, role = "viewer" }, retryCount = 0) => {
      if (!token || !boardId || !username?.trim()) {
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
        const boardItem = await addMember(boardId, { username, role }, token);
        if (!boardItem) throw new Error("Failed to add member");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(boardItem.members));
          setBoardItem((prev) => (prev?.board_id === boardId ? boardItem : prev));
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? boardItem : b)));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? boardItem : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...boardItem, timestamp: Date.now() });
        return boardItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return addMemberToBoard(boardId, { username, role }, retryCount + 1);
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
   * Remove a member from a board
   * @param {string} boardId - Board UUID
   * @param {string} username - Username
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const removeMemberFromBoard = useCallback(
    async (boardId, username, retryCount = 0) => {
      if (!token || !boardId || !username) {
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
        const boardItem = await removeMember(boardId, username, token);
        if (!boardItem) throw new Error("Failed to remove member");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(boardItem.members));
          setBoardItem((prev) => (prev?.board_id === boardId ? boardItem : prev));
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? boardItem : b)));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? boardItem : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...boardItem, timestamp: Date.now() });
        return boardItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return removeMemberFromBoard(boardId, username, retryCount + 1);
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
   * Update a member's role in a board
   * @param {string} boardId - Board UUID
   * @param {string} username - Username
   * @param {string} role - New role
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const updateMemberRole = useCallback(
    async (boardId, username, role, retryCount = 0) => {
      if (!token || !boardId || !username || !role) {
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
        const boardItem = await updateMember(boardId, username, { role }, token);
        if (!boardItem) throw new Error("Failed to update member role");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(boardItem.members));
          setBoardItem((prev) => (prev?.board_id === boardId ? boardItem : prev));
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? boardItem : b)));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? boardItem : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...boardItem, timestamp: Date.now() });
        return boardItem;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return updateMemberRole(boardId, username, role, retryCount + 1);
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
   * Fetch board members list
   * @param {string} boardId - Board UUID
   * @param {AbortSignal} [signal] - Abort signal for request cancellation
   * @returns {Promise<object|null>} Members data or null if error
   */
  const fetchBoardMembersList = useCallback(
    async (boardId, signal) => {
      if (!token || !boardId) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchBoardMembers(boardId, token, signal);
        if (!data) throw new Error("No members data received");
        ReactDOM.unstable_batchedUpdates(() => {
          setMembers(normalizeMembers(data.members));
          setLastUpdated(Date.now());
        });
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch board members error:", err);
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
   * Toggle favorite status for a board
   * @param {string} boardId - Board UUID
   * @param {boolean} isFavorited - Current favorite status
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const toggleFavoriteBoard = useCallback(
    async (boardId, isFavorited, retryCount = 0) => {
      if (!token || !boardId) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedBoard = isFavorited
          ? await unfavoriteBoard(boardId, token)
          : await favoriteBoard(boardId, token);
        if (!updatedBoard) throw new Error("Failed to toggle favorite status");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
          setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? updatedBoard : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...updatedBoard, timestamp: Date.now() });
        return updatedBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return toggleFavoriteBoard(boardId, isFavorited, retryCount + 1);
        }
        console.error("Toggle favorite error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Invite a user to a board
   * @param {string} boardId - Board UUID
   * @param {string} username - Username
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const inviteUserToBoard = useCallback(
    async (boardId, username, retryCount = 0) => {
      if (!token || !boardId || !username?.trim()) {
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
        const updatedBoard = await inviteUser(boardId, { username }, token);
        if (!updatedBoard) throw new Error("Failed to invite user");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
          setLastUpdated(Date.now());
        });
        boardItemCache.set(cacheKey, { ...updatedBoard, timestamp: Date.now() });
        return updatedBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return inviteUserToBoard(boardId, username, retryCount + 1);
        }
        console.error("Invite user error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  /**
   * Accept an invitation to a board
   * @param {string} boardId - Board UUID
   * @param {number} [retryCount=0] - Retry count
   * @returns {Promise<object|null>} Updated board or null if error
   */
  const acceptBoardInvite = useCallback(
    async (boardId, retryCount = 0) => {
      if (!token || !boardId) {
        setError(token ? ERROR_MESSAGES.BOARD_ID_MISSING : ERROR_MESSAGES.AUTH_REQUIRED);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const updatedBoard = await acceptInvite(boardId, token);
        if (!updatedBoard) throw new Error("Failed to accept invite");
        const cacheKey = `${CACHE_VERSION}:${boardId}`;
        ReactDOM.unstable_batchedUpdates(() => {
          setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
          setBoardItem((prev) => (prev?.board_id === boardId ? updatedBoard : prev));
          setLastUpdated(Date.now());
        });
        boardListCache.forEach((value, key) => {
          if (value.boards.some((b) => b.board_id === boardId)) {
            boardListCache.set(key, {
              ...value,
              boards: value.boards.map((b) => (b.board_id === boardId ? updatedBoard : b)),
              timestamp: Date.now(),
            });
          }
        });
        boardItemCache.set(cacheKey, { ...updatedBoard, timestamp: Date.now() });
        return updatedBoard;
      } catch (err) {
        if (err.status === 429 && retryCount < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          return acceptBoardInvite(boardId, retryCount + 1);
        }
        console.error("Accept invite error:", err);
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
      boardListCache.clear();
      boardItemCache.clear();
      resetState();
    }
  }, [token, resetState]);

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
      lastUpdated,
      fetchBoardsList,
      fetchBoardsByGate,
      fetchBoardsByClass,
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
      inviteUserToBoard,
      acceptBoardInvite,
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
      lastUpdated,
      fetchBoardsList,
      fetchBoardsByGate,
      fetchBoardsByClass,
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
      inviteUserToBoard,
      acceptBoardInvite,
      resetState,
    ]
  );
};

export default useBoards;