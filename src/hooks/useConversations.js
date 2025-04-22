import { useState, useCallback, useMemo } from 'react';
import {
  createConversation,
  fetchConversations,
  fetchConversation,
  updateConversation,
  updateChatSettings,
  updateEphemeralSettings,
  addMembers,
  removeMembers,
  joinViaInvite,
  leaveConversation,
  rotateKeys,
  deleteConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
  pinConversation,
  unpinConversation,
} from '../api/messagesApi';

const useConversations = ({ token, userId, onLogout, navigate }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
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

  const createNewConversation = useCallback(async (data) => {
    const newConv = await handleApiCall(createConversation, data);
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConversation(newConv);
    return newConv;
  }, [handleApiCall]);

  const loadConversations = useCallback(async (params = { page: 1, limit: 20 }) => {
    const data = await handleApiCall(fetchConversations, params);
    setConversations(data.conversations || []);
    return data;
  }, [handleApiCall]);

  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const data = await handleApiCall(fetchConversation, conversationId);
    setSelectedConversation(data);
    return data;
  }, [handleApiCall]);

  const updateConv = useCallback(async (conversationId, data) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(updateConversation, conversationId, data);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const updateSettings = useCallback(async (conversationId, data) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(updateChatSettings, conversationId, data);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const updateEphemeral = useCallback(async (conversationId, data) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(updateEphemeralSettings, conversationId, data);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const addGroupMembers = useCallback(async (conversationId, members) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(addMembers, conversationId, members);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const removeGroupMembers = useCallback(async (conversationId, members) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(removeMembers, conversationId, members);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const joinConversation = useCallback(async (inviteLink) => {
    if (!inviteLink) throw new Error('Invite link is required');
    const newConv = await handleApiCall(joinViaInvite, inviteLink);
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConversation(newConv);
    return newConv;
  }, [handleApiCall]);

  const leaveConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    await handleApiCall(leaveConversation, conversationId);
    setConversations((prev) =>
      prev.filter((conv) => conv.conversation_id !== conversationId)
    );
    setSelectedConversation(null);
  }, [handleApiCall]);

  const rotateConvKeys = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(rotateKeys, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    setSelectedConversation(updatedConv);
    return updatedConv;
  }, [handleApiCall]);

  const deleteConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    await handleApiCall(deleteConversation, conversationId);
    setConversations((prev) =>
      prev.filter((conv) => conv.conversation_id !== conversationId)
    );
    setSelectedConversation(null);
  }, [handleApiCall]);

  const archiveConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(archiveConversation, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const unarchiveConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(unarchiveConversation, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const muteConv = useCallback(async (conversationId, data) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(muteConversation, conversationId, data);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const unmuteConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(unmuteConversation, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const pinConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(pinConversation, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const unpinConv = useCallback(async (conversationId) => {
    if (!conversationId) throw new Error('Conversation ID is required');
    const updatedConv = await handleApiCall(unpinConversation, conversationId);
    setConversations((prev) =>
      prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
    );
    return updatedConv;
  }, [handleApiCall]);

  const getOrCreateConversation = useCallback(async (friendId) => {
    if (!friendId) throw new Error('Friend ID is required');
    const data = await handleApiCall(createConversation, { friendId, type: 'direct' });
    setConversations((prev) => {
      if (!prev.some((conv) => conv.conversation_id === data.conversation_id)) {
        return [data, ...prev];
      }
      return prev;
    });
    setSelectedConversation(data);
    return data;
  }, [handleApiCall]);

  const updateLastMessage = useCallback((conversationId, message) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversation_id === conversationId
          ? { ...conv, lastMessage: message }
          : conv
      )
    );
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(() => ({
    conversations,
    selectedConversation,
    loading,
    error,
    createNewConversation,
    loadConversations,
    loadConversation,
    setSelectedConversation,
    updateConv,
    updateSettings,
    updateEphemeral,
    addGroupMembers,
    removeGroupMembers,
    joinConversation,
    leaveConv,
    rotateConvKeys,
    deleteConv,
    archiveConv,
    unarchiveConv,
    muteConv,
    unmuteConv,
    pinConv,
    unpinConv,
    getOrCreateConversation,
    updateLastMessage,
    clearError,
  }), [
    conversations,
    selectedConversation,
    loading,
    error,
    createNewConversation,
    loadConversations,
    loadConversation,
    updateConv,
    updateSettings,
    updateEphemeral,
    addGroupMembers,
    removeGroupMembers,
    joinConversation,
    leaveConv,
    rotateConvKeys,
    deleteConv,
    archiveConv,
    unarchiveConv,
    muteConv,
    unmuteConv,
    pinConv,
    unpinConv,
    getOrCreateConversation,
    updateLastMessage,
    clearError,
  ]);
};

export default useConversations;