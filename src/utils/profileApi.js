// src/api/profileApi.js
import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch profile (special case for own profile)
export const fetchProfile = async (anonymous_id, currentUser, token, signal) => {
  try {
    if (!currentUser) {
      throw new Error("Current user is not authenticated");
    }
    const ownUserId = currentUser.anonymous_id;
    if (!ownUserId) {
      throw new Error("Current user ID is undefined");
    }

    if (!anonymous_id || anonymous_id === ownUserId) {
      return { authData: currentUser, isOwnProfile: true };
    } else {
      const response = await api.get(`/api/v1/profile/${anonymous_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const authData = response.data?.content || null;
      if (!authData) {
        throw new Error("Profile not found");
      }
      return { authData, isOwnProfile: false };
    }
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch profile by ID
export const fetchProfileById = async (anonymous_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/profile/${anonymous_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const profile = response.data?.content || null;
    if (!profile) {
      throw new Error("Profile not found");
    }
    return profile;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update profile
export const updateProfile = async (profileData, token, signal) => {
  try {
    const response = await api.put(`/api/v1/profile/update`, profileData, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete profile
export const deleteProfile = async (token, signal) => {
  try {
    const response = await api.delete(`/api/v1/profile/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch points history
export const fetchPointsHistory = async (token, signal) => {
  try {
    const response = await api.get(`/api/v1/profile/points/history`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content?.history || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Send message
export const sendMessage = async (recipientId, content, token, signal) => {
  try {
    const response = await api.post(
      `/api/v1/profile/messages/send`,
      { recipientId, content },
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }
    );
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Get messages
export const getMessages = async (withUserId, limit = 50, offset = 0, token, signal) => {
  try {
    const response = await api.get(`/api/v1/profile/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { withUserId, limit, offset },
      signal,
    });
    return response.data?.content || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Mark message as read
export const markMessageAsRead = async (messageId, token, signal) => {
  try {
    const response = await api.put(
      `/api/v1/profile/messages/${messageId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      }
    );
    return response.data?.content || true;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete message
export const deleteMessage = async (messageId, token, signal) => {
  try {
    const response = await api.delete(`/api/v1/profile/messages/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || true;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};