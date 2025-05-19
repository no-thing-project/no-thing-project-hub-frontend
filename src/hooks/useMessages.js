import { useState, useCallback, useMemo, useRef } from 'react';
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
  generatePresignedUrl,
} from '../api/messagesApi';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook for managing messages in a conversation.
 * @param {Object} options
 * @param {string} options.token - Authentication token
 * @param {string} options.userId - User ID
 * @param {Function} options.onLogout - Logout callback
 * @param {Function} options.navigate - Navigation function
 * @param {Function} [options.updateLastMessage] - Optional callback to update last message
 * @returns {Object} - Message management functions and state
 */
const useMessages = ({ token, userId, onLogout, navigate, updateLastMessage }) => {
  const [messages, setMessages] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  /**
   * Generic API call handler with error handling and authentication checks.
   * @param {Function} apiFn - API function to call
   * @param {...any} args - Arguments for the API function
   * @returns {Promise<any>} - API response
   */
  const handleApiCall = useCallback(
    async (apiFn, ...args) => {
      setLoading(true);
      setError(null);
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
        console.error('[useMessages] API error:', errorMessage);
        throw new Error(errorMessage);
      }
    },
    [token, onLogout, navigate]
  );

  /**
   * Load messages for a conversation with pagination.
   * @param {string} conversationId - Conversation ID
   * @param {Object} [params] - Query params (page, limit, cursor, threadId)
   * @returns {Promise<Object>} - Messages and metadata
   */
  const loadMessages = useCallback(
    async (conversationId, params = { page: 1, limit: 20 }) => {
      if (!conversationId) {
        setError('Conversation ID is required');
        return { messages: [], total: 0, nextCursor: null };
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        console.log(`[useMessages] Loading messages for conversation: ${conversationId}, page: ${params.page}`);
        const data = await handleApiCall(fetchMessages, conversationId, params, abortControllerRef.current.signal);
        const newMessages = Array.isArray(data?.messages) ? data.messages : [];
        setMessages((prev) => {
          const existingIds = new Set(prev.map((msg) => msg.message_id));
          const filteredNewMessages = newMessages.filter((msg) => !existingIds.has(msg.message_id));
          return params.page === 1 ? newMessages : [...prev, ...filteredNewMessages];
        });
        console.log(`[useMessages] Loaded ${newMessages.length} messages`);
        return {
          messages: newMessages,
          total: data.total || 0,
          nextCursor: data.nextCursor || null,
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('[useMessages] Fetch messages aborted');
          return { messages: [], total: 0, nextCursor: null };
        }
        console.error('[useMessages] loadMessages error:', error);
        setMessages([]);
        return { messages: [], total: 0, nextCursor: null };
      }
    },
    [handleApiCall]
  );

  /**
   * Send a new message.
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {Array} [media] - Media attachments
   * @param {string} [replyTo] - Reply-to message ID
   * @param {string} [scheduledAt] - Scheduled send time
   * @param {string} [forwardedFrom] - Forwarded message ID
   * @param {string} [threadId] - Thread ID
   * @returns {Promise<Object>} - Sent message
   */
  const sendNewMessage = useCallback(
    async (conversationId, content, media = [], replyTo, scheduledAt, forwardedFrom, threadId) => {
      if (!conversationId) throw new Error('Conversation ID is required');

      const messagePayload = {
        conversationId,
        content,
        media,
        replyTo,
        forwardedFrom,
        threadId,
      };
      if (scheduledAt && !isNaN(Date.parse(scheduledAt))) {
        messagePayload.scheduledAt = scheduledAt;
      }

      console.log('[useMessages] Sending message:', messagePayload);
      try {
        const data = await handleApiCall(
          sendMessage,
          conversationId,
          content,
          media,
          replyTo,
          scheduledAt,
          forwardedFrom,
          threadId
        );
        if (!data || !data.message_id) {
          throw new Error('Invalid message response from server');
        }
        if (!scheduledAt) {
          setMessages((prev) => [data, ...prev]);
          if (updateLastMessage) {
            updateLastMessage(conversationId, data);
          }
        } else {
          setScheduledMessages((prev) => [data, ...prev]);
        }
        console.log('[useMessages] Message sent successfully:', data);
        return data;
      } catch (err) {
        console.error('[useMessages] Send message error:', err);
        throw err;
      }
    },
    [handleApiCall, updateLastMessage]
  );

  /**
   * Generate presigned URL for file upload.
   * @param {string} fileType - MIME type of the file
   * @param {string} contentType - Content type (e.g., image, video)
   * @returns {Promise<Object>} - Presigned URL and file metadata
   */
  const generatePresignedUrlForUpload = useCallback(
    async (fileType, contentType) => {
      try {
        const data = await handleApiCall(generatePresignedUrl, fileType, contentType);
        console.log('[useMessages] Generated presigned URL:', data);
        return data;
      } catch (err) {
        console.error('[useMessages] Generate presigned URL error:', err);
        throw err;
      }
    },
    [handleApiCall]
  );

  /**
   * Send typing indicator.
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Typing response
   */
  const sendTypingIndicator = useCallback(
    (conversationId) => {
      if (!conversationId) return Promise.reject(new Error('Conversation ID is required'));
      return handleApiCall(sendTyping, conversationId);
    },
    [handleApiCall]
  );

  /**
   * Fetch read receipts for a message.
   * @param {string} messageId - Message ID
   * @returns {Promise<Array>} - Read receipts
   */
  const fetchReadReceipts = useCallback(
    (messageId) => {
      if (!messageId) return Promise.reject(new Error('Message ID is required'));
      return handleApiCall(getReadReceipts, messageId);
    },
    [handleApiCall]
  );

  /**
   * Create a new poll.
   * @param {Object} pollData - Poll data (conversationId, question, options)
   * @returns {Promise<Object>} - Created poll message
   */
  const createNewPoll = useCallback(
    (pollData) =>
      handleApiCall(createPoll, pollData).then((data) => {
        setMessages((prev) => [data, ...prev]);
        if (updateLastMessage) {
          updateLastMessage(pollData.conversationId, data);
        }
        console.log('[useMessages] Poll created successfully:', data);
        return data;
      }),
    [handleApiCall, updateLastMessage]
  );

  /**
   * Vote in a poll.
   * @param {string} messageId - Poll message ID
   * @param {number} optionIndex - Selected option index
   * @returns {Promise<Object>} - Updated poll message
   */
  const voteInPoll = useCallback(
    (messageId, optionIndex) =>
      handleApiCall(votePoll, messageId, optionIndex).then((data) => {
        setMessages((prev) => prev.map((msg) => (msg.message_id === messageId ? data : msg)));
        console.log('[useMessages] Voted in poll:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Add a reaction to a message.
   * @param {string} messageId - Message ID
   * @param {string} reaction - Reaction (e.g., emoji)
   * @returns {Promise<Object>} - Updated message
   */
  const addMessageReaction = useCallback(
    (messageId, reaction) =>
      handleApiCall(addReaction, messageId, reaction).then((data) => {
        setMessages((prev) => prev.map((msg) => (msg.message_id === messageId ? data : msg)));
        console.log('[useMessages] Reaction added:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Mark a message as read.
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} - Updated message status
   */
  const markRead = useCallback(
    (messageId) =>
      handleApiCall(markMessageAsRead, messageId).then((data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === messageId
              ? { ...msg, is_read: data.is_read, status: data.status, readAt: data.readAt }
              : msg
          )
        );
        console.log('[useMessages] Marked message as read:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Delete a message.
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  const deleteMsg = useCallback(
    (messageId) =>
      handleApiCall(deleteMessage, messageId).then(() => {
        setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
        console.log('[useMessages] Message deleted:', messageId);
      }),
    [handleApiCall]
  );

  /**
   * Edit a message.
   * @param {string} messageId - Message ID
   * @param {string} newContent - Updated content
   * @returns {Promise<Object>} - Updated message
   */
  const editMsg = useCallback(
    (messageId, newContent) =>
      handleApiCall(editMessage, { messageId, newContent }).then((data) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === messageId
              ? { ...msg, content: data.content, is_edited: data.is_edited, editedAt: data.editedAt }
              : msg
          )
        );
        console.log('[useMessages] Message edited:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Search messages in a conversation.
   * @param {string} conversationId - Conversation ID
   * @param {string} query - Search query
   * @param {Object} [params] - Query params (limit)
   * @returns {Promise<Array>} - Search results
   */
  const searchMsgs = useCallback(
    (conversationId, query, params = { limit: 50 }) =>
      handleApiCall(searchMessages, conversationId, query, params).then((data) => {
        setMessages(data || []);
        console.log('[useMessages] Search results:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Pin a message.
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} - Pinned message info
   */
  const pinMsg = useCallback(
    (messageId) =>
      handleApiCall(pinMessage, messageId).then((data) => {
        console.log('[useMessages] Message pinned:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Unpin a message.
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} - Unpinned message info
   */
  const unpinMsg = useCallback(
    (messageId) =>
      handleApiCall(unpinMessage, messageId).then((data) => {
        console.log('[useMessages] Message unpinned:', data);
        return data;
      }),
    [handleApiCall]
  );

  /**
   * Load scheduled messages for a conversation.
   * @param {string} conversationId - Conversation ID
   * @param {Object} [params] - Query params (page, limit)
   * @returns {Promise<Object>} - Scheduled messages and metadata
   */
  const loadScheduledMessages = useCallback(
    async (conversationId, params = { page: 1, limit: 20 }) => {
      if (!conversationId) {
        setError('Conversation ID is required');
        return { messages: [], total: 0 };
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const data = await handleApiCall(
          listScheduledMessages,
          conversationId,
          params,
          abortControllerRef.current.signal
        );
        setScheduledMessages(data.messages || []);
        console.log('[useMessages] Loaded scheduled messages:', data);
        return data;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('[useMessages] Fetch scheduled messages aborted');
          return { messages: [], total: 0 };
        }
        console.error('[useMessages] loadScheduledMessages error:', error);
        setScheduledMessages([]);
        return { messages: [], total: 0 };
      }
    },
    [handleApiCall]
  );

  /**
   * Cancel a scheduled message.
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  const cancelScheduledMsg = useCallback(
    (messageId) =>
      handleApiCall(cancelScheduledMessage, messageId).then(() => {
        setScheduledMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
        console.log('[useMessages] Scheduled message cancelled:', messageId);
      }),
    [handleApiCall]
  );

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => setError(null), []);

  /**
   * Cancel ongoing requests.
   */
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return useMemo(
    () => ({
      messages,
      setMessages,
      scheduledMessages,
      loading,
      error,
      loadMessages,
      sendNewMessage,
      generatePresignedUrlForUpload,
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
      cancelRequests,
    }),
    [
      messages,
      scheduledMessages,
      loading,
      error,
      loadMessages,
      sendNewMessage,
      generatePresignedUrlForUpload,
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
      cancelRequests,
    ]
  );
};

export default useMessages;