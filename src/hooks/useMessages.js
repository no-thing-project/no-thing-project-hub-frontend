import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  sendMessage,
  fetchMessages,
  markMessageAsRead,
  deleteMessage,
  editMessage,
  searchMessages,
  createConversation,
  fetchConversations,
  fetchConversation,
  updateConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
  pinConversation,
  unpinConversation,
  deleteConversation,
  fetchGroupChats,
  createGroupChat,
  updateGroupChat,
  addGroupMembers,
  removeGroupMembers,
  deleteGroupChat,
  uploadFile,
  fetchFile,
  deleteFile,
} from '../api/messagesApi';

// Type definitions for better maintainability
/** @typedef {{ conversation_id: string, lastMessage?: string, isArchived?: boolean, mutedBy?: string[], pinnedBy?: string[], participants?: string[], name?: string, group_id?: string }} Conversation */
/** @typedef {{ group_id: string, name: string, members: string[] }} GroupChat */
/** @typedef {{ message_id: string, conversation_id: string, group_id?: string, content: string, timestamp: string, is_read?: boolean, status?: string, media?: Array<{ type: string, content: string, shape: string }> }} Message */
/** @typedef {{ file: File, type: string, preview: string }} PendingMedia */

/**
 * Custom hook for managing messaging functionality
 * @param {string} token - Authentication token
 * @param {string} userId - Current user ID
 * @param {(message: string) => void} onLogout - Logout callback
 * @param {(path: string) => void} navigate - Navigation function
 * @param {Array<{ anonymous_id: string }>} [friends=[]] - List of friends
 * @returns {object} Messaging utilities and state
 */
const useMessages = (token, userId, onLogout, navigate, friends = []) => {
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Centralized API call wrapper with retry logic
  const withApiCall = useCallback(async (apiFn, ...args) => {
    if (!token || !userId) {
      throw new Error('Missing authentication credentials');
    }
    setLoading(true);
    setError(null);
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const result = await apiFn(...args);
        setLoading(false);
        return result;
      } catch (err) {
        if (err.status === 429 && retries > 1) {
          // Exponential backoff for rate limiting
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          retries--;
          continue;
        }
        setLoading(false);
        handleAuthError(err);
        throw err;
      }
    }
  }, [token, userId]);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout('Your session has expired. Please log in again.');
        navigate('/login');
        setError('Session expired. Redirecting to login...');
        // Clear states on logout
        setMessages([]);
        setConversations([]);
        setGroupChats([]);
        setPendingMedia([]);
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    },
    [onLogout, navigate]
  );

  // Memoized state updater to prevent unnecessary re-renders
  const updateState = useCallback(
    (setter) => (updater) => {
      setter((prev) => {
        const updated = typeof updater === 'function' ? updater(prev) : updater;
        return Array.isArray(updated) ? [...new Set(updated.map(item => JSON.stringify(item)))].map(str => JSON.parse(str)) : { ...updated };
      });
    },
    []
  );

  const updateMessages = updateState(setMessages);
  const updateConversations = updateState(setConversations);
  const updateGroupChats = updateState(setGroupChats);

  // Load initial data with cleanup
  const loadInitialData = useCallback(async () => {
    if (!token || !userId) return;
    await withApiCall(async () => {
      const [convs, groups] = await Promise.all([
        fetchConversations({ page: 1, limit: 20 }, token),
        fetchGroupChats(token),
      ]);
      const convMessages = await Promise.all(
        convs.conversations.map((conv) =>
          fetchMessages(conv.conversation_id, { page: 1, limit: 20 }, token).catch(() => ({ messages: [] }))
        )
      );
      updateConversations(convs.conversations);
      updateGroupChats(groups);
      updateMessages(convMessages.flatMap((m) => m.messages || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    });
  }, [token, userId, withApiCall]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) loadInitialData();
    return () => {
      isMounted = false;
      // Cleanup pending media URLs
      pendingMedia.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      setPendingMedia([]);
    };
  }, [loadInitialData, pendingMedia]);

  const createNewConversation = useCallback(
    async (friendId) => {
      if (!friendId) throw new Error('Friend ID is required');
      return await withApiCall(async () => {
        const conv = await createConversation(friendId, token);
        updateConversations((prev) => {
          const exists = prev.find((c) => c.conversation_id === conv.conversation_id);
          if (exists) return prev;
          return [...prev, conv];
        });
        return conv;
      });
    },
    [token, withApiCall]
  );

  const getOrCreateConversation = useCallback(
    async (friendId) => {
      if (!friendId) throw new Error('Friend ID is required');
      const existingConv = conversations.find(
        (c) => !c.group_id && c.participants?.includes(friendId) && c.participants?.includes(userId)
      );
      if (existingConv) {
        return existingConv;
      }
      return await createNewConversation(friendId);
    },
    [conversations, userId, createNewConversation]
  );

  const sendNewMessage = useCallback(
    async (conversationId, content, replyTo) => {
      if (!conversationId || !content?.trim()) {
        throw new Error('Conversation ID and content are required');
      }
      return await withApiCall(async () => {
        const message = await sendMessage({ conversationId, content, replyTo }, token);
        updateMessages((prev) => {
          const exists = prev.find((m) => m.message_id === message.message_id);
          if (exists) return prev;
          return [...prev, { ...message, conversation_id: conversationId }].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId
              ? { ...c, lastMessage: message.message_id }
              : c
          )
        );
        return message;
      });
    },
    [token, withApiCall]
  );

  const sendMediaMessage = useCallback(
    async (conversationId, content = 'Media message', mediaFiles = [], replyTo) => {
      if (!conversationId || !mediaFiles.length && !content.trim()) {
        throw new Error('Conversation ID and content or media are required');
      }
      return await withApiCall(async () => {
        const media = await Promise.all(
          mediaFiles.map(async (file) => {
            const { url, fileKey } = await uploadFile(file, token);
            return { type: file.type.split('/')[0], content: url, shape: 'square' };
          })
        );
        const message = await sendMessage({ conversationId, content, media, replyTo }, token);
        updateMessages((prev) => {
          const exists = prev.find((m) => m.message_id === message.message_id);
          if (exists) return prev;
          return [...prev, { ...message, conversation_id: conversationId }].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId
              ? { ...c, lastMessage: message.message_id }
              : c
          )
        );
        setPendingMedia([]);
        return message;
      });
    },
    [token, withApiCall]
  );

  const addPendingMedia = useCallback((file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPendingMedia((prev) => [...prev, { file, type: file.type, preview }]);
  }, []);

  const clearPendingMedia = useCallback((index) => {
    setPendingMedia((prev) => {
      const newList = index === undefined ? [] : prev.filter((_, i) => i !== index);
      const removed = index === undefined ? prev : [prev[index]];
      removed.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      return newList;
    });
  }, []);

  const getConversationById = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(() => fetchConversation(conversationId, token));
    },
    [token, withApiCall]
  );

  const fetchConversationMessages = useCallback(
    async (conversationId, { page = 1, limit = 20, reset = false } = {}) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const data = await fetchMessages(conversationId, { page, limit }, token);
        const messages = data.messages || [];
        updateMessages((prev) => {
          if (reset) {
            return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          const existingIds = new Set(prev.map((m) => m.message_id));
          const newMessages = messages.filter((m) => !existingIds.has(m.message_id));
          return [...prev, ...newMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        return {
          messages,
          hasMore: messages.length === limit,
          totalMessages: data.totalMessages || messages.length,
        };
      });
    },
    [token, withApiCall]
  );

  const markRead = useCallback(
    async (messageId) => {
      if (!messageId) throw new Error('Message ID is required');
      return await withApiCall(async () => {
        const data = await markMessageAsRead(messageId, token);
        updateMessages((prev) =>
          prev.map((m) =>
            m.message_id === messageId ? { ...m, is_read: true, status: 'read' } : m
          )
        );
        return data;
      });
    },
    [token, withApiCall]
  );

  const deleteMsg = useCallback(
    async (messageId) => {
      if (!messageId) throw new Error('Message ID is required');
      return await withApiCall(async () => {
        await deleteMessage(messageId, token);
        updateMessages((prev) => prev.filter((m) => m.message_id !== messageId));
      });
    },
    [token, withApiCall]
  );

  const editMsg = useCallback(
    async (messageId, newContent) => {
      if (!messageId || !newContent?.trim()) throw new Error('Message ID and content are required');
      return await withApiCall(async () => {
        const updated = await editMessage({ messageId, newContent }, token);
        updateMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, ...updated } : m))
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const searchMsgs = useCallback(
    async (conversationId, query) => {
      if (!conversationId || !query?.trim()) throw new Error('Conversation ID and query are required');
      return await withApiCall(() =>
        searchMessages(conversationId, query, { limit: 50 }, token)
      );
    },
    [token, withApiCall]
  );

  const updateConv = useCallback(
    async (conversationId, name) => {
      if (!conversationId || !name) throw new Error('Conversation ID and name are required');
      return await withApiCall(async () => {
        const updated = await updateConversation(conversationId, { name }, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, ...updated } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const archiveConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await archiveConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, isArchived: true } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const unarchiveConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await unarchiveConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, isArchived: false } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const muteConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await muteConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, mutedBy: updated.mutedBy } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const unmuteConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await unmuteConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, mutedBy: updated.mutedBy } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const pinConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await pinConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, pinnedBy: updated.pinnedBy } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const unpinConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        const updated = await unpinConversation(conversationId, token);
        updateConversations((prev) =>
          prev.map((c) =>
            c.conversation_id === conversationId ? { ...c, pinnedBy: updated.pinnedBy } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const deleteConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      return await withApiCall(async () => {
        await deleteConversation(conversationId, token);
        updateConversations((prev) =>
          prev.filter((c) => c.conversation_id !== conversationId)
        );
        updateMessages((prev) =>
          prev.filter((m) => m.conversation_id !== conversationId)
        );
      });
    },
    [token, withApiCall]
  );

  const createNewGroupChat = useCallback(
    async (name, members) => {
      if (!name || !members?.length) throw new Error('Group name and members are required');
      return await withApiCall(async () => {
        const group = await createGroupChat({ name, members }, token);
        updateGroupChats((prev) => {
          const exists = prev.find((g) => g.group_id === group.group_id);
          if (exists) return prev;
          return [...prev, group];
        });
        updateConversations((prev) => {
          const exists = prev.find((c) => c.group_id === group.group_id);
          if (exists) return prev;
          return [...prev, group.conversation];
        });
        return group;
      });
    },
    [token, withApiCall]
  );

  const updateGroup = useCallback(
    async (groupId, name) => {
      if (!groupId || !name) throw new Error('Group ID and name are required');
      return await withApiCall(async () => {
        const updated = await updateGroupChat(groupId, { name }, token);
        updateGroupChats((prev) =>
          prev.map((g) => (g.group_id === groupId ? updated : g))
        );
        updateConversations((prev) =>
          prev.map((c) =>
            c.group_id === groupId ? { ...c, name: updated.name } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const addMembers = useCallback(
    async (groupId, members) => {
      if (!groupId || !members?.length) throw new Error('Group ID and members are required');
      return await withApiCall(async () => {
        const updated = await addGroupMembers(groupId, { members }, token);
        updateGroupChats((prev) =>
          prev.map((g) => (g.group_id === groupId ? updated : g))
        );
        updateConversations((prev) =>
          prev.map((c) =>
            c.group_id === groupId ? { ...c, participants: updated.members } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const removeMembers = useCallback(
    async (groupId, members) => {
      if (!groupId || !members?.length) throw new Error('Group ID and members are required');
      return await withApiCall(async () => {
        const updated = await removeGroupMembers(groupId, { members }, token);
        updateGroupChats((prev) =>
          prev.map((g) => (g.group_id === groupId ? updated : g))
        );
        updateConversations((prev) =>
          prev.map((c) =>
            c.group_id === groupId ? { ...c, participants: updated.members } : c
          )
        );
        return updated;
      });
    },
    [token, withApiCall]
  );

  const deleteGroup = useCallback(
    async (groupId) => {
      if (!groupId) throw new Error('Group ID is required');
      return await withApiCall(async () => {
        await deleteGroupChat(groupId, token);
        updateGroupChats((prev) => prev.filter((g) => g.group_id !== groupId));
        updateConversations((prev) => prev.filter((c) => c.group_id !== groupId));
        updateMessages((prev) => prev.filter((m) => m.group_id !== groupId));
      });
    },
    [token, withApiCall]
  );

  const uploadMediaFile = useCallback(
    async (file) => {
      if (!file) throw new Error('File is required');
      return await withApiCall(() => uploadFile(file, token));
    },
    [token, withApiCall]
  );

  const fetchMediaFile = useCallback(
    async (fileKey) => {
      if (!fileKey) throw new Error('File key is required');
      return await withApiCall(() => fetchFile(fileKey, token));
    },
    [token, withApiCall]
  );

  const deleteMediaFile = useCallback(
    async (fileKey) => {
      if (!fileKey) throw new Error('File key is required');
      return await withApiCall(() => deleteFile(fileKey, token));
    },
    [token, withApiCall]
  );

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      conversations,
      groupChats,
      messages,
      setMessages,
      pendingMedia,
      loading,
      error,
      sendNewMessage,
      sendMediaMessage,
      addPendingMedia,
      clearPendingMedia,
      getOrCreateConversation,
      getConversationById,
      fetchConversationMessages,
      markRead,
      deleteMsg,
      editMsg,
      searchMsgs,
      createNewConversation,
      updateConv,
      archiveConv,
      unarchiveConv,
      muteConv,
      unmuteConv,
      pinConv,
      unpinConv,
      deleteConv,
      createNewGroupChat,
      updateGroup,
      addMembers,
      removeMembers,
      deleteGroup,
      uploadMediaFile,
      fetchMediaFile,
      deleteMediaFile,
      refresh: loadInitialData,
    }),
    [
      conversations,
      groupChats,
      messages,
      pendingMedia,
      loading,
      error,
      sendNewMessage,
      sendMediaMessage,
      addPendingMedia,
      clearPendingMedia,
      getOrCreateConversation,
      getConversationById,
      fetchConversationMessages,
      markRead,
      deleteMsg,
      editMsg,
      searchMsgs,
      createNewConversation,
      updateConv,
      archiveConv,
      unarchiveConv,
      muteConv,
      unmuteConv,
      pinConv,
      unpinConv,
      deleteConv,
      createNewGroupChat,
      updateGroup,
      addMembers,
      removeMembers,
      deleteGroup,
      uploadMediaFile,
      fetchMediaFile,
      deleteMediaFile,
      loadInitialData,
    ]
  );
};

export default useMessages;