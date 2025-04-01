import { useState, useCallback, useEffect, useRef } from "react";
import {
  sendMessage,
  fetchMessages,
  fetchMessageById,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
  uploadFile,
  fetchMessageReactions,
  addMessageReaction,
} from "../api/messageApi";

const INITIAL_LOADING_STATE = { initial: false, action: false };
const DEFAULT_MESSAGES = [];
const MESSAGES_PAGE_LIMIT = 20;

const sortMessagesByTimestamp = (messages) =>
  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

const useMessages = (token, 
  // socket,
   onLogout, navigate) => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const [pendingMediaList, setPendingMediaList] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      pendingMediaList.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, [pendingMediaList]);

  const handleAuthError = useCallback(
    (err) => {
      if (!isMounted.current) return;
      if (err.status === 401) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      } else if (err.status === 403 || err.status === 503) {
        setError("Access denied or service unavailable.");
      } else if (err.status === 404) {
        setError("Message not found.");
      } else if (err.name !== "AbortError") {
        setError(err.message || "Unexpected error.");
      }
    },
    [onLogout, navigate]
  );

  const fetchMessagesList = useCallback(
    async ({ signal, withUserId, groupId, conversationId, page = 1, limit = MESSAGES_PAGE_LIMIT } = {}) => {
      if (!token) return DEFAULT_MESSAGES;
      setError(null); // Очищаємо помилку перед запитом
      try {
        const data = await fetchMessages(
          token,
          { withUserId, groupId, conversationId, offset: (page - 1) * limit, limit },
          signal
        );
        if (isMounted.current) {
          const sorted = sortMessagesByTimestamp(data);
          setMessages(sorted);
          return sorted;
        }
        return DEFAULT_MESSAGES;
      } catch (err) {
        handleAuthError(err);
        if (isMounted.current) {
          setError(err.response?.data?.message || 'Failed to fetch messages'); // Зберігаємо помилку
        }
        return DEFAULT_MESSAGES; // Повертаємо порожній масив у разі помилки
      }
    },
    [token, handleAuthError]
  );

  const getMessageById = useCallback(
    async (messageId) => {
      if (!token || !messageId) return null;
      try {
        return await fetchMessageById(messageId, token);
      } catch (err) {
        handleAuthError(err);
        return null;
      }
    },
    [token, handleAuthError]
  );

  const sendNewMessage = useCallback(
    async (messageData) => {
      if (!token || (!messageData.groupId && !messageData.conversationId)) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const payload = { ...messageData, content: messageData.content || "Message" };
        const newMessage = await sendMessage(payload, token);
        if (isMounted.current) {
          setMessages((prev) => sortMessagesByTimestamp([...prev, newMessage]));
        }
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const sendMediaMessage = useCallback(
    async ({ groupId, conversationId, content = "Media message", media = [], replyTo }) => {
      if (!token || (!groupId && !conversationId) || !media.length) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const finalMedia = await Promise.all(
          media.map(async (item) => {
            const uploaded = await uploadFile(item.file, token);
            return {
              type: item.type,
              content: uploaded.url,
              shape: item.shape || "square",
              metadata: item.metadata || {},
            };
          })
        );
        const newMessage = await sendMessage(
          { groupId, conversationId, content, media: finalMedia, replyTo },
          token
        );
        if (isMounted.current) {
          setMessages((prev) => sortMessagesByTimestamp([...prev, newMessage]));
          setPendingMediaList([]);
        }
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const setPendingMediaFile = useCallback((media) => {
    if (!media?.file || !media.type) return;
    const preview = URL.createObjectURL(media.file);
    setPendingMediaList((prev) => [...prev, { ...media, preview }]);
  }, []);

  const clearPendingMedia = useCallback((index) => {
    setPendingMediaList((prev) => {
      if (index === undefined) {
        prev.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
        return [];
      }
      const newList = [...prev];
      const [removed] = newList.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return newList;
    });
  }, []);

  const markMessageRead = useCallback(
    async (messageId) => {
      if (!token || !messageId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updated = await markMessageAsRead(messageId, token);
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m.message_id === messageId ? { ...m, is_read: true, status: "read" } : m
            )
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

  const updateExistingMessage = useCallback(
    async (messageId, content) => {
      if (!token || !messageId || !content) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updated = await updateMessage(messageId, content, token);
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((m) => (m.message_id === messageId ? updated : m))
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

  const deleteExistingMessage = useCallback(
    async (messageId) => {
      if (!token || !messageId) return;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        await deleteMessage(messageId, token);
        if (isMounted.current) {
          setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
        }
      } catch (err) {
        handleAuthError(err);
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  const getMessageReactions = useCallback(
    async (messageId) => {
      if (!token || !messageId) return [];
      try {
        return await fetchMessageReactions(messageId, token);
      } catch (err) {
        handleAuthError(err);
        return [];
      }
    },
    [token, handleAuthError]
  );

  const addReactionToMessage = useCallback(
    async (messageId, reaction) => {
      if (!token || !messageId || !reaction) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const result = await addMessageReaction(messageId, reaction, token);
        if (isMounted.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m.message_id === messageId
                ? {
                    ...m,
                    reactions: m.reactions.some((r) => r.user_id === result.user_id)
                      ? m.reactions.map((r) =>
                          r.user_id === result.user_id ? result : r
                        )
                      : [...m.reactions, result],
                  }
                : m
            )
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

  // Socket events
  // useEffect(() => {
  //   if (!socket || !token) return;

  //   socket.on("newMessage", (message) => {
  //     if (isMounted.current) {
  //       setMessages((prev) => sortMessagesByTimestamp([...prev, message]));
  //     }
  //   });

  //   socket.on("messageUpdated", (updatedMessage) => {
  //     if (isMounted.current) {
  //       setMessages((prev) =>
  //         prev.map((m) => (m.message_id === updatedMessage.message_id ? updatedMessage : m))
  //       );
  //     }
  //   });

  //   socket.on("messageDeleted", (messageId) => {
  //     if (isMounted.current) {
  //       setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
  //     }
  //   });

  //   socket.on("messageRead", ({ message_id }) => {
  //     if (isMounted.current) {
  //       setMessages((prev) =>
  //         prev.map((m) =>
  //           m.message_id === message_id ? { ...m, is_read: true, status: "read" } : m
  //         )
  //       );
  //     }
  //   });

  //   socket.on("reactionAdded", ({ message_id, user_id, reaction }) => {
  //     if (isMounted.current) {
  //       setMessages((prev) =>
  //         prev.map((m) =>
  //           m.message_id === message_id
  //             ? {
  //                 ...m,
  //                 reactions: m.reactions.some((r) => r.user_id === user_id)
  //                   ? m.reactions.map((r) =>
  //                       r.user_id === user_id ? { user_id, reaction } : r
  //                     )
  //                   : [...m.reactions, { user_id, reaction }],
  //               }
  //             : m
  //         )
  //       );
  //     }
  //   });

  //   return () => {
  //     socket.off("newMessage");
  //     socket.off("messageUpdated");
  //     socket.off("messageDeleted");
  //     socket.off("messageRead");
  //     socket.off("reactionAdded");
  //   };
  // }, [socket, token]);

  return {
    messages,
    setMessages,
    loading,
    error,
    pendingMediaList,
    fetchMessagesList,
    getMessageById,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    updateExistingMessage,
    deleteExistingMessage,
    getMessageReactions,
    addReactionToMessage,
  };
};

export default useMessages;