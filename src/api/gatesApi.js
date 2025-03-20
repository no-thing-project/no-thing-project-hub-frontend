import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const fetchGates = async (token, filters = {}, signal) => {
  try {
    const response = await api.get(`/api/v1/gates`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { gates: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchGateById = async (gateId, token, signal) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.get(`/api/v1/gates/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createGate = async (gateData, token) => {
  if (!gateData) throw new Error("Gate data is required");
  try {
    const response = await api.post(`/api/v1/gates`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateGate = async (gateId, gateData, token) => {
  if (!gateId || !gateData) throw new Error("Gate ID and data are required");
  try {
    const response = await api.put(`/api/v1/gates/${gateId}`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateGateStatus = async (gateId, statusData, token) => {
  if (!gateId || !statusData) throw new Error("Gate ID and status data are required");
  try {
    const response = await api.put(`/api/v1/gates/${gateId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteGate = async (gateId, token) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.delete(`/api/v1/gates/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const addGateMember = async (gateId, memberData, token) => {
  if (!gateId || !memberData) throw new Error("Gate ID and member data are required");
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const removeGateMember = async (gateId, memberId, token) => {
  if (!gateId || !memberId) throw new Error("Gate ID and member ID are required");
  try {
    const response = await api.delete(`/api/v1/gates/${gateId}/members/${memberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchGateMembers = async (gateId, token) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.get(`/api/v1/gates/${gateId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    return handleApiError(err);
  }
};

export const likeGate = async (gateId, token) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const unlikeGate = async (gateId, token) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/unlike`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};