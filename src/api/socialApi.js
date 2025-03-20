import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Add a friend
export const addFriend = async (friendId, token) => {
  if (!friendId) throw new Error("Friend ID is required");
  try {
    const response = await api.post(
      `/api/v1/social/friends/add`,
      { friendId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Accept a friend request
export const acceptFriendRequest = async (friendId, token) => {
  if (!friendId) throw new Error("Friend ID is required");
  try {
    const response = await api.post(
      `/api/v1/social/friends/accept`,
      { friendId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Reject a friend request
export const rejectFriendRequest = async (friendId, token) => {
  if (!friendId) throw new Error("Friend ID is required");
  try {
    const response = await api.post(
      `/api/v1/social/friends/reject`,
      { friendId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Remove a friend
export const removeFriend = async (friendId, token) => {
  if (!friendId) throw new Error("Friend ID is required");
  try {
    const response = await api.post(
      `/api/v1/social/friends/remove`,
      { friendId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

// Fetch friends list
export const fetchFriends = async (token, options = { page: 1, limit: 20 }, signal) => {
  try {
    const { page, limit } = options;
    const response = await api.get(`/api/v1/social/friends`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
      signal,
    });
    return response.data.content || { friends: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

// Fetch pending friend requests
export const fetchPendingRequests = async (token, options = { page: 1, limit: 20 }, signal) => {
  try {
    const { page, limit } = options;
    const response = await api.get(`/api/v1/social/friends/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
      signal,
    });
    return response.data.content || { pendingRequests: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};