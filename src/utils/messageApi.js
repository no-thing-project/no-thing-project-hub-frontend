import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Send a message
export const sendMessage = async (messageData, token) => {
  try {
    const response = await api.post(`/api/v1/profile/messages/send`, messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch messages
export const fetchMessages = async (token) => {
  try {
    const response = await api.get(`/api/v1/profile/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.messages || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId, token) => {
  try {
    const response = await api.put(`/api/v1/profile/messages/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a message
export const deleteMessage = async (messageId, token) => {
  try {
    const response = await api.delete(`/api/v1/profile/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};