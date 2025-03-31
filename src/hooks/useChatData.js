import { useState, useCallback, useEffect, useRef } from "react";
import { fetchMessages } from "../api/messageApi";
import { fetchConversations } from "../api/conversationApi";
import { fetchGroupChats } from "../api/groupChatApi";
import {
  INITIAL_LOADING_STATE,
  DEFAULT_MESSAGES,
  DEFAULT_CONVERSATIONS,
  DEFAULT_GROUP_CHATS,
} from "../constants/chatConstants";
import { sortMessagesByTimestamp } from "../utils/helpers";

const useChatData = (token, onLogout, navigate) => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
  const [groupChats, setGroupChats] = useState(DEFAULT_GROUP_CHATS);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const loadingController = useRef(null);
  const hasLoadedInitialData = useRef(false);

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

  const loadInitialData = useCallback(async () => {
    if (!token || hasLoadedInitialData.current) return;
    loadingController.current = new AbortController();
    setLoading((prev) => ({ ...prev, initial: true }));
    setError(null);
    try {
      const [groupChatsData, conversationsData] = await Promise.all([
        fetchGroupChats(token, loadingController.current.signal),
        fetchConversations(token, loadingController.current.signal),
      ]);

      const allMessages = await Promise.all([
        ...conversationsData.map((conv) =>
          fetchMessages(token, { conversationId: conv.conversation_id }, loadingController.current.signal)
        ),
        ...groupChatsData.map((group) =>
          fetchMessages(token, { groupId: group.group_id }, loadingController.current.signal)
        ),
      ]);

      if (isMounted.current) {
        setMessages(sortMessagesByTimestamp(allMessages.flat()));
        setGroupChats(groupChatsData);
        setConversations(conversationsData);
        hasLoadedInitialData.current = true;
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      if (isMounted.current) setLoading((prev) => ({ ...prev, initial: false }));
    }
  }, [token, handleAuthError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    messages,
    setMessages,
    conversations,
    setConversations,
    groupChats,
    setGroupChats,
    loading,
    error,
    loadInitialData,
  };
};

export default useChatData;