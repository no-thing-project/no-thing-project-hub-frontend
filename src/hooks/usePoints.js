import { useState, useCallback } from "react";
import {
  fetchPoints,
  transferPoints,
  fetchTopContributors,
  updatePoints,
} from "../api/pointsApi";

export const usePoints = (token, onLogout, navigate) => {
  const [pointsData, setPointsData] = useState(null);
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  const getPoints = useCallback(
    async (signal) => {
      if (!token) {
        setError("Authentication required");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPoints(token, signal);
        setPointsData(data);
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

  const transferUserPoints = useCallback(
    async (recipientId, amount) => {
      if (!token) {
        setError("Authentication required");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await transferPoints(recipientId, amount, token);
        setPointsData((prev) => ({
          ...prev,
          total_points: data.sender_points,
          donated_points: prev.donated_points + amount,
        }));
        return data;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const getTopContributors = useCallback(
    async (limit = 10, signal) => {
      if (!token) {
        setError("Authentication required");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTopContributors(token, limit, signal);
        setTopContributors(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateUserPoints = useCallback(
    async (targetUserId, amount, reason) => {
      if (!token) {
        setError("Authentication required");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await updatePoints(targetUserId, amount, reason, token);
        return data;
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
    pointsData,
    topContributors,
    loading,
    error,
    getPoints,
    transferUserPoints,
    getTopContributors,
    updateUserPoints,
  };
};

export default usePoints;