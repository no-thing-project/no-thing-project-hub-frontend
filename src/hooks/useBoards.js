import { useState, useCallback, useEffect } from "react";
import {
  fetchBoards,
  fetchBoardsByGateId,
  fetchBoardsByClassId,
  fetchBoardById,
  createBoard,
  createBoardInGate,
  createBoardInClass,
  updateBoard,
  deleteBoard,
  fetchBoardMembers,
  likeBoard,
  unlikeBoard,
  fetchBoardStats,
  inviteUser,
  acceptInvite,
  addMember,
  removeMember,
  runAIModeration,
} from "../api/boardsApi";

export const useBoards = (token, onLogout, navigate) => {
  const [boards, setBoards] = useState([]);
  const [boardData, setBoardData] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({});
  const [gateInfo, setGateInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred.");
      return null;
    },
    [onLogout, navigate]
  );

  const resetState = useCallback(() => {
    setBoards([]);
    setBoardData(null);
    setMembers([]);
    setStats(null);
    setPagination({});
    setGateInfo(null);
    setClassInfo(null);
    setError(null);
  }, []);

  const sanitizeBoardData = (data, exclude = []) => {
    const allowed = {
      name: data.name,
      description: data.description,
      visibility: data.visibility,
      is_public: data.is_public,
      type: data.type,
      tags: data.tags,
      settings: data.settings,
      gate_id: data.gate_id,
      class_id: data.class_id,
    };
    exclude.forEach((key) => delete allowed[key]);
    return allowed;
  };

  const fetchBoardsList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError("Authentication required.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoards(token, filters, signal);
        setBoards((data.boards || []).filter((board) => board && board.board_id));
        setPagination(data.pagination || {});
        setGateInfo(null);
        setClassInfo(null);
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchBoardsByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByGateId(gateId, token, filters, signal);
        setBoards((data.boards || []).filter((board) => board && board.board_id));
        setGateInfo(data.gate || null);
        setPagination(data.pagination || {});
        setClassInfo(null);
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchBoardsByClass = useCallback(
    async (classId, filters = {}, signal) => {
      if (!token || !classId) {
        setError("Authentication or class ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByClassId(classId, token, filters, signal);
        setBoards((data.boards || []).filter((board) => board && board.board_id));
        setClassInfo(data.class || null);
        setPagination(data.pagination || {});
        setGateInfo(null);
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchBoard = useCallback(
    async (boardId, gateId, classId, signal) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardById(boardId, gateId, classId, token, signal);
        setBoardData(data || null);
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewBoard = useCallback(
    async (boardData) => {
      if (!token || !boardData) {
        setError("Authentication or board data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const sanitizedBoardData = sanitizeBoardData(boardData);
        const newBoard = await createBoard(sanitizedBoardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewBoardInGate = useCallback(
    async (gateId, boardData) => {
      if (!token || !gateId || !boardData) {
        setError("Authentication, gate ID, or board data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const sanitizedBoardData = sanitizeBoardData(boardData, ['gate_id', 'class_id']);
        const newBoard = await createBoardInGate(gateId, sanitizedBoardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewBoardInClass = useCallback(
    async (classId, boardData) => {
      if (!token || !classId || !boardData) {
        setError("Authentication, class ID, or board data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const sanitizedBoardData = sanitizeBoardData(boardData, ['gate_id', 'class_id']);
        const newBoard = await createBoardInClass(classId, sanitizedBoardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateExistingBoard = useCallback(
    async (boardId, gateId, classId, boardData) => {
      if (!token || !boardId || !boardData) {
        setError("Authentication, board ID, or data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const payload = {
          name: boardData.name,
          description: boardData.description,
          visibility: boardData.visibility,
          is_public: boardData.is_public,
          type: boardData.type,
          tags: boardData.tags,
          settings: boardData.settings,
          gate_id: boardData.gate_id,
          class_id: boardData.class_id,
        };
        const updatedBoard = await updateBoard(boardId, gateId, classId, payload, token);
        if (!updatedBoard || !updatedBoard.board_id) {
          throw new Error("Invalid board data received from server");
        }
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingBoard = useCallback(
    async (boardId, gateId, classId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteBoard(boardId, gateId, classId, token);
        setBoards((prev) => prev.filter((b) => b.board_id !== boardId));
        setBoardData(null);
        return true;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchBoardMembersList = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardMembers(boardId, token);
        setMembers(data || []);
        return data;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const likeExistingBoard = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await likeBoard(boardId, token);
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const unlikeExistingBoard = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await unlikeBoard(boardId, token);
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const fetchBoardStatistics = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardStats(boardId, token);
        setStats(data || null);
        return data;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const inviteUserToBoard = useCallback(
    async (boardId, anonymousId) => {
      if (!token || !boardId || !anonymousId) {
        setError("Authentication, board ID, or user ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await inviteUser(boardId, { anonymous_id: anonymousId }, token);
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const acceptBoardInvite = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await acceptInvite(boardId, token);
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const addBoardMember = useCallback(
    async (boardId, anonymousId, role = "viewer") => {
      if (!token || !boardId || !anonymousId) {
        setError("Authentication, board ID, or user ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await addMember(boardId, { anonymous_id: anonymousId, role }, token);
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        setMembers((prev) => [...prev, { anonymous_id: anonymousId, role }]);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const removeBoardMember = useCallback(
    async (boardId, anonymousId) => {
      if (!token || !boardId || !anonymousId) {
        setError("Authentication, board ID, or user ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await removeMember(boardId, { anonymous_id: anonymousId }, token);
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        setMembers((prev) => prev.filter((m) => m.anonymous_id !== anonymousId));
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  const runBoardAIModeration = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await runAIModeration(boardId, token);
        if (boardData?.board_id === boardId) setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, boardData, handleAuthError]
  );

  useEffect(() => {
    if (!token) {
      resetState();
    }
  }, [token, resetState]);

  return {
    boards,
    setBoards,
    boardData,
    members,
    stats,
    pagination,
    gateInfo,
    classInfo,
    loading,
    error,
    fetchBoardsList,
    fetchBoardsByGate,
    fetchBoardsByClass,
    fetchBoard,
    createNewBoard,
    createNewBoardInGate,
    createNewBoardInClass,
    updateExistingBoard,
    deleteExistingBoard,
    fetchBoardMembersList,
    likeExistingBoard,
    unlikeExistingBoard,
    fetchBoardStatistics,
    inviteUserToBoard,
    acceptBoardInvite,
    addBoardMember,
    removeBoardMember,
    runBoardAIModeration,
  };
};