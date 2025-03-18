import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
});

export const fetchProfile = async (userId, currentUser, token) => {
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
};

export const fetchGates = async (token) => {
  const response = await api.get("/api/v1/gates", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.content.gates || [];
};

export const fetchClasses = async (gateId, token) => {
  const response = await api.get(`/api/v1/classes/${gateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.content.classes || [];
};

export const fetchBoardClasses = async (gateId, classId, token) => {
  const response = await api.get(`/api/v1/classes/${gateId}/${classId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data?.content || null;
};

export default api;