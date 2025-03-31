import { useState, useCallback, useEffect, useRef } from "react";
import {
  sendMessage,
  fetchMessages,
  markMessageAsRead,
  updateMessage,
  deleteMessage,
  uploadFile,
} from "../api/messageApi";
import { INITIAL_LOADING_STATE, DEFAULT_MESSAGES, MESSAGES_PAGE_LIMIT } from "../constants/chatConstants";
import { sortMessagesByTimestamp } from "../utils/helpers";

const useMessages = (token, onLogout, navigate) => {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [loading, setLoading] = useState(INITIAL_LOADING_STATE);
  const [error, setError] = useState(null);
  const [pendingMediaList, setPendingMediaList] = useState([]);
  const isMounted = useRef(true);

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

  const fetchMessagesList = useCallback(
    async ({ signal, withUserId, groupId, conversationId, page = 1, limit = MESSAGES_PAGE_LIMIT } = {}) => {
      if (!token) return DEFAULT_MESSAGES;
      try {
        const fetchedMessages = await fetchMessages(
          token,
          { withUserId, groupId, conversationId, offset: (page - 1) * limit, limit },
          signal
        );
        return sortMessagesByTimestamp(fetchedMessages);
      } catch (err) {
        handleAuthError(err);
        return DEFAULT_MESSAGES;
      }
    },
    [token, handleAuthError]
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
      pendingMediaList.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, [pendingMediaList]);

  // Початкове завантаження повідомлень
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!token) {
        setLoading((prev) => ({ ...prev, initial: false }));
        return;
      }
      setLoading((prev) => ({ ...prev, initial: true }));
      try {
        const fetchedMessages = await fetchMessagesList({ signal: new AbortController().signal });
        if (isMounted.current) {
          setMessages(fetchedMessages);
        }
      } catch (err) {
        handleAuthError(err);
      } finally {
        if (isMounted.current) {
          setLoading((prev) => ({ ...prev, initial: false }));
        }
      }
    };

    loadInitialMessages();
  }, [token, fetchMessagesList, handleAuthError]);

  const sendMessageBase = useCallback(
    async (messageData, isMedia = false) => {
      if (!token || (!messageData.groupId && !messageData.conversationId)) {
        setError("Missing required message data.");
        return null;
      }
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const payload = {
          ...messageData,
          type: isMedia ? (messageData.media.length === 1 ? messageData.media[0].type : "mixed") : "text",
        };
        const newMessage = await sendMessage(payload, token);
        setMessages((prev) => sortMessagesByTimestamp([...prev, newMessage]));
        if (isMedia) setPendingMediaList([]);
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

  const sendNewMessage = useCallback(
    (messageData) => sendMessageBase({ ...messageData, content: messageData.content || "Message" }, false),
    [sendMessageBase]
  );

  const sendMediaMessage = useCallback(
    async (messageData) => {
      const { groupId, conversationId, content = "Media message", media = [], replyTo } = messageData;
      if (!media.length) return sendNewMessage({ groupId, conversationId, content, replyTo });
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const finalMedia = await Promise.all(
          media.map(async (item) => {
            const uploadedFile = await uploadFile(item.file, token);
            return {
              type: item.type,
              content: uploadedFile.url,
              shape: item.shape || "square",
              metadata: item.metadata || {},
            };
          })
        );
        return await sendMessageBase({ groupId, conversationId, content, media: finalMedia, replyTo }, true);
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, sendMessageBase, handleAuthError]
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
      const removed = newList.splice(index, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return newList;
    });
  }, []);

  const markMessageRead = useCallback(
    async (messageId) => {
      if (!token || !messageId) return null;
      setLoading((prev) => ({ ...prev, action: true }));
      try {
        const updatedMessage = await markMessageAsRead(messageId, token);
        setMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true, status: "read" } : m))
        );
        return updatedMessage;
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
        const updatedMessage = await updateMessage(messageId, content, token);
        setMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, content } : m))
        );
        return updatedMessage;
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
        setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
      } catch (err) {
        handleAuthError(err);
      } finally {
        if (isMounted.current) setLoading((prev) => ({ ...prev, action: false }));
      }
    },
    [token, handleAuthError]
  );

  return {
    messages,
    setMessages,
    loading,
    error,
    pendingMediaList,
    fetchMessagesList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    updateExistingMessage,
    deleteExistingMessage,
  };
};

export default useMessages;