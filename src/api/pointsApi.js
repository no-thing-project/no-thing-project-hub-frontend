import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch user's points data
export const fetchPoints = async (token, signal) => {
  try {
    const response = await api.get(`/api/v1/points`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Transfer points to another user
export const transferPoints = async (recipientId, amount, token) => {
  if (!recipientId || !amount) throw new Error("Recipient ID and amount are required");
  try {
    const response = await api.post(
      `/api/v1/points/transfer`,
      { recipientId, amount },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Fetch top contributors
export const fetchTopContributors = async (token, limit = 10, signal) => {
  try {
    const response = await api.get(`/api/v1/points/top`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit },
      signal,
    });
    return response.data.content || [];
  } catch (err) {
    return handleApiError(err);
  }
};

// Update points (admin only)
export const updatePoints = async (targetUserId, amount, reason, token) => {
  if (!targetUserId || !amount || !reason) throw new Error("Target user ID, amount, and reason are required");
  try {
    const response = await api.put(
      `/api/v1/points/update`,
      { targetUserId, amount, reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};