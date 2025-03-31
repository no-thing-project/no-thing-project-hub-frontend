import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const sendMessage = async (messageData, token) => {
  if (!messageData) throw new Error("Message data is required");
  try {
    const response = await api.post("/api/v1/messages", messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchMessages = async (token, { withUserId, groupId, conversationId, offset = 0, limit = 20 }, signal) => {
  try {
    const params = { offset, limit };
    if (withUserId) params.withUserId = withUserId;
    if (groupId) params.groupId = groupId;
    if (conversationId) params.conversationId = conversationId;
    const response = await api.get("/api/v1/messages", {
      headers: { Authorization: `Bearer ${token}` },
      params,
      signal,
    });
    const data = response.data?.content || [];
    console.log("[fetchMessages] Fetched:", data.length, "messages");
    return data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const markMessageAsRead = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.put(`/api/v1/messages/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateMessage = async (messageId, content, token) => {
  if (!messageId) throw new Error("Message ID is required");
  if (!content) throw new Error("Content is required");
  try {
    const response = await api.put(`/api/v1/messages/${messageId}`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteMessage = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.delete(`/api/v1/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const uploadFile = async (file, token) => {
  if (!file) throw new Error("File is required");
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/v1/messages/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};