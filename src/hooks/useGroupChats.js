import { useState, useCallback, useEffect, useRef } from "react";
import { createGroupChat, fetchGroupChats, updateGroupChat, deleteGroupChat } from "../api/groupChatApi";
import { INITIAL_LOADING_STATE, DEFAULT_GROUP_CHATS } from "../constants/chatConstants";

const useGroupChats = (token, onLogout, navigate) => {
  const [groupChats, setGroupChats] = useState(DEFAULT_GROUP_CHATS);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const loadingController = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (loadingController.current) loadingController.current.abort();
    };
  }, []);

  const handleAuthError = useCallback(
    (err) => {
      if (!isMounted.current) return;
      if (err.status === 401 || err.status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      } else if (err.name !== "AbortError") {
        setError(err.message || "An unexpected error occurred.");
      }
    },
    [onLogout, navigate]
  );

  const loadGroupChats = useCallback(async () => {
    if (!token) return;
    loadingController.current = new AbortController();
    setLoading((prev) => ({ ...prev, initial: true }));
    setError(null);
    try {
      const data = await fetchGroupChats(token, loadingController.current.signal);
      if (isMounted.current) setGroupChats(data);
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (isMounted.current) setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    loadGroupChats();
  }, [loadGroupChats]);

  const createNewGroupChat = useCallback(
    async (name, members) => {
      if (!token || !name || !members.length) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const group = await createGroupChat(name, members, token);
        setGroupChats((prev) => [...prev, group]);
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

  const updateExistingGroupChat = useCallback(
    async (groupId, updates) => {
      if (!token || !groupId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updatedGroup = await updateGroupChat(groupId, updates, token);
        setGroupChats((prev) => prev.map((g) => (g.group_id === groupId ? updatedGroup : g)));
        return updatedGroup;
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
      if (!token || !groupId) return;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        await deleteGroupChat(groupId, token);
        setGroupChats((prev) => prev.filter((g) => g.group_id !== groupId));
      } catch (err) {
        handleAuthError(err);
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
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
    updateExistingGroupChat,
    deleteExistingGroupChat,
  };
};

export default useGroupChats;