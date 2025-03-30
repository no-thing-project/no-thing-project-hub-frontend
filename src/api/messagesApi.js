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

export const fetchMessages = async (token, { withUserId, groupId, offset = 0, limit = 20, signal } = {}) => {
  try {
    const response = await api.get(`/api/v1/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { withUserId, groupId, offset, limit },
      signal,
    });
    const data = response.data?.content || [];
    return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchGroupChats = async (token) => {
  try {
    const response = await api.get("/api/v1/messages/group", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || [];
  } catch (err) {
    return handleApiError(err);
  }
};

export const loadInitialMessagesData = async (token, friends) => {
  if (!token || !friends.length) return { messages: [], groupChats: [] };
  const controller = new AbortController();
  try {
    console.log("Fetching group chats...");
    const fetchedGroupChats = await fetchGroupChats(token);
    console.log("Fetched group chats:", fetchedGroupChats);
    console.log("Fetching messages for friends and groups...");
    const allMessages = await Promise.all([
      ...friends.map((friend) => {
        console.log(`Fetching messages for friend: ${friend.anonymous_id}`);
        return fetchMessages(token, { withUserId: friend.anonymous_id, signal: controller.signal });
      }),
      ...fetchedGroupChats.map((group) => {
        console.log(`Fetching messages for group: ${group.group_id}`);
        return fetchMessages(token, { groupId: group.group_id, signal: controller.signal });
      }),
    ]);
    console.log("All messages fetched:", allMessages.flat());
    return { messages: allMessages.flat(), groupChats: fetchedGroupChats };
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Load initial data error:", err);
    }
    throw err;
  } finally {
    controller.abort();
  }
};

export const markMessageAsRead = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.put(
      `/api/v1/messages/${messageId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
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

export const uploadFile = async (file, token) => {
  if (!file) throw new Error("File is required");
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/api/v1/messages/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.content?.url || response.data?.url;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createGroupChat = async (name, members, token) => {
  if (!name || !members.length) throw new Error("Group name and members are required");
  try {
    const response = await api.post(
      `/api/v1/messages/group`,
      { name, members },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteGroupChat = async (groupId, token) => {
  if (!groupId) throw new Error("Group ID is required");
  try {
    const response = await api.delete(`/api/v1/messages/group/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteConversation = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.delete(`/api/v1/messages/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};