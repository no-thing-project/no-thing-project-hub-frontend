import { useState, useCallback, useEffect } from "react";
import { fetchBoardsByGate } from "../utils/apiPages";
import config from "../config";

export const useBoards = (token, initialBoardId = null) => {
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBoardsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.REACT_APP_HUB_API_URL}/api/v1/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log("Fetched boards list:", data);
      setBoards(data?.content?.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch boards");
      console.error("Error fetching boards list:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchBoard = useCallback(async (gate_id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBoardsByGate(gate_id, token);
      console.log("Fetched board:", data);
      if (data) setBoard(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch board");
      console.error("Error fetching board:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (initialBoardId) {
      fetchBoard(initialBoardId);
    }
  }, [initialBoardId, fetchBoard]);

  return { boards, board, loading, error, fetchBoardsList, fetchBoard };
};