import axios, { CancelToken } from 'axios';
import api from './apiClient';
import { handleApiError } from './apiClient';

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request cancellation support
const cancelTokens = new Map();

/**
 * Wrapper for API requests with caching and cancellation
 * @param {string} key - Cache key
 * @param {() => Promise<any>} fn - API call function
 * @param {boolean} [useCache=true] - Whether to use cache
 * @returns {Promise<any>}
 */
const withRequest = async (key, fn, useCache = true) => {
  if (useCache && cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }

  let cancelToken = null;
  try {
    if (CancelToken) {
      cancelToken = CancelToken.source();
      if (cancelTokens.has(key)) {
        cancelTokens.get(key).cancel('Request cancelled due to new request');
      }
      cancelTokens.set(key, cancelToken);
    } else {
      console.warn(`CancelToken not available for key: ${key}. Proceeding without cancellation.`);
    }
  } catch (err) {
    console.error(`Failed to create CancelToken for key: ${key}`, err);
  }

  try {
    const response = await fn(cancelToken ? cancelToken.token : undefined);
    const data = response.data?.content || response.data;
    if (useCache) {
      cache.set(key, { data, timestamp: Date.now() });
    }
    return data;
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log(`Request cancelled: ${key}`);
      return null;
    }
    throw handleApiError(err);
  } finally {
    if (cancelToken) {
      cancelTokens.delete(key);
    }
  }
};

// Conversations
export const createConversation = (data, token) =>
  withRequest(`createConversation:${data.friendId || data.name}`, (cancelToken) =>
    api.post('api/v1/conversations/', data, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const fetchConversations = ({ page = 1, limit = 20, cursor } = {}, token) =>
  withRequest(`fetchConversations:${page}:${cursor}`, (cancelToken) =>
    api.get('api/v1/conversations/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, cursor },
      cancelToken,
    })
  );

export const fetchConversation = (conversationId, token) =>
  withRequest(`fetchConversation:${conversationId}`, (cancelToken) =>
    api.get(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const updateConversation = (conversationId, data, token) =>
  withRequest(`updateConversation:${conversationId}`, (cancelToken) =>
    api.patch(`api/v1/conversations/${conversationId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const updateChatSettings = (conversationId, data, token) =>
  withRequest(`updateChatSettings:${conversationId}`, (cancelToken) =>
    api.patch(`api/v1/conversations/${conversationId}/settings`, data, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const updateEphemeralSettings = (conversationId, data, token) =>
  withRequest(`updateEphemeralSettings:${conversationId}`, (cancelToken) =>
    api.patch(`api/v1/conversations/${conversationId}/ephemeral`, data, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const addMembers = (conversationId, members, token) =>
  withRequest(`addMembers:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/members`, { members }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const removeMembers = (conversationId, members, token) =>
  withRequest(`removeMembers:${conversationId}`, (cancelToken) =>
    api.delete(`api/v1/conversations/${conversationId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { members },
      cancelToken,
    })
  );

export const joinViaInvite = (inviteLink, token) =>
  withRequest(`joinViaInvite:${inviteLink}`, (cancelToken) =>
    api.post('api/v1/conversations/join', { inviteLink }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const leaveConversation = (conversationId, token) =>
  withRequest(`leaveConversation:${conversationId}`, (cancelToken) =>
    api.delete(`api/v1/conversations/${conversationId}/leave`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const rotateKeys = (conversationId, token) =>
  withRequest(`rotateKeys:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/rotate-keys`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const deleteConversation = (conversationId, token) =>
  withRequest(`deleteConversation:${conversationId}`, (cancelToken) =>
    api.delete(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const archiveConversation = (conversationId, token) =>
  withRequest(`archiveConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/archive`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const unarchiveConversation = (conversationId, token) =>
  withRequest(`unarchiveConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/unarchive`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const muteConversation = (conversationId, data, token) =>
  withRequest(`muteConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/mute`, data, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const unmuteConversation = (conversationId, token) =>
  withRequest(`unmuteConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/unmute`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const pinConversation = (conversationId, token) =>
  withRequest(`pinConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const unpinConversation = (conversationId, token) =>
  withRequest(`unpinConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

// Messages
export const sendMessage = (messageData, token) =>
  withRequest(`sendMessage:${messageData.conversationId}`, (cancelToken) =>
    api.post('api/v1/messages/', messageData, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const fetchMessages = (conversationId, { page = 1, limit = 20, cursor } = {}, token) =>
  withRequest(`fetchMessages:${conversationId}:${page}:${cursor}`, (cancelToken) =>
    api.get(`api/v1/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, cursor },
      cancelToken,
    })
  );

export const sendTyping = (conversationId, token) =>
  withRequest(`sendTyping:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/messages/${conversationId}/typing`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const getReadReceipts = (messageId, token) =>
  withRequest(`getReadReceipts:${messageId}`, (cancelToken) =>
    api.get(`api/v1/messages/${messageId}/receipts`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const createPoll = (pollData, token) =>
  withRequest(`createPoll:${pollData.conversationId}`, (cancelToken) =>
    api.post('api/v1/messages/poll', pollData, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const votePoll = (messageId, optionIndex, token) =>
  withRequest(`votePoll:${messageId}`, (cancelToken) =>
    api.post(`api/v1/messages/${messageId}/vote`, { optionIndex }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const addReaction = (messageId, reaction, token) =>
  withRequest(`addReaction:${messageId}`, (cancelToken) =>
    api.post(`api/v1/messages/${messageId}/react`, { reaction }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const markMessageAsRead = (messageId, token) =>
  withRequest(`markMessageAsRead:${messageId}`, (cancelToken) =>
    api.put(`api/v1/messages/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const deleteMessage = (messageId, token) =>
  withRequest(`deleteMessage:${messageId}`, (cancelToken) =>
    api.delete(`api/v1/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const editMessage = ({ messageId, newContent }, token) =>
  withRequest(`editMessage:${messageId}`, (cancelToken) =>
    api.patch('api/v1/messages/edit', { messageId, newContent }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const searchMessages = (conversationId, query, { limit = 50 } = {}, token) =>
  withRequest(`searchMessages:${conversationId}:${query}`, (cancelToken) =>
    api.get(`api/v1/messages/${conversationId}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query, limit },
      cancelToken,
    })
  );

export const pinMessage = (messageId, token) =>
  withRequest(`pinMessage:${messageId}`, (cancelToken) =>
    api.post(`api/v1/messages/${messageId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const unpinMessage = (messageId, token) =>
  withRequest(`unpinMessage:${messageId}`, (cancelToken) =>
    api.post(`api/v1/messages/${messageId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const listScheduledMessages = (conversationId, { page = 1, limit = 20 } = {}, token) =>
  withRequest(`listScheduledMessages:${conversationId}:${page}`, (cancelToken) =>
    api.get('api/v1/messages/scheduled', {
      headers: { Authorization: `Bearer ${token}` },
      params: { conversationId, page, limit },
      cancelToken,
    })
  );

export const cancelScheduledMessage = (messageId, token) =>
  withRequest(`cancelScheduledMessage:${messageId}`, (cancelToken) =>
    api.delete(`api/v1/messages/${messageId}/scheduled`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

// File Uploads
export const uploadFile = async (file, token) => {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  if (file.size <= chunkSize) {
    return withRequest(`uploadFile:${file.name}`, (cancelToken) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('api/v1/uploads/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        cancelToken,
      });
    });
  }

  // Chunked upload for large files (Note: Backend does not currently support chunked uploads)
  throw new Error('Chunked uploads are not supported by the backend');
};

export const fetchFile = (fileKey, token) =>
  withRequest(`fetchFile:${fileKey}`, (cancelToken) =>
    api.get('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { fileKey },
      cancelToken,
    })
  );

export const deleteFile = (fileKey, token) =>
  withRequest(`deleteFile:${fileKey}`, (cancelToken) =>
    api.delete('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      data: { fileKey },
      cancelToken,
    })
  );