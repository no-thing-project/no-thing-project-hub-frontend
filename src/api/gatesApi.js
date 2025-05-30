import { get, post, put, del, handleApiError } from './apiClient';

// Базовий шлях API
const BASE_GATE_PATH = '/api/v1/gates';

export const fetchGates = async (token, filters = {}, signal) => {
  if (!token) throw new Error('Token is required');
  try {
    const response = await get(BASE_GATE_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal: signal instanceof AbortSignal ? signal : undefined, // Validate signal
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchGateById = async (gateId, token, signal) => {
  if (!gateId || !token) throw new Error('Gate ID and token are required');
  try {
    const response = await get(`${BASE_GATE_PATH}/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createGate = async (gateData, token) => {
  if (!gateData || !token) throw new Error('Gate data and token are required');
  try {
    const response = await post(BASE_GATE_PATH, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateGate = async (gateId, gateData, token) => {
  if (!gateId || !gateData || !token) throw new Error('Gate ID, data, and token are required');
  try {
    const response = await put(`${BASE_GATE_PATH}/${gateId}`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateGateStatus = async (gateId, statusData, token) => {
  if (!gateId || !statusData || !token) throw new Error('Gate ID, status data, and token are required');
  try {
    const response = await put(`${BASE_GATE_PATH}/${gateId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error('Gate ID and token are required');
  try {
    const response = await del(`${BASE_GATE_PATH}/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const addGateMember = async (gateId, memberData, token) => {
  if (!gateId || !memberData || !token) throw new Error('Gate ID, member data, and token are required');
  try {
    const response = await post(`${BASE_GATE_PATH}/${gateId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const removeGateMember = async (gateId, username, token) => {
  if (!gateId || !username || !token) throw new Error('Gate ID, username, and token are required');
  try {
    const response = await del(`${BASE_GATE_PATH}/${gateId}/members/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateGateMember = async (gateId, username, data, token) => {
  if (!gateId || !username || !data || !token) throw new Error('Gate ID, username, data, and token are required');
  try {
    const response = await put(`${BASE_GATE_PATH}/${gateId}/members/${encodeURIComponent(username)}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchGateMembers = async (gateId, token, signal) => {
  if (!gateId || !token) throw new Error('Gate ID and token are required');
  try {
    const response = await get(`${BASE_GATE_PATH}/${gateId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const favoriteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error('Gate ID and token are required');
  try {
    const response = await post(`${BASE_GATE_PATH}/${gateId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const unfavoriteGate = async (gateId, token) => {
  if (!gateId || !token) throw new Error('Gate ID and token are required');
  try {
    const response = await post(`${BASE_GATE_PATH}/${gateId}/unfavorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    throw handleApiError(error);
  }
};