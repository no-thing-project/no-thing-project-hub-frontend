import axios from 'axios';
import api from './apiClient';
import { handleApiError } from './apiClient';

// Cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request cancellation support
const abortControllers = new Map();

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

  let controller = null;
  try {
    controller = new AbortController();
    if (abortControllers.has(key)) {
      abortControllers.get(key).abort('Request cancelled due to new request');
    }
    abortControllers.set(key, controller);
  } catch (err) {
    console.error(`Failed to create AbortController for key: ${key}`, err);
  }

  try {
    console.log(`[messagesApi] Initiating request: ${key}`);
    const response = await fn(controller ? controller.signal : undefined);
    const data = response.data?.content || response.data;
    if (useCache) {
      cache.set(key, { data, timestamp: Date.now() });
    }
    console.log(`[messagesApi] Request completed: ${key}`);
    return data;
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log(`[messagesApi] Request cancelled: ${key}`);
      return null;
    }
    console.error(`[messagesApi] Request error: ${key}`, err);
    throw handleApiError(err);
  } finally {
    if (controller) {
      abortControllers.delete(key);
    }
  }
};

// Conversations
export const createConversation = (data, token) =>
  withRequest(`createConversation:${data.friendId || data.name}`, (signal) =>
    api.post('api/v1/conversations/', data, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const fetchConversations = ({ page = 1, limit = 20, cursor } = {}, token) =>
  withRequest(`fetchConversations:${page}:${cursor}`, (signal) =>
    api.get('api/v1/conversations/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, cursor },
      signal,
    })
  );

export const fetchConversation = (conversationId, token) =>
  withRequest(`fetchConversation:${conversationId}`, (signal) =>
    api.get(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const updateConversation = (conversationId, data, token) =>
  withRequest(`updateConversation:${conversationId}`, (signal) =>
    api.patch(`api/v1/conversations/${conversationId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const updateChatSettings = (conversationId, data, token) =>
  withRequest(`updateChatSettings:${conversationId}`, (signal) =>
    api.patch(`api/v1/conversations/${conversationId}/settings`, data, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const updateEphemeralSettings = (conversationId, data, token) =>
  withRequest(`updateEphemeralSettings:${conversationId}`, (signal) =>
    api.patch(`api/v1/conversations/${conversationId}/ephemeral`, data, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const addMembers = (conversationId, members, token) =>
  withRequest(`addMembers:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/members`, { members }, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const removeMembers = (conversationId, members, token) =>
  withRequest(`removeMembers:${conversationId}`, (signal) =>
    api.delete(`api/v1/conversations/${conversationId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { members },
      signal,
    })
  );

export const joinViaInvite = (inviteLink, token) =>
  withRequest(`joinViaInvite:${inviteLink}`, (signal) =>
    api.post('api/v1/conversations/join', { inviteLink }, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const leaveConversation = (conversationId, token) =>
  withRequest(`leaveConversation:${conversationId}`, (signal) =>
    api.delete(`api/v1/conversations/${conversationId}/leave`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const rotateKeys = (conversationId, token) =>
  withRequest(`rotateKeys:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/rotate-keys`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const deleteConversation = (conversationId, token) =>
  withRequest(`deleteConversation:${conversationId}`, (signal) =>
    api.delete(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const archiveConversation = (conversationId, token) =>
  withRequest(`archiveConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/archive`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const unarchiveConversation = (conversationId, token) =>
  withRequest(`unarchiveConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/unarchive`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const muteConversation = (conversationId, data, token) =>
  withRequest(`muteConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/mute`, data, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const unmuteConversation = (conversationId, token) =>
  withRequest(`unmuteConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/unmute`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const pinConversation = (conversationId, token) =>
  withRequest(`pinConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const unpinConversation = (conversationId, token) =>
  withRequest(`unpinConversation:${conversationId}`, (signal) =>
    api.post(`api/v1/conversations/${conversationId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

// Messages
export const sendMessage = (messageData, token) =>
  withRequest(`sendMessage:${messageData.conversationId}`, (signal) =>
    api.post('api/v1/messages/', messageData, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const fetchMessages = (conversationId, { page = 1, limit = 20, cursor } = {}, token) =>
  withRequest(`fetchMessages:${conversationId}:${page}:${cursor}`, (signal) =>
    api.get(`api/v1/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, cursor },
      signal,
    })
  );

export const sendTyping = (conversationId, token) =>
  withRequest(`sendTyping:${conversationId}`, (signal) =>
    api.post(`api/v1/messages/${conversationId}/typing`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const getReadReceipts = (messageId, token) =>
  withRequest(`getReadReceipts:${messageId}`, (signal) =>
    api.get(`api/v1/messages/${messageId}/receipts`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const createPoll = (pollData, token) =>
  withRequest(`createPoll:${pollData.conversationId}`, (signal) =>
    api.post('api/v1/messages/poll', pollData, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const votePoll = (messageId, optionIndex, token) =>
  withRequest(`votePoll:${messageId}`, (signal) =>
    api.post(`api/v1/messages/${messageId}/vote`, { optionIndex }, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const addReaction = (messageId, reaction, token) =>
  withRequest(`addReaction:${messageId}`, (signal) =>
    api.post(`api/v1/messages/${messageId}/react`, { reaction }, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const markMessageAsRead = (messageId, token) =>
  withRequest(`markMessageAsRead:${messageId}`, (signal) =>
    api.put(`api/v1/messages/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const deleteMessage = (messageId, token) =>
  withRequest(`deleteMessage:${messageId}`, (signal) =>
    api.delete(`api/v1/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const editMessage = ({ messageId, newContent }, token) =>
  withRequest(`editMessage:${messageId}`, (signal) =>
    api.patch('api/v1/messages/edit', { messageId, newContent }, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const searchMessages = (conversationId, query, { limit = 50 } = {}, token) =>
  withRequest(`searchMessages:${conversationId}:${query}`, (signal) =>
    api.get(`api/v1/messages/${conversationId}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query, limit },
      signal,
    })
  );

export const pinMessage = (messageId, token) =>
  withRequest(`pinMessage:${messageId}`, (signal) =>
    api.post(`api/v1/messages/${messageId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const unpinMessage = (messageId, token) =>
  withRequest(`unpinMessage:${messageId}`, (signal) =>
    api.post(`api/v1/messages/${messageId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

export const listScheduledMessages = (conversationId, { page = 1, limit = 20 } = {}, token) =>
  withRequest(`listScheduledMessages:${conversationId}:${page}`, (signal) =>
    api.get('api/v1/messages/scheduled', {
      headers: { Authorization: `Bearer ${token}` },
      params: { conversationId, page, limit },
      signal,
    })
  );

export const cancelScheduledMessage = (messageId, token) =>
  withRequest(`cancelScheduledMessage:${messageId}`, (signal) =>
    api.delete(`api/v1/messages/${messageId}/scheduled`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
  );

// File Uploads
export const uploadFile = async (file, token) => {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  if (file.size <= chunkSize) {
    return withRequest(`uploadFile:${file.name}`, (signal) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('api/v1/uploads/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });
    });
  }

  // Chunked upload for large files (Note: Backend does not currently support chunked uploads)
  throw new Error('Chunked uploads are not supported by the backend');
};

export const fetchFile = (fileKey, token) =>
  withRequest(`fetchFile:${fileKey}`, (signal) =>
    api.get('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { fileKey },
      signal,
    })
  );

export const deleteFile = (fileKey, token) =>
  withRequest(`deleteFile:${fileKey}`, (signal) =>
    api.delete('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      data: { fileKey },
      signal,
    })
  );