import axios, { CancelToken } from 'axios'; // Explicitly import CancelToken
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

  // Attempt to create a cancel token
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

// Messages
export const sendMessage = (messageData, token) =>
  withRequest(`sendMessage:${messageData.conversationId}`, (cancelToken) =>
    api.post('api/v1/messages/', messageData, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const fetchMessages = (conversationId, { page = 1, limit = 20 } = {}, token) =>
  withRequest(`fetchMessages:${conversationId}:${page}`, (cancelToken) =>
    api.get(`api/v1/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
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
    api.get(`api/v1/messages/search/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query, limit },
      cancelToken,
    })
  );

// Conversations
export const createConversation = (friendId, token) =>
  withRequest(`createConversation:${friendId}`, (cancelToken) =>
    api.post('api/v1/conversations/', { friendId }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const fetchConversations = ({ page = 1, limit = 20 } = {}, token) =>
  withRequest(`fetchConversations:${page}`, (cancelToken) =>
    api.get('api/v1/conversations/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
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

export const updateConversation = (conversationId, { name }, token) =>
  withRequest(`updateConversation:${conversationId}`, (cancelToken) =>
    api.patch(`api/v1/conversations/${conversationId}`, { name }, {
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

export const muteConversation = (conversationId, token) =>
  withRequest(`muteConversation:${conversationId}`, (cancelToken) =>
    api.post(`api/v1/conversations/${conversationId}/mute`, {}, {
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

export const deleteConversation = (conversationId, token) =>
  withRequest(`deleteConversation:${conversationId}`, (cancelToken) =>
    api.delete(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

// Group Chats
export const fetchGroupChats = (token) =>
  withRequest('fetchGroupChats', (cancelToken) =>
    api.get('api/v1/groups/', {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const createGroupChat = ({ name, members }, token) =>
  withRequest(`createGroupChat:${name}`, (cancelToken) =>
    api.post('api/v1/groups/', { name, members }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const updateGroupChat = (groupId, { name }, token) =>
  withRequest(`updateGroupChat:${groupId}`, (cancelToken) =>
    api.patch(`api/v1/groups/${groupId}`, { name }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const addGroupMembers = (groupId, { members }, token) =>
  withRequest(`addGroupMembers:${groupId}`, (cancelToken) =>
    api.post(`api/v1/groups/${groupId}/members`, { members }, {
      headers: { Authorization: `Bearer ${token}` },
      cancelToken,
    })
  );

export const removeGroupMembers = (groupId, { members }, token) =>
  withRequest(`removeGroupMembers:${groupId}`, (cancelToken) =>
    api.delete(`api/v1/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { members },
      cancelToken,
    })
  );

export const deleteGroupChat = (groupId, token) =>
  withRequest(`deleteGroupChat:${groupId}`, (cancelToken) =>
    api.delete(`api/v1/groups/${groupId}`, {
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

  // Chunked upload for large files
  const chunks = Math.ceil(file.size / chunkSize);
  let fileKey = null;
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', i);
    formData.append('totalChunks', chunks);
    if (fileKey) formData.append('fileKey', fileKey);

    const response = await withRequest(`uploadFileChunk:${file.name}:${i}`, (cancelToken) =>
      api.post('api/v1/uploads/chunk', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        cancelToken,
      })
    );
    fileKey = response.fileKey || fileKey;
  }
  return { url: fileKey, fileKey };
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


// // Додаткові методи для роботи з користувачем
// export const fetchUserConversations = async (token) => {
//   try {
//     const response = await api.get('api/v1/user/conversations', {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return processResponse(response);
//   } catch (err) {
//     return handleApiError(err);
//   }
// };

// export const fetchUserGroups = async (token) => {
//   try {
//     const response = await api.get('api/v1/user/groups', {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return processResponse(response);
//   } catch (err) {
//     return handleApiError(err);
//   }
// };

// export const fetchUserMessages = async (token) => {
//   try {
//     const response = await api.get('api/v1/user/messages', {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return processResponse(response);
//   } catch (err) {
//     return handleApiError(err);
//   }
// };

// export const fetchUserStats = async (token) => {
//   try {
//     const response = await api.get('api/v1/user/stats', {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return processResponse(response);
//   } catch (err) {
//     return handleApiError(err);
//   }
// };