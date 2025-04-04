import api from "./apiClient";
import { handleApiError } from "./apiClient";

const API_BASE = "/api/v1/messages";

// Універсальна функція для обробки відповідей
const processResponse = (response) => response.data?.content || response.data;

// Відправка повідомлення
export const sendMessage = async (messageData, token) => {
  if (!messageData) throw new Error("Message data is required");
  try {
    const response = await api.post(`${API_BASE}/`, messageData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Отримання повідомлень
export const fetchMessages = async (token, { withUserId, groupId, offset = 0, limit = 20, signal } = {}) => {
  try {
    const response = await api.get(`${API_BASE}/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { withUserId, groupId, offset, limit },
      signal,
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Отримання групових чатів
export const fetchGroupChats = async (token) => {
  try {
    const response = await api.get(`${API_BASE}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Завантаження початкових даних
export const loadInitialMessagesData = async (token, friends) => {
  if (!token || !friends?.length) return { messages: [], groupChats: [] };
  const controller = new AbortController();
  try {
    const [groupChats, allMessages] = await Promise.all([
      fetchGroupChats(token),
      Promise.all([
        ...friends.map((friend) =>
          fetchMessages(token, { withUserId: friend.anonymous_id, signal: controller.signal })
        ),
        ...(await fetchGroupChats(token)).map((group) =>
          fetchMessages(token, { groupId: group.group_id, signal: controller.signal })
        ),
      ]),
    ]);
    return { messages: allMessages.flat(), groupChats };
  } catch (err) {
    if (err.name !== "AbortError") throw err;
    return { messages: [], groupChats: [] };
  } finally {
    controller.abort();
  }
};

// Позначення повідомлення як прочитане
export const markMessageAsRead = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.put(`${API_BASE}/${messageId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Видалення повідомлення
export const deleteMessage = async (messageId, token) => {
  if (!messageId) throw new Error("Message ID is required");
  try {
    const response = await api.delete(`${API_BASE}/${messageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Завантаження файлу
export const uploadFile = async (file, token) => {
  if (!file) throw new Error("File is required");
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`${API_BASE}/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return processResponse(response)?.url;
  } catch (err) {
    return handleApiError(err);
  }
};

// Створення групового чату
export const createGroupChat = async (name, members, token) => {
  if (!name || !members?.length) throw new Error("Group name and members are required");
  try {
    const response = await api.post(`${API_BASE}/group`, { name, members }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Видалення групового чату
export const deleteGroupChat = async (groupId, token) => {
  if (!groupId) throw new Error("Group ID is required");
  try {
    const response = await api.delete(`${API_BASE}/group/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Видалення розмови
export const deleteConversation = async (conversationId, token) => {
  if (!conversationId) throw new Error("Conversation ID is required");
  try {
    const response = await api.delete(`${API_BASE}/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Редагування повідомлення
export const editMessage = async (messageId, newContent, token) => {
  if (!messageId || !newContent) throw new Error("Message ID and new content are required");
  try {
    const response = await api.patch(`${API_BASE}/edit`, { messageId, newContent }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};

// Пошук повідомлень
export const searchMessages = async (query, token) => {
  if (!query) throw new Error("Search query is required");
  try {
    const response = await api.get(`${API_BASE}/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { query },
    });
    return processResponse(response);
  } catch (err) {
    return handleApiError(err);
  }
};