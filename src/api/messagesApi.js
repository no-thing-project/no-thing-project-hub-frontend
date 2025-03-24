// src/api/messagesApi.js
import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const sendMessage = async (messageData, token) => {
  if (!messageData) throw new Error("Message data is required");
  try {
    const response = await api.post(`/api/v1/messages`, messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchMessages = async (token, filters = {}, signal) => { // Додано signal
  try {
    const response = await api.get(`/api/v1/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters, // withUserId, limit, offset
      signal, // Передаємо signal для скасування запиту
    });
    return response.data?.content || [];
  } catch (err) {
    return handleApiError(err);
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
    return handleApiError(err);
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
    return handleApiError(err);
  }
};