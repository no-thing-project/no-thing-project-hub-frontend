import { useState, useCallback, useEffect, useRef } from "react";
import {
  createGroupChat,
  fetchGroupChats,
  fetchGroupById,
  updateGroupChat,
  deleteGroupChat,
  archiveGroupChat,
  fetchGroupStats,
} from "../api/groupChatApi";
import { INITIAL_LOADING_STATE, DEFAULT_GROUP_CHATS } from "../constants/chatConstants";

const useGroupChats = (token, onLogout, navigate) => {
  const [groupChats, setGroupChats] = useState(DEFAULT_GROUP_CHATS);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const abortController = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortController.current?.abort();
    };
  }, []);

  const handleAuthError = useCallback(
    (err) => {
      if (!isMounted.current) return;
      if (err.status === 401) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      } else if (err.status === 403 || err.status === 503) {
        setError("Access denied or service unavailable.");
      } else if (err.status === 404) {
        setError("Group chat not found.");
      } else if (err.name !== "AbortError") {
        setError(err.message || "Unexpected error.");
      }
    },
    [onLogout, navigate]
  );

  const loadGroupChats = useCallback(async () => {
    if (!token) return;
    abortController.current = new AbortController();
    setLoading((prev) => ({ ...prev, initial: true }));
    setError(null);
    try {
      const data = await fetchGroupChats(token, abortController.current.signal);
      if (isMounted.current) setGroupChats(data);
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (isMounted.current) setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, [token, handleAuthError]);

  const createNewGroupChat = useCallback(
    async (name, members) => {
      if (!token || !name || !members?.length) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const group = await createGroupChat(name, members, token);
        if (isMounted.current) {
          setGroupChats((prev) => [...prev, group]);
        }
        return group;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const getGroupById = useCallback(
    async (groupId) => {
      if (!token || !groupId) return null;
      try {
        return await fetchGroupById(groupId, token);
      } catch (err) {
        handleAuthError(err);
        return null;
      }
    },
    [token, handleAuthError]
  );

  const updateExistingGroupChat = useCallback(
    async (groupId, updates) => {
      if (!token || !groupId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updated = await updateGroupChat(groupId, updates, token);
        if (isMounted.current) {
          setGroupChats((prev) =>
            prev.map((g) => (g.group_id === groupId ? updated : g))
          );
        }
        return updated;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingGroupChat = useCallback(
    async (groupId) => {
      if (!token || !groupId) return false;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        await deleteGroupChat(groupId, token);
        if (isMounted.current) {
          setGroupChats((prev) => prev.filter((g) => g.group_id !== groupId));
        }
        return true;
      } catch (err) {
        handleAuthError(err);
        return false;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const toggleArchiveGroupChat = useCallback(
    async (groupId) => {
      if (!token || !groupId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const result = await archiveGroupChat(groupId, token);
        if (isMounted.current) {
          setGroupChats((prev) =>
            prev.map((g) => (g.group_id === groupId ? { ...g, is_archived: result.is_archived } : g))
          );
        }
        return result;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const getGroupStats = useCallback(
    async (groupId) => {
      if (!token || !groupId) return null;
      try {
        return await fetchGroupStats(groupId, token);
      } catch (err) {
        handleAuthError(err);
        return null;
      }
    },
    [token, handleAuthError]
  );

  return {
    groupChats,
    setGroupChats,
    loading,
    error,
    loadGroupChats,
    createNewGroupChat,
    getGroupById,
    updateExistingGroupChat,
    deleteExistingGroupChat,
    toggleArchiveGroupChat,
    getGroupStats,
  };
};

export default useGroupChats;