import { useState, useCallback, useEffect, useRef } from "react";
import { fetchMessages } from "../api/messageApi";
import { fetchConversations } from "../api/conversationApi";
import { fetchGroupChats } from "../api/groupChatApi";

const INITIAL_LOADING_STATE = { initial: false, action: false };
const DEFAULT_MESSAGES = [];
const DEFAULT_CONVERSATIONS = [];
const DEFAULT_GROUP_CHATS = [];

const sortMessagesByTimestamp = (messages) =>
  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

const useChatData = (token, 
  // socket,
   onLogout, navigate) => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
  const [groupChats, setGroupChats] = useState(DEFAULT_GROUP_CHATS);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const abortController = useRef(null);
  const hasLoadedInitialData = useRef(false);

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
        setError("Resource not found.");
      } else if (err.name !== "AbortError") {
        setError(err.message || "Unexpected error.");
      }
    },
    [onLogout, navigate]
  );

  const loadInitialData = useCallback(async () => {
    if (!token || hasLoadedInitialData.current) return;
    abortController.current = new AbortController();
    setLoading((prev) => ({ ...prev, initial: true }));
    setError(null);
    try {
      const [groupChatsData, conversationsData] = await Promise.all([
        fetchGroupChats(token, abortController.current.signal).catch(() => []),
        fetchConversations(token, abortController.current.signal).catch(() => []),
      ]);

      const messagePromises = [
        ...conversationsData.map((conv) =>
          fetchMessages(token, { conversationId: conv.conversation_id }, abortController.current.signal).catch(() => [])
        ),
        ...groupChatsData.map((group) =>
          fetchMessages(token, { groupId: group.group_id }, abortController.current.signal).catch(() => [])
        ),
      ];

      const allMessages = (await Promise.all(messagePromises)).flat();
      if (isMounted.current) {
        setMessages(sortMessagesByTimestamp(allMessages));
        setConversations(conversationsData);
        setGroupChats(groupChatsData);
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

  // Socket events (simplified, detailed handling in individual hooks)
  // useEffect(() => {
  //   if (!socket || !token) return;

  //   socket.on("newMessage", (message) => {
  //     if (isMounted.current) {
  //       setMessages((prev) => sortMessagesByTimestamp([...prev, message]));
  //     }
  //   });

  //   socket.on("conversationCreated", (conversation) => {
  //     if (isMounted.current) {
  //       setConversations((prev) => [...prev, conversation]);
  //     }
  //   });

  //   socket.on("groupChatCreated", (group) => {
  //     if (isMounted.current) {
  //       setGroupChats((prev) => [...prev, group]);
  //     }
  //   });

  //   return () => {
  //     socket.off("newMessage");
  //     socket.off("conversationCreated");
  //     socket.off("groupChatCreated");
  //   };
  // }, [socket, token]);

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