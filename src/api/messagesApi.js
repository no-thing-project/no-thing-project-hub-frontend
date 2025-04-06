import api from './apiClient';
import { handleApiError } from './apiClient';

const processResponse = (response) => response.data?.content || response.data;

// Повідомлення
export const sendMessage = async (messageData, token) => {
  try {
    const response = await api.post('api/v1/messages/', messageData, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchMessages = async (conversationId, { page = 1, limit = 20 } = {}, token) => {
  try {
    const response = await api.get(`api/v1/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const markMessageAsRead = async (messageId, token) => {
  try {
    const response = await api.put(`api/v1/messages/${messageId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteMessage = async (messageId, token) => {
  try {
    const response = await api.delete(`api/v1/messages/${messageId}`, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const editMessage = async ({ messageId, newContent }, token) => {
  try {
    const response = await api.patch('api/v1/messages/edit', { messageId, newContent }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const searchMessages = async (conversationId, query, { limit = 50 } = {}, token) => {
  try {
    const response = await api.get(`api/v1/messages/search/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query, limit },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Розмови
export const createConversation = async (friendId, token) => {
  try {
    const response = await api.post('api/v1/conversations/', { friendId }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchConversations = async ({ page = 1, limit = 20 } = {}, token) => {
  try {
    const response = await api.get('api/v1/conversations/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchConversation = async (conversationId, token) => {
  try {
    const response = await api.get(`api/v1/conversations/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateConversation = async (conversationId, { name }, token) => {
  try {
    const response = await api.patch(`api/v1/conversations/${conversationId}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const archiveConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/archive`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const unarchiveConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/unarchive`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const muteConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/mute`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const unmuteConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/unmute`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const pinConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/pin`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const unpinConversation = async (conversationId, token) => {
  try {
    const response = await api.post(`api/v1/conversations/${conversationId}/unpin`, {}, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteConversation = async (conversationId, token) => {
  try {
    const response = await api.delete(`api/v1/conversations/${conversationId}`, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Групові чати
export const fetchGroupChats = async (token) => {
  try {
    const response = await api.get('api/v1/groups/', { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const createGroupChat = async ({ name, members }, token) => {
  try {
    const response = await api.post('api/v1/groups/', { name, members }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateGroupChat = async (groupId, { name }, token) => {
  try {
    const response = await api.patch(`api/v1/groups/${groupId}`, { name }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const addGroupMembers = async (groupId, { members }, token) => {
  try {
    const response = await api.post(`api/v1/groups/${groupId}/members`, { members }, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const removeGroupMembers = async (groupId, { members }, token) => {
  try {
    const response = await api.delete(`api/v1/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { members },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteGroupChat = async (groupId, token) => {
  try {
    const response = await api.delete(`api/v1/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Завантаження файлів
export const uploadFile = async (file, token) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('api/v1/uploads/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchFile = async (fileKey, token) => {
  try {
    const response = await api.get('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      params: { fileKey },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteFile = async (fileKey, token) => {
  try {
    const response = await api.delete('api/v1/uploads/', {
      headers: { Authorization: `Bearer ${token}` },
      data: { fileKey },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Додаткові методи для роботи з користувачем
export const fetchUserConversations = async (token) => {
  try {
    const response = await api.get('api/v1/user/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchUserGroups = async (token) => {
  try {
    const response = await api.get('api/v1/user/groups', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchUserMessages = async (token) => {
  try {
    const response = await api.get('api/v1/user/messages', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchUserStats = async (token) => {
  try {
    const response = await api.get('api/v1/user/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};