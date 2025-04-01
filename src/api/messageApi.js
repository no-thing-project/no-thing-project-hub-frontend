import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const sendMessage = async (messageData, token) => {
  if (!messageData) throw new Error("Message data is required");
  try {
    const response = await api.post("api/v1/messages", messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchMessages = async (token, { withUserId, groupId, conversationId, limit = 20, offset = 0 }, signal) => {
  try {
    const params = { limit, offset };
    if (withUserId) params.withUserId = withUserId;
    if (groupId) params.groupId = groupId;
    if (conversationId) params.conversationId = conversationId;
    const response = await api.get("api/v1/messages", {
      headers: { Authorization: `Bearer ${token}` },
      params,
      signal,
    });
    return response.data.content || [];
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchMessageById = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.get(`api/v1/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const markMessageAsRead = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.put(`api/v1/messages/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateMessage = async (messageId, content, token) => {
  if (!messageId || !content) throw new Error("Message ID and content are required");
  try {
    const response = await api.put(`api/v1/messages/${messageId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteMessage = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.delete(`api/v1/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const uploadFile = async (file, token) => {
  if (!file) throw new Error("File is required");
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await api.post("api/v1/messages/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchMessageReactions = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.get(`api/v1/messages/${messageId}/reactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || [];
  } catch (err) {
    throw handleApiError(err);
  }
};

export const addMessageReaction = async (messageId, reaction, token) => {
  if (!messageId || !reaction) throw new Error("Message ID and reaction are required");
  try {
    const response = await api.post(`api/v1/messages/${messageId}/reactions`, { reaction }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};