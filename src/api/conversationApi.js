import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const createConversation = async (recipientId, token) => {
  if (!recipientId) throw new Error("Recipient ID is required");
  try {
    const response = await api.post(
      "api/v1/conversations",
      { recipientId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchConversations = async (token, signal) => {
  try {
    const response = await api.get("api/v1/conversations", {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || [];
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchConversationById = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.get(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateConversation = async (conversationId, updates, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.put(
      `api/v1/conversations/${conversationId}`,
      updates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteConversation = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.delete(`api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const archiveConversation = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.put(
      `api/v1/conversations/${conversationId}/archive`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const searchConversations = async (query, token) => {
  if (!query) throw new Error("Search query is required");
  try {
    const response = await api.get("api/v1/conversations/search", {
      params: { query },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || [];
  } catch (err) {
    throw handleApiError(err);
  }
};