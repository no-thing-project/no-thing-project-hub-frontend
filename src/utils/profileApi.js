import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch profile (special case for own profile)
export const fetchProfile = async (userId, currentUser, token) => {
  try {
    if (!currentUser) {
      throw new Error("Current user is not authenticated");
    }
    const ownUserId = currentUser.anonymous_id;
    if (!ownUserId) {
      throw new Error("Current user ID is undefined");
    }

    if (!userId || userId === ownUserId) {
      return { authData: currentUser, isOwnProfile: true };
    } else {
      const response = await api.get(`/api/v1/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { authData: response.data.authData, isOwnProfile: false };
    }
  } catch (err) {
    throw new Error(err.message || "Failed to fetch profile");
  }
};

// Fetch profile by ID
export const fetchProfileById = async (anonymousId, token) => {
  try {
    const response = await api.get(`/api/v1/profile/${anonymousId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

// Update profile
export const updateProfile = async (profileData, token) => {
  try {
    const response = await api.put(`/api/v1/profile/update`, profileData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete profile
export const deleteProfile = async (token) => {
  try {
    const response = await api.delete(`/api/v1/profile/delete`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch points history
export const fetchPointsHistory = async (token) => {
  try {
    const response = await api.get(`/api/v1/profile/points/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.history || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};