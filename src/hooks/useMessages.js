import { useState, useCallback, useMemo } from 'react';
import {
  sendMessage,
  fetchMessages,
  sendTyping,
  getReadReceipts,
  createPoll,
  votePoll,
  addReaction,
  markMessageAsRead,
  deleteMessage,
  editMessage,
  searchMessages,
  pinMessage,
  unpinMessage,
  listScheduledMessages,
  cancelScheduledMessage,
} from '../api/messagesApi';

const useMessages = ({ token, userId, onLogout, navigate, updateLastMessage }) => {
  const [messages, setMessages] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(async (apiFn, ...args) => {
    setLoading(true);
    try {
      const res = await apiFn(...args, token);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      if (err.status === 401 || err.status === 403) {
        onLogout('Session expired. Please log in again.');
        navigate('/login');
      }
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [token, onLogout, navigate]);

  const loadMessages = useCallback(async (conversationId, params = { page: 1, limit: 20 }) => {
    if (!conversationId) {
      setError('Conversation ID is required');
      return { messages: [] };
    }
    try {
      const data = await handleApiCall(fetchMessages, conversationId, params);
      const newMessages = Array.isArray(data?.messages) ? data.messages : [];
      setMessages((prev) => (params.page === 1 ? newMessages : [...prev, ...newMessages]));
      return { messages: newMessages };
    } catch (error) {
      console.error('loadMessages error:', error);
      setMessages([]);
      return { messages: [] };
    }
  }, [handleApiCall]);

  const sendNewMessage = useCallback(async (
    conversationId,
    content,
    media = [],
    replyTo,
    scheduledAt,
    forwardedFrom
  ) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const data = await handleApiCall(sendMessage, {
      conversationId,
      content,
      media,
      replyTo,
      scheduledAt,
      forwardedFrom,
    });
    setMessages((prev) => [data, ...prev]);
    if (updateLastMessage) {
      updateLastMessage(conversationId, data);
    }
    return data;
  }, [handleApiCall, updateLastMessage]);

  const sendTypingIndicator = useCallback((conversationId) => {
    if (!conversationId) return Promise.reject('Conversation ID is required');
    return handleApiCall(sendTyping, conversationId);
  }, [handleApiCall]);

  const fetchReadReceipts = useCallback((messageId) => {
    if (!messageId) return Promise.reject('Message ID is required');
    return handleApiCall(getReadReceipts, messageId);
  }, [handleApiCall]);

  const createNewPoll = useCallback((pollData) =>
    handleApiCall(createPoll, pollData).then((data) => {
      setMessages((prev) => [data, ...prev]);
      if (updateLastMessage) {
        updateLastMessage(pollData.conversationId, data);
      }
      return data;
    }), [handleApiCall, updateLastMessage]);

  const voteInPoll = useCallback((messageId, optionIndex) =>
    handleApiCall(votePoll, messageId, optionIndex).then((data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === messageId ? data : msg))
      );
      return data;
    }), [handleApiCall]);

  const addMessageReaction = useCallback((messageId, reaction) =>
    handleApiCall(addReaction, messageId, reaction).then((data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.message_id === messageId ? data : msg))
      );
      return data;
    }), [handleApiCall]);

  const markRead = useCallback((messageId) =>
    handleApiCall(markMessageAsRead, messageId).then((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId ? { ...msg, is_read: true, status: 'read' } : msg
        )
      );
      return data;
    }), [handleApiCall]);

  const deleteMsg = useCallback((messageId) =>
    handleApiCall(deleteMessage, messageId).then(() => {
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
    }), [handleApiCall]);

  const editMsg = useCallback((messageId, newContent) =>
    handleApiCall(editMessage, { messageId, newContent }).then((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, content: data.content, is_edited: true, editedAt: data.editedAt }
            : msg
        )
      );
      return data;
    }), [handleApiCall]);

  const searchMsgs = useCallback((conversationId, query, params = { limit: 50 }) =>
    handleApiCall(searchMessages, conversationId, query, params).then((data) => {
      setMessages(data || []);
      return data;
    }), [handleApiCall]);

  const pinMsg = useCallback((messageId) =>
    handleApiCall(pinMessage, messageId), [handleApiCall]);

  const unpinMsg = useCallback((messageId) =>
    handleApiCall(unpinMessage, messageId), [handleApiCall]);

  const loadScheduledMessages = useCallback((conversationId, params = { page: 1, limit: 20 }) =>
    handleApiCall(listScheduledMessages, conversationId, params).then((data) => {
      setScheduledMessages(data.messages || []);
      return data;
    }), [handleApiCall]);

  const cancelScheduledMsg = useCallback((messageId) =>
    handleApiCall(cancelScheduledMessage, messageId).then(() => {
      setScheduledMessages((prev) =>
        prev.filter((msg) => msg.message_id !== messageId)
      );
    }), [handleApiCall]);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(() => ({
    messages,
    setMessages,
    scheduledMessages,
    loading,
    error,
    loadMessages,
    sendNewMessage,
    sendTypingIndicator,
    fetchReadReceipts,
    createNewPoll,
    voteInPoll,
    addMessageReaction,
    markRead,
    deleteMsg,
    editMsg,
    searchMsgs,
    pinMsg,
    unpinMsg,
    loadScheduledMessages,
    cancelScheduledMsg,
    clearError,
  }), [
    messages,
    scheduledMessages,
    loading,
    error,
    loadMessages,
    sendNewMessage,
    sendTypingIndicator,
    fetchReadReceipts,
    createNewPoll,
    voteInPoll,
    addMessageReaction,
    markRead,
    deleteMsg,
    editMsg,
    searchMsgs,
    pinMsg,
    unpinMsg,
    loadScheduledMessages,
    cancelScheduledMsg,
    clearError,
  ]);
};

export default useMessages;