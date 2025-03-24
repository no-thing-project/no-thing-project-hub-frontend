// src/hooks/useSocial.js
import { useState, useCallback } from "react";
import {
  addFriend,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  fetchFriends,
  fetchPendingRequests,
} from "../api/socialApi";

export const useSocial = (token, onLogout, navigate) => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsPagination, setFriendsPagination] = useState({});
  const [pendingPagination, setPendingPagination] = useState({});
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

  const addNewFriend = useCallback(
    async (friendId) => {
      if (!token || !friendId) {
        setError("Authentication or friend ID missing");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await addFriend(friendId, token);
        return data; // Повертаємо дані, але не оновлюємо стан локально
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const acceptFriend = useCallback(
    async (friendId) => {
      if (!token || !friendId) {
        setError("Authentication or friend ID missing");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await acceptFriendRequest(friendId, token);
        return data;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const rejectFriend = useCallback(
    async (friendId) => {
      if (!token || !friendId) {
        setError("Authentication or friend ID missing");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await rejectFriendRequest(friendId, token);
        return data;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const removeExistingFriend = useCallback(
    async (friendId) => {
      if (!token || !friendId) {
        setError("Authentication or friend ID missing");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await removeFriend(friendId, token);
        return data;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const getFriends = useCallback(
    async (options = { page: 1, limit: 20 }, signal) => {
      if (!token) {
        setError("Authentication required");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFriends(token, options, signal);
        setFriends(data.friends || []);
        setFriendsPagination(data.pagination || {});
        return data.friends;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const getPendingRequests = useCallback(
    async (options = { page: 1, limit: 20 }, signal) => {
      if (!token) {
        setError("Authentication required");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPendingRequests(token, options, signal);
        setPendingRequests(data.pendingRequests || []);
        setPendingPagination(data.pagination || {});
        return data.pendingRequests;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    friends,
    pendingRequests,
    friendsPagination,
    pendingPagination,
    loading,
    error,
    addNewFriend,
    acceptFriend,
    rejectFriend,
    removeExistingFriend,
    getFriends,
    getPendingRequests,
  };
};

export default useSocial;