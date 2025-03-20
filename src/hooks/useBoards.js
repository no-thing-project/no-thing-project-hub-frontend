// src/hooks/useBoards.js
import { useState, useCallback, useEffect } from "react";
import {
  fetchBoards,
  fetchBoardById,
  fetchBoardsByClass,
  fetchBoardsByGate,
  fetchBoardByIdClass,
  fetchBoardByIdGate,
  createBoard,
  createBoardInGate,
  createBoardInClass,
  updateBoard,
  updateBoardGate,
  updateBoardClass,
  updateBoardStatusGate,
  updateBoardStatusClass,
  deleteBoard,
  deleteBoardGate,
  deleteBoardClass,
  likeBoard,
  unlikeBoard,
  fetchBoardMembers,
} from "../utils/boardsApi";

/**
 * Custom hook for managing boards-related operations.
 * @param {string} token - Authentication token
 * @param {string} [gate_id] - Gate ID (optional, for fetching boards by gate)
 * @param {string} [class_id] - Class ID (optional, for fetching boards by class)
 * @param {string} [initialBoardId] - Initial board ID to fetch on mount (optional)
 * @param {() => void} onLogout - Callback to handle logout on auth errors
 * @param {import("react-router-dom").NavigateFunction} navigate - Navigation function for redirects
 * @returns {Object} - Boards state and operations
 */
export const useBoards = (token, gate_id, class_id, initialBoardId = null, onLogout, navigate) => {
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle authentication errors (401/403)
  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.response?.data?.errors?.[0] || err.message || "An error occurred");
    },
    [onLogout, navigate]
  );

  // Fetch all boards (not tied to a specific gate or class)
  const fetchAllBoards = useCallback(
    async (signal) => {
      if (!token) {
        setError("Authentication token is required");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoards(token, signal);
        setBoards(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching all boards:", err);
          handleAuthError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch boards by gate
  const fetchBoardsByGateId = useCallback(
    async (signal) => {
      if (!gate_id) {
        setError("Gate ID is required to fetch boards");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByGate(gate_id, token, signal);
        setBoards(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching boards by gate:", err);
          handleAuthError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [gate_id, token, handleAuthError]
  );

  // Fetch boards by class
  const fetchBoardsByClassId = useCallback(
    async (signal) => {
      if (!class_id) {
        setError("Class ID is required to fetch boards");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBoardsByClass(class_id, token, signal);
        setBoards(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching boards by class:", err);
          handleAuthError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [class_id, token, handleAuthError]
  );

  // Fetch a single board by ID
  const fetchBoard = useCallback(
    async (board_id, signal) => {
      if (!board_id) {
        setError("Board ID is required to fetch board");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let data;
        if (class_id) {
          data = await fetchBoardByIdClass(board_id, class_id, token, signal);
        } else if (gate_id) {
          data = await fetchBoardByIdGate(board_id, gate_id, token, signal);
        } else {
          data = await fetchBoardById(board_id, token, signal);
        }
        setBoard(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching board:", err);
          handleAuthError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [gate_id, class_id, token, handleAuthError]
  );

  // Create a new board
  const createNewBoard = useCallback(
    async (boardData) => {
      setLoading(true);
      setError(null);
      try {
        let newBoard;
        if (class_id) {
          newBoard = await createBoardInClass(class_id, boardData, token);
        } else if (gate_id) {
          newBoard = await createBoardInGate(gate_id, boardData, token);
        } else {
          newBoard = await createBoard(boardData, token);
        }
        setBoards((prev) => [...prev, newBoard]);
        return newBoard;
      } catch (err) {
        console.error("Error creating board:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gate_id, class_id, token, handleAuthError]
  );

  // Update an existing board
  const updateExistingBoard = useCallback(
    async (board_id, boardData) => {
      if (!board_id) {
        setError("Board ID is required to update board");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let updatedBoard;
        if (class_id) {
          updatedBoard = await updateBoardClass(class_id, board_id, boardData, token);
        } else if (gate_id) {
          updatedBoard = await updateBoardGate(gate_id, board_id, boardData, token);
        } else {
          updatedBoard = await updateBoard(board_id, boardData, token);
        }
        setBoards((prev) =>
          prev.map((b) => (b.board_id === board_id ? updatedBoard : b))
        );
        setBoard((prev) => (prev?.board_id === board_id ? updatedBoard : prev));
        return updatedBoard;
      } catch (err) {
        console.error("Error updating board:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gate_id, class_id, token, handleAuthError]
  );

  // Update board status
  const updateBoardStatus = useCallback(
    async (board_id, statusData) => {
      if (!board_id) {
        setError("Board ID is required to update board status");
        return;
      }
      if (!gate_id && !class_id) {
        setError("Gate ID or Class ID is required to update board status");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let updatedBoard;
        if (class_id) {
          updatedBoard = await updateBoardStatusClass(class_id, board_id, statusData, token);
        } else if (gate_id) {
          updatedBoard = await updateBoardStatusGate(gate_id, board_id, statusData, token);
        }
        setBoards((prev) =>
          prev.map((b) => (b.board_id === board_id ? updatedBoard : b))
        );
        setBoard((prev) => (prev?.board_id === board_id ? updatedBoard : prev));
        return updatedBoard;
      } catch (err) {
        console.error("Error updating board status:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gate_id, class_id, token, handleAuthError]
  );

  // Delete an existing board
  const deleteExistingBoard = useCallback(
    async (board_id) => {
      if (!board_id) {
        setError("Board ID is required to delete board");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        if (class_id) {
          await deleteBoardClass(class_id, board_id, token);
        } else if (gate_id) {
          await deleteBoardGate(gate_id, board_id, token);
        } else {
          await deleteBoard(board_id, token);
        }
        setBoards((prev) => prev.filter((b) => b.board_id !== board_id));
        setBoard((prev) => (prev?.board_id === board_id ? null : prev));
      } catch (err) {
        console.error("Error deleting board:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gate_id, class_id, token, handleAuthError]
  );

  // Like a board
  const likeBoardById = useCallback(
    async (board_id) => {
      if (!board_id) {
        setError("Board ID is required to like board");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await likeBoard(board_id, token);
        setBoards((prev) =>
          prev.map((b) => (b.board_id === board_id ? updatedBoard : b))
        );
        setBoard((prev) => (prev?.board_id === board_id ? updatedBoard : prev));
        return updatedBoard;
      } catch (err) {
        console.error("Error liking board:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Unlike a board
  const unlikeBoardById = useCallback(
    async (board_id) => {
      if (!board_id) {
        setError("Board ID is required to unlike board");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedBoard = await unlikeBoard(board_id, token);
        setBoards((prev) =>
          prev.map((b) => (b.board_id === board_id ? updatedBoard : b))
        );
        setBoard((prev) => (prev?.board_id === board_id ? updatedBoard : prev));
        return updatedBoard;
      } catch (err) {
        console.error("Error unliking board:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch board members
  const fetchMembersForBoard = useCallback(
    async (board_id) => {
      if (!board_id) {
        setError("Board ID is required to fetch members");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedMembers = await fetchBoardMembers(board_id, token);
        setMembers(fetchedMembers);
        return fetchedMembers;
      } catch (err) {
        console.error("Error fetching board members:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch the initial board if initialBoardId is provided
  useEffect(() => {
    if (initialBoardId && token) {
      const controller = new AbortController();
      fetchBoard(initialBoardId, controller.signal);
      fetchMembersForBoard(initialBoardId);
      return () => controller.abort();
    }
  }, [initialBoardId, token, fetchBoard, fetchMembersForBoard]);

  // Removed the automatic fetchBoards useEffect to prevent unnecessary requests
  // Consumers should call fetchBoardsByClassId, fetchBoardsByGateId, or fetchAllBoards manually

  return {
    boards, // List of all boards
    board, // Single board data
    members, // List of members for a board
    loading,
    error,
    fetchAllBoards, // Fetch all boards
    fetchBoardsByGateId, // Fetch boards by gate
    fetchBoardsByClassId, // Fetch boards by class
    fetchBoard, // Fetch a single board
    createNewBoard, // Create a new board
    updateExistingBoard, // Update a board
    updateBoardStatus, // Update board status
    deleteExistingBoard, // Delete a board
    likeBoard: likeBoardById, // Like a board
    unlikeBoard: unlikeBoardById, // Unlike a board
    fetchMembersForBoard, // Fetch members of a board
  };
};

export default useBoards;