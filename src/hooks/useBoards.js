import { useState, useCallback, useEffect } from "react";
import { fetchBoards, fetchBoardById, fetchBoardsByGate, fetchBoardByIdGate } from "../utils/boardsApi";

export const useBoards = (token, gate_id, initialBoardId = null, onLogout, navigate) => {
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch all boards (not tied to a specific gate)
  const fetchBoardsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedBoards = await fetchBoards(token);
      console.log("Fetched boards list:", fetchedBoards);
      setBoards(fetchedBoards);
    } catch (err) {
      console.error("Error fetching boards list:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Fetch boards by gate
  const fetchBoardsByGateId = useCallback(async () => {
    if (!gate_id) {
      setError("Gate ID is required to fetch boards");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedBoards = await fetchBoardsByGate(gate_id, token);
      console.log("Fetched boards by gate:", fetchedBoards);
      setBoards(fetchedBoards);
    } catch (err) {
      console.error("Error fetching boards by gate:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [gate_id, token, handleAuthError]);

  // Fetch a single board by ID
  const fetchBoard = useCallback(async (board_id) => {
    setLoading(true);
    setError(null);
    try {
      let fetchedBoard;
      if (gate_id) {
        // Use fetchBoardByIdGate if gate_id is provided
        fetchedBoard = await fetchBoardByIdGate(board_id, gate_id, token);
      } else {
        // Otherwise, use fetchBoardById
        fetchedBoard = await fetchBoardById(board_id, token);
      }
      console.log("Fetched board:", fetchedBoard);
      if (fetchedBoard) {
        setBoard(fetchedBoard);
      } else {
        throw new Error("Board not found");
      }
      return fetchedBoard;
    } catch (err) {
      console.error("Error fetching board:", err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [gate_id, token, handleAuthError]);

  // Fetch the initial board if initialBoardId is provided
  useEffect(() => {
    if (initialBoardId) {
      fetchBoard(initialBoardId);
    }
  }, [initialBoardId, fetchBoard]);

  return {
    boards,
    board,
    loading,
    error,
    fetchBoardsList, // Fetch all boards
    fetchBoardsByGate: fetchBoardsByGateId, // Fetch boards by gate
    fetchBoard, // Fetch a single board
  };
};