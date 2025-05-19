import { useState, useCallback, useMemo } from 'react';
import {
  fetchConversationsApi,
  fetchConversationApi,
  createConversationApi,
  updateConversationApi,
  updateChatSettingsApi,
  updateEphemeralSettingsApi,
  addMembersApi,
  removeMembersApi,
  joinViaInviteApi,
  leaveConversationApi,
  rotateKeysApi,
  deleteConversationApi,
  archiveConversationApi,
  unarchiveConversationApi,
  muteConversationApi,
  unmuteConversationApi,
  pinConversationApi,
  unpinConversationApi,
} from '../api/conversationApi';

const useConversations = ({ token, userId, onLogout, navigate }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(
    async (apiFn, ...args) => {
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
    },
    [token, onLogout, navigate]
  );

  const createNewConversation = useCallback(
    async (data) => {
      const newConv = await handleApiCall(createConversationApi, data);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      return newConv;
    },
    [handleApiCall]
  );

  const loadConversations = useCallback(
    async (params = { page: 1, limit: 20 }, signal) => {
      const data = await handleApiCall(fetchConversationsApi, params, signal);
      setConversations(data.conversations || []);
      return data;
    },
    [handleApiCall]
  );

  const loadConversation = useCallback(
    async (conversationId, signal) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const data = await handleApiCall(fetchConversationApi, conversationId, signal);
      setSelectedConversation(data);
      return data;
    },
    [handleApiCall]
  );

  const updateConv = useCallback(
    async (conversationId, data) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(updateConversationApi, conversationId, data);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const updateSettings = useCallback(
    async (conversationId, data) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(updateChatSettingsApi, conversationId, data);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const updateEphemeral = useCallback(
    async (conversationId, data) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(updateEphemeralSettingsApi, conversationId, data);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const addGroupMembers = useCallback(
    async (conversationId, members) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(addMembersApi, conversationId, members);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const removeGroupMembers = useCallback(
    async (conversationId, members) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(removeMembersApi, conversationId, members);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const joinConversation = useCallback(
    async (inviteLink) => {
      if (!inviteLink) throw new Error('Invite link is required');
      const newConv = await handleApiCall(joinViaInviteApi, inviteLink);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      return newConv;
    },
    [handleApiCall]
  );

  const leaveConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      await handleApiCall(leaveConversationApi, conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.conversation_id !== conversationId)
      );
      setSelectedConversation(null);
    },
    [handleApiCall]
  );

  const rotateConvKeys = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(rotateKeysApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      setSelectedConversation(updatedConv);
      return updatedConv;
    },
    [handleApiCall]
  );

  const deleteConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      await handleApiCall(deleteConversationApi, conversationId);
      setConversations((prev) =>
        prev.filter((conv) => conv.conversation_id !== conversationId)
      );
      setSelectedConversation(null);
    },
    [handleApiCall]
  );

  const archiveConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(archiveConversationApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const unarchiveConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(unarchiveConversationApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const muteConv = useCallback(
    async (conversationId, data) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(muteConversationApi, conversationId, data);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const unmuteConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(unmuteConversationApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const pinConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(pinConversationApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const unpinConv = useCallback(
    async (conversationId) => {
      if (!conversationId) throw new Error('Conversation ID is required');
      const updatedConv = await handleApiCall(unpinConversationApi, conversationId);
      setConversations((prev) =>
        prev.map((conv) => (conv.conversation_id === conversationId ? updatedConv : conv))
      );
      return updatedConv;
    },
    [handleApiCall]
  );

  const getOrCreateConversation = useCallback(
    async (friendId) => {
      if (!friendId) throw new Error('Friend ID is required');
      const data = await handleApiCall(createConversationApi, { friendId, type: 'direct' });
      setConversations((prev) => {
        if (!prev.some((conv) => conv.conversation_id === data.conversation_id)) {
          return [data, ...prev];
        }
        return prev;
      });
      setSelectedConversation(data);
      return data;
    },
    [handleApiCall]
  );

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

  return useMemo(
    () => ({
      conversations,
      selectedConversation,
      loading,
      error,
      setConversations,
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
    }),
    [
      conversations,
      selectedConversation,
      loading,
      error,
      setConversations,
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
    ]
  );
};

export default useConversations;