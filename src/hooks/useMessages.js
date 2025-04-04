import { useState, useCallback, useEffect } from "react";
import {
  fetchMessages,
  fetchGroupChats,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  uploadFile,
  createGroupChat,
  deleteGroupChat,
  deleteConversation,
  loadInitialMessagesData,
  editMessage,
  searchMessages,
} from "../api/messagesApi";

const useMessages = (token, userId, onLogout, navigate, friends = []) => {
  const [messages, setMessages] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMediaList, setPendingMediaList] = useState([]);

  const handleAuthError = useCallback((err) => {
    if (err.status === 401 || err.status === 403) {
      onLogout("Your session has expired. Please log in again.");
      navigate("/login");
      setError("Session expired. Redirecting to login...");
    } else {
      setError(err.message || "An unexpected error occurred.");
    }
  }, [onLogout, navigate]);

  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const updated = updater(prev).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return updated;
    });
  }, []);

  const fetchMessagesList = useCallback(
    async ({ signal, withUserId, groupId, page = 1, limit = 20 } = {}) => {
      if (!token) return [];
      try {
        const offset = (page - 1) * limit;
        return await fetchMessages(token, { withUserId, groupId, offset, limit, signal });
      } catch (err) {
        handleAuthError(err);
        throw err;
      }
    },
    [token, handleAuthError]
  );

  const loadInitialData = useCallback(async () => {
    if (!token || !friends.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = await loadInitialMessagesData(token, friends);
      setMessages(data.messages);
      setGroupChats(data.groupChats);
    } catch (err) {
      if (err.name !== "AbortError") handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, friends, handleAuthError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const sendMessageBase = useCallback(
    async (messageData, isMedia = false) => {
      if (!token || (!messageData.recipientId && !messageData.groupId)) {
        setError("Missing required message data.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newMessage = await sendMessage(
          {
            ...messageData,
            type: isMedia
              ? messageData.media.length === 1
                ? messageData.media[0].type
                : "mixed"
              : "text",
          },
          token
        );
        updateMessages((prev) => [...prev, newMessage]);
        if (isMedia) setPendingMediaList([]);
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const sendNewMessage = useCallback(
    (messageData) => sendMessageBase({ ...messageData, content: messageData.content || "Message" }),
    [sendMessageBase]
  );

  const sendMediaMessage = useCallback(
    async (messageData) => {
      const { recipientId, groupId, content = "Media message", media = [], replyTo } = messageData;
      if (!media.length) return sendNewMessage({ recipientId, groupId, content, replyTo });
      const finalMedia = await Promise.all(
        media.map(async (item) => ({
          type: item.type,
          content: await uploadFile(item.file, token),
          shape: item.shape,
        }))
      );
      return sendMessageBase({ recipientId, groupId, content, media: finalMedia, replyTo }, true);
    },
    [sendMessageBase, token]
  );

  const setPendingMediaFile = useCallback((media) => {
    if (!media?.file || !media.type) return setError("File or type is missing.");
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
      if (!token || !messageId) return setError("Missing token or message ID.");
      setLoading(true);
      setError(null);
      try {
        const updatedMessage = await markMessageAsRead(messageId, token);
        updateMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true, status: "read" } : m))
        );
        return updatedMessage;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const deleteExistingMessage = useCallback(
    async (messageId) => {
      if (!token || !messageId) return setError("Missing token or message ID.");
      setLoading(true);
      setError(null);
      try {
        await deleteMessage(messageId, token);
        updateMessages((prev) => prev.filter((m) => m.message_id !== messageId));
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const editExistingMessage = useCallback(
    async (messageId, newContent) => {
      if (!token || !messageId || !newContent) return setError("Missing required data.");
      setLoading(true);
      setError(null);
      try {
        const updatedMessage = await editMessage(messageId, newContent, token);
        updateMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, ...updatedMessage } : m))
        );
        return updatedMessage;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const createNewGroupChat = useCallback(
    async (name, members) => {
      if (!token || !name || !members.length) return setError("Missing group chat data.");
      setLoading(true);
      setError(null);
      try {
        const group = await createGroupChat(name, members, token);
        setGroupChats((prev) => [...prev, group]);
        return group;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingGroupChat = useCallback(
    async (groupId) => {
      if (!token || !groupId) return setError("Missing token or group ID.");
      setLoading(true);
      setError(null);
      try {
        await deleteGroupChat(groupId, token);
        setGroupChats((prev) => prev.filter((g) => g.group_id !== groupId));
        updateMessages((prev) => prev.filter((m) => m.group_id !== groupId));
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const deleteExistingConversation = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return setError("Missing token or conversation ID.");
      setLoading(true);
      setError(null);
      try {
        await deleteConversation(conversationId, token);
        updateMessages((prev) =>
          prev.filter((m) =>
            m.group_id
              ? m.group_id !== conversationId
              : ![m.sender_id, m.receiver_id].includes(conversationId)
          )
        );
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError, updateMessages]
  );

  const searchExistingMessages = useCallback(
    async (query) => {
      if (!token || !query) return setError("Missing token or search query.");
      setLoading(true);
      setError(null);
      try {
        const results = await searchMessages(query, token);
        return results;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const refreshMessages = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    messages,
    setMessages,
    groupChats,
    setGroupChats,
    loading,
    error,
    pendingMediaList,
    fetchMessagesList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    deleteExistingMessage,
    editExistingMessage,
    createNewGroupChat,
    deleteExistingGroupChat,
    deleteExistingConversation,
    searchExistingMessages,
    refreshMessages,
  };
};

export default useMessages;