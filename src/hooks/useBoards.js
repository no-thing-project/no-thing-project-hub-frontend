import { useState, useCallback } from "react";
import {
  fetchBoards,
  fetchBoardsByGateId,
  fetchBoardsByClassId,
  fetchBoardById,
  createBoard,
  createBoardInGate,
  createBoardInClass,
  updateBoard,
  updateBoardStatus,
  deleteBoard,
  fetchBoardMembers,
  likeBoard,
  unlikeBoard,
  fetchBoardStats,
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
      if (err.status === 401 || err.status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred.");
    },
    [onLogout, navigate]
  );

  const fetchBoardsList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError("Authentication required.");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoards(token, filters, signal);
        setBoards(data.boards);
        setPagination(data.pagination);
        setGateInfo(null);
        setClassInfo(null);
        return data.boards;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
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
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByGateId(gateId, token, filters, signal);
        setBoards(data.boards);
        setGateInfo(data.gate);
        setPagination(data.pagination);
        setClassInfo(null);
        return data.boards;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
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
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByClassId(classId, token, filters, signal);
        setBoards(data.boards);
        setClassInfo(data.class);
        setPagination(data.pagination);
        setGateInfo(null);
        return data.boards;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
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
        setBoardData(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return null;
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
        const newBoard = await createBoard(boardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
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
        const newBoard = await createBoardInGate(gateId, boardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
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
        const newBoard = await createBoardInClass(classId, boardData, token);
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
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
        const updatedBoard = await updateBoard(boardId, gateId, classId, boardData, token);
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateBoardStatusById = useCallback(
    async (boardId, gateId, classId, statusData) => {
      if (!token || !boardId || !statusData) {
        setError("Authentication, board ID, or status data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await updateBoardStatus(boardId, gateId, classId, statusData, token);
        setBoards((prev) => prev.map((b) => (b.board_id === boardId ? updatedBoard : b)));
        setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
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
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteBoard(boardId, gateId, classId, token);
        setBoards((prev) => prev.filter((b) => b.board_id !== boardId));
        setBoardData(null);
      } catch (err) {
        handleAuthError(err);
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
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const membersData = await fetchBoardMembers(boardId, token);
        setMembers(membersData);
        return membersData;
      } catch (err) {
        handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const likeBoardById = useCallback(
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
        setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const unlikeBoardById = useCallback(
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
        setBoardData(updatedBoard);
        return updatedBoard;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchBoardStatsData = useCallback(
    async (boardId) => {
      if (!token || !boardId) {
        setError("Authentication or board ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const statsData = await fetchBoardStats(boardId, token);
        setStats(statsData);
        return statsData;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    boards,
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
    updateBoardStatusById,
    deleteExistingBoard,
    fetchBoardMembersList,
    likeBoardById,
    unlikeBoardById,
    fetchBoardStatsData,
  };
};

export default useBoards;