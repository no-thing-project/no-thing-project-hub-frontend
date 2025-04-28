import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const fetchGates = async (token, filters = {}, signal) => {
  try {
    const response = await api.get("/api/v1/gates", {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const fetchGateById = async (gateId, token, signal) => {
  try {
    const response = await api.get(`/api/v1/gates/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const createGate = async (gateData, token) => {
  try {
    const response = await api.post("/api/v1/gates/", gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateGate = async (gateId, gateData, token) => {
  try {
    const response = await api.put(`/api/v1/gates/${gateId}`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateGateStatus = async (gateId, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/gates/${gateId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteGate = async (gateId, token) => {
  try {
    const response = await api.delete(`/api/v1/gates/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const addGateMember = async (gateId, memberData, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const removeGateMember = async (gateId, memberId, token) => {
  try {
    const response = await api.delete(`/api/v1/gates/${gateId}/members/${memberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateGateMember = async (gateId, memberId, data, token) => {
  try {
    const response = await api.put(`/api/v1/gates/${gateId}/members/${memberId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const fetchGateMembers = async (gateId, token, signal) => {
  try {
    const response = await api.get(`/api/v1/gates/${gateId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const favoriteGate = async (gateId, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};

export const unfavoriteGate = async (gateId, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/unfavorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (error) {
    handleApiError(error);
  }
};