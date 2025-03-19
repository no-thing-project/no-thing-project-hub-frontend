// src/hooks/useGates.js
import { useState, useCallback } from "react";
import { fetchGates, fetchGateById } from "../utils/apiPages";

export const useGates = (token) => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGatesList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGates(token);
      setGates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gates");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchGate = useCallback(async (gate_id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGateById(gate_id, token);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gate");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { gates, loading, error, fetchGatesList, fetchGate };
};