// src/utils/api.js
import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000, // Optional: Add a timeout to prevent hanging requests
});

// Generic error handler
export const handleApiError = (err, setError) => {
  const errorMessage = err.response?.data?.errors?.[0] || err.message || "An error occurred";
  if (setError) setError(errorMessage);
  return Promise.reject(errorMessage); // Allow error propagation if needed
};

export const fetchProfile = async (userId, currentUser, token) => {
  try {
  const ownUserId = currentUser.anonymous_id;
  if (!ownUserId) throw new Error("Current user ID is undefined");

  if (!userId || userId === ownUserId) {
    return { authData: currentUser, isOwnProfile: true };
  } else {
    const url = `/api/v1/profile/${userId}`;
    const response = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { authData: response.data.authData, isOwnProfile: false };
  }
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Fetch gates for the authenticated user
export const fetchGates = async (token) => {
  try {
    const response = await api.get("/api/v1/gates", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content.gates || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Fetch classes for a specific gate
export const fetchClasses = async (gateId, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content.classes || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Fetch board classes for a specific gate and class
export const fetchBoardClasses = async (gateId, classId, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${gateId}/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

// Normalize user data (optional, included for consistency with other utilities)
export const normalizeUserData = (user) => ({
  anonymous_id: user?.anonymous_id || "",
  username: user?.username || "",
  fullName: user?.fullName || "",
  bio: user?.bio || "",
  email: user?.email || "",
  phone: user?.phone || "",
  wallet_address: user?.wallet_address || "",
  profile_picture: user?.profile_picture || "",
  isPublic: user?.isPublic || false,
  social_links: user?.social_links || {},
  timezone: user?.timezone || "",
  gender: user?.gender || "",
  location: user?.location || "",
  ethnicity: user?.ethnicity || "",
  dateOfBirth: user?.dateOfBirth || null,
  nameVisibility: user?.nameVisibility || "Hide",
  preferences: user?.preferences || {
    notifications: { email: true, push: false },
    theme: "Light",
    contentLanguage: "English",
  },
  onlineStatus: user?.onlineStatus || "offline",
  language: user?.language || "",
  access_level: user?.access_level || 0,
});

export default api;