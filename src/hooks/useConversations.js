import { useState, useCallback, useEffect, useRef } from "react";
import { createConversation, fetchConversations, updateConversation, deleteConversation } from "../api/conversationApi";
import { INITIAL_LOADING_STATE, DEFAULT_CONVERSATIONS } from "../constants/chatConstants";

const useConversations = (token, onLogout, navigate) => {
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
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

  const loadConversations = useCallback(async () => {
    if (!token) return;
    loadingController.current = new AbortController();
    setLoading((prev) => ({ ...prev, initial: true }));
    setError(null);
    try {
      const data = await fetchConversations(token, loadingController.current.signal);
      if (isMounted.current) setConversations(data);
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (isMounted.current) setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createNewConversation = useCallback(
    async (recipientId) => {
      if (!token || !recipientId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const conversation = await createConversation(recipientId, token);
        setConversations((prev) => [...prev, conversation]);
        return conversation;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const updateExistingConversation = useCallback(
    async (conversationId, updates) => {
      if (!token || !conversationId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updatedConversation = await updateConversation(conversationId, updates, token);
        setConversations((prev) =>
          prev.map((c) => (c.conversation_id === conversationId ? updatedConversation : c))
        );
        return updatedConversation;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingConversation = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        await deleteConversation(conversationId, token);
        setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
      } catch (err) {
        handleAuthError(err);
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  return {
    conversations,
    setConversations,
    loading,
    error,
    loadConversations,
    createNewConversation,
    updateExistingConversation,
    deleteExistingConversation,
  };
};

export default useConversations;