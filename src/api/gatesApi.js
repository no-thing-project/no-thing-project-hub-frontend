import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Базовий шлях API
const BASE_GATE_PATH = "/api/v1/gates";

/**
 * Отримання списку гейтів
 * @param {string} token - Токен авторизації
 * @param {object} [filters={}] - Фільтри для запиту
 * @param {AbortSignal} [signal] - Сигнал для скасування запиту
 * @returns {Promise<object>} Дані гейтів
 * @throws {Error} У разі помилки API
 */
export const fetchGates = async (token, filters = {}, signal) => {
  if (!token) throw new Error("Token is required");
  try {
    const response = await api.get(BASE_GATE_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Отримання даних одного гейта за ID
 * @param {string} gateId - ID гейта
 * @param {string} token - Токен авторизації
 * @param {AbortSignal} [signal] - Сигнал для скасування запиту
 * @returns {Promise<object>} Дані гейта
 * @throws {Error} У разі помилки API
 */
export const fetchGateById = async (gateId, token, signal) => {
  if (!gateId || !token) throw new Error("Gate ID and token are required");
  try {
    const response = await api.get(`${BASE_GATE_PATH}/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Створення нового гейта
 * @param {object} gateData - Дані гейта
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Створений гейт
 * @throws {Error} У разі помилки API
 */
export const createGate = async (gateData, token) => {
  if (!gateData || !token) throw new Error("Gate data and token are required");
  try {
    const response = await api.post(BASE_GATE_PATH, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Оновлення гейта
 * @param {string} gateId - ID гейта
 * @param {object} gateData - Дані для оновлення
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const updateGate = async (gateId, gateData, token) => {
  if (!gateId || !gateData || !token) throw new Error("Gate ID, data, and token are required");
  try {
    const response = await api.put(`${BASE_GATE_PATH}/${gateId}`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Оновлення статусу гейта
 * @param {string} gateId - ID гейта
 * @param {object} statusData - Дані статусу
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const updateGateStatus = async (gateId, statusData, token) => {
  if (!gateId || !statusData || !token) throw new Error("Gate ID, status data, and token are required");
  try {
    const response = await api.put(`${BASE_GATE_PATH}/${gateId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Видалення гейта
 * @param {string} gateId - ID гейта
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Дані видаленого гейта
 * @throws {Error} У разі помилки API
 */
export const deleteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error("Gate ID and token are required");
  try {
    const response = await api.delete(`${BASE_GATE_PATH}/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Додавання члена до гейта
 * @param {string} gateId - ID гейта
 * @param {object} memberData - Дані члена { username, role }
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const addGateMember = async (gateId, memberData, token) => {
  if (!gateId || !memberData || !token) throw new Error("Gate ID, member data, and token are required");
  try {
    const response = await api.post(`${BASE_GATE_PATH}/${gateId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Видалення члена з гейта
 * @param {string} gateId - ID гейта
 * @param {string} username - Ім'я користувача
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const removeGateMember = async (gateId, username, token) => {
  if (!gateId || !username || !token) throw new Error("Gate ID, username, and token are required");
  try {
    const response = await api.delete(`${BASE_GATE_PATH}/${gateId}/members/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Оновлення ролі члена гейта
 * @param {string} gateId - ID гейта
 * @param {string} username - Ім'я користувача
 * @param {object} data - Дані для оновлення { role }
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const updateGateMember = async (gateId, username, data, token) => {
  if (!gateId || !username || !data || !token) throw new Error("Gate ID, username, data, and token are required");
  try {
    const response = await api.put(`${BASE_GATE_PATH}/${gateId}/members/${encodeURIComponent(username)}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Отримання списку членів гейта
 * @param {string} gateId - ID гейта
 * @param {string} token - Токен авторизації
 * @param {AbortSignal} [signal] - Сигнал для скасування запиту
 * @returns {Promise<object>} Дані членів
 * @throws {Error} У разі помилки API
 */
export const fetchGateMembers = async (gateId, token, signal) => {
  if (!gateId || !token) throw new Error("Gate ID and token are required");
  try {
    const response = await api.get(`${BASE_GATE_PATH}/${gateId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Додавання гейта до улюблених
 * @param {string} gateId - ID гейта
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const favoriteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error("Gate ID and token are required");
  try {
    const response = await api.post(`${BASE_GATE_PATH}/${gateId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Видалення гейта з улюблених
 * @param {string} gateId - ID гейта
 * @param {string} token - Токен авторизації
 * @returns {Promise<object>} Оновлений гейт
 * @throws {Error} У разі помилки API
 */
export const unfavoriteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error("Gate ID and token are required");
  try {
    const response = await api.post(`${BASE_GATE_PATH}/${gateId}/unfavorite`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};