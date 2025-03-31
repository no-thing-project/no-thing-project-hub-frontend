import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const createConversation = async (recipientId, token) => {
  if (!recipientId) throw new Error("Recipient ID is required");
  try {
    const response = await api.post("/api/v1/conversations", { recipientId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchConversations = async (token, signal) => {
  try {
    const response = await api.get("/api/v1/conversations", {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const data = response.data?.content || [];
    console.log("[fetchConversations] Fetched:", data.length, "conversations");
    return data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateConversation = async (conversationId, { settings, is_pinned, tags }, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.put(`/api/v1/conversations/${conversationId}`, { settings, is_pinned, tags }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteConversation = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.delete(`/api/v1/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};