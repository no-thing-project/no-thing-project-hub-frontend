import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const createGroupChat = async (name, members, token) => {
  if (!name || !members.length) throw new Error("Group name and members are required");
  try {
    const response = await api.post("/api/v1/groups", { name, members }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchGroupChats = async (token, signal) => {
  try {
    const response = await api.get("/api/v1/groups", {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const data = response.data?.content || [];
    console.log("[fetchGroupChats] Fetched:", data.length, "group chats");
    return data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateGroupChat = async (groupId, { name, members, settings, is_pinned, tags }, token) => {
  if (!groupId) throw new Error("Group ID is required");
  try {
    const response = await api.put(`/api/v1/groups/${groupId}`, { name, members, settings, is_pinned, tags }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteGroupChat = async (groupId, token) => {
  if (!groupId) throw new Error("Group ID is required");
  try {
    const response = await api.delete(`/api/v1/groups/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};