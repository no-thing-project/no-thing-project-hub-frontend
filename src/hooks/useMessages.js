import { useState, useCallback, useEffect } from 'react';
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

const useMessages = (token, userId, onLogout, navigate, friends = []) => {
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback((err) => {
    if (err.status === 401 || err.status === 403) {
      onLogout('Your session has expired. Please log in again.');
      navigate('/login');
      setError('Session expired. Redirecting to login...');
    } else {
      setError(err.message || 'An unexpected error occurred.');
    }
  }, [onLogout, navigate]);

  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const updated = updater(prev).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return updated;
    });
  }, []);

  const updateConversations = useCallback((updater) => {
    setConversations((prev) => updater(prev));
  }, []);

  const updateGroupChats = useCallback((updater) => {
    setGroupChats((prev) => updater(prev));
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const [convs, groups] = await Promise.all([
        fetchConversations({ page: 1, limit: 20 }, token),
        fetchGroupChats(token),
      ]);
      const convMessages = await Promise.all(
        convs.conversations.map((conv) => fetchMessages(conv.conversation_id, { page: 1, limit: 20 }, token))
      );
      setConversations(convs.conversations);
      setGroupChats(groups);
      setMessages(convMessages.flatMap((m) => m.messages || []));
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, userId, handleAuthError]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const sendNewMessage = useCallback(async (conversationId, content, replyTo) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const message = await sendMessage({ conversationId, content, replyTo }, token);
      updateMessages((prev) => [...prev, message]);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, lastMessage: message.message_id } : c))
      );
      return message;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages, updateConversations]);

  const sendMediaMessage = useCallback(async (conversationId, content = 'Media message', mediaFiles = [], replyTo) => {
    if (!token || !conversationId || !mediaFiles.length) return;
    setLoading(true);
    try {
      const media = await Promise.all(
        mediaFiles.map(async (file) => {
          const { url, fileKey } = await uploadFile(file, token);
          return { type: file.type.split('/')[0], content: url, shape: 'square' };
        })
      );
      const message = await sendMessage({ conversationId, content, media, replyTo }, token);
      updateMessages((prev) => [...prev, message]);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, lastMessage: message.message_id } : c))
      );
      setPendingMedia([]);
      return message;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages, updateConversations]);

  const addPendingMedia = useCallback((file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPendingMedia((prev) => [...prev, { file, type: file.type, preview }]);
  }, []);

  const clearPendingMedia = useCallback((index) => {
    setPendingMedia((prev) => {
      if (index === undefined) {
        prev.forEach((item) => URL.revokeObjectURL(item.preview));
        return [];
      }
      const newList = [...prev];
      const removed = newList.splice(index, 1)[0];
      URL.revokeObjectURL(removed.preview);
      return newList;
    });
  }, []);

  const fetchConversationMessages = useCallback(async (conversationId, { page = 1, limit = 20 } = {}) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const data = await fetchMessages(conversationId, { page, limit }, token);
      updateMessages((prev) => [...prev.filter((m) => m.conversation_id !== conversationId), ...data.messages]);
      return data;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages]);

  const markRead = useCallback(async (messageId) => {
    if (!token || !messageId) return;
    setLoading(true);
    try {
      const data = await markMessageAsRead(messageId, token);
      updateMessages((prev) =>
        prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true, status: 'read' } : m))
      );
      return data;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages]);

  const deleteMsg = useCallback(async (messageId) => {
    if (!token || !messageId) return;
    setLoading(true);
    try {
      await deleteMessage(messageId, token);
      updateMessages((prev) => prev.filter((m) => m.message_id !== messageId));
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages]);

  const editMsg = useCallback(async (messageId, newContent) => {
    if (!token || !messageId || !newContent) return;
    setLoading(true);
    try {
      const updated = await editMessage({ messageId, newContent }, token);
      updateMessages((prev) => prev.map((m) => (m.message_id === messageId ? { ...m, ...updated } : m)));
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateMessages]);

  const searchMsgs = useCallback(async (conversationId, query) => {
    if (!token || !conversationId || !query) return;
    setLoading(true);
    try {
      const results = await searchMessages(conversationId, query, {}, token);
      return results;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  const createNewConversation = useCallback(async (friendId) => {
    if (!token || !friendId) return;
    setLoading(true);
    try {
      const conv = await createConversation(friendId, token);
      updateConversations((prev) => [...prev, conv]);
      return conv;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const updateConv = useCallback(async (conversationId, name) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await updateConversation(conversationId, { name }, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, ...updated } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const archiveConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await archiveConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, isArchived: true } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const unarchiveConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await unarchiveConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, isArchived: false } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const muteConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await muteConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, mutedBy: updated.mutedBy } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const unmuteConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await unmuteConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, mutedBy: updated.mutedBy } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const pinConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await pinConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, pinnedBy: updated.pinnedBy } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const unpinConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      const updated = await unpinConversation(conversationId, token);
      updateConversations((prev) =>
        prev.map((c) => (c.conversation_id === conversationId ? { ...c, pinnedBy: updated.pinnedBy } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations]);

  const deleteConv = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    setLoading(true);
    try {
      await deleteConversation(conversationId, token);
      updateConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
      updateMessages((prev) => prev.filter((m) => m.conversation_id !== conversationId));
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateConversations, updateMessages]);

  const createNewGroupChat = useCallback(async (name, members) => {
    if (!token || !name || !members.length) return;
    setLoading(true);
    try {
      const group = await createGroupChat({ name, members }, token);
      updateGroupChats((prev) => [...prev, group]);
      updateConversations((prev) => [...prev, group.conversation]);
      return group;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateGroupChats, updateConversations]);

  const updateGroup = useCallback(async (groupId, name) => {
    if (!token || !groupId) return;
    setLoading(true);
    try {
      const updated = await updateGroupChat(groupId, { name }, token);
      updateGroupChats((prev) => prev.map((g) => (g.group_id === groupId ? updated : g)));
      updateConversations((prev) =>
        prev.map((c) => (c.group_id === groupId ? { ...c, name: updated.name } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateGroupChats, updateConversations]);

  const addMembers = useCallback(async (groupId, members) => {
    if (!token || !groupId || !members.length) return;
    setLoading(true);
    try {
      const updated = await addGroupMembers(groupId, { members }, token);
      updateGroupChats((prev) => prev.map((g) => (g.group_id === groupId ? updated : g)));
      updateConversations((prev) =>
        prev.map((c) => (c.group_id === groupId ? { ...c, participants: updated.members } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateGroupChats, updateConversations]);

  const removeMembers = useCallback(async (groupId, members) => {
    if (!token || !groupId || !members.length) return;
    setLoading(true);
    try {
      const updated = await removeGroupMembers(groupId, { members }, token);
      updateGroupChats((prev) => prev.map((g) => (g.group_id === groupId ? updated : g)));
      updateConversations((prev) =>
        prev.map((c) => (c.group_id === groupId ? { ...c, participants: updated.members } : c))
      );
      return updated;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateGroupChats, updateConversations]);

  const deleteGroup = useCallback(async (groupId) => {
    if (!token || !groupId) return;
    setLoading(true);
    try {
      await deleteGroupChat(groupId, token);
      updateGroupChats((prev) => prev.filter((g) => g.group_id !== groupId));
      updateConversations((prev) => prev.filter((c) => c.group_id !== groupId));
      updateMessages((prev) => prev.filter((m) => m.group_id !== groupId));
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError, updateGroupChats, updateConversations, updateMessages]);

  const uploadMediaFile = useCallback(async (file) => {
    if (!token || !file) return;
    setLoading(true);
    try {
      const data = await uploadFile(file, token);
      return data;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  const fetchMediaFile = useCallback(async (fileKey) => {
    if (!token || !fileKey) return;
    setLoading(true);
    try {
      const data = await fetchFile(fileKey, token);
      return data;
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  const deleteMediaFile = useCallback(async (fileKey) => {
    if (!token || !fileKey) return;
    setLoading(true);
    try {
      await deleteFile(fileKey, token);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  return {
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
  };
};

export default useMessages;