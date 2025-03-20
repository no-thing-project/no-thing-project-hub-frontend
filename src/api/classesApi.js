import api from "./apiClient";
import { handleApiError } from "./apiClient";

export const fetchClasses = async (token, filters = {}, signal) => {
  try {
    const response = await api.get(`/api/v1/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { classes: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchClassesByGateId = async (gateId, token, filters = {}, signal) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.get(`/api/v1/classes/${gateId}/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { classes: [], gate: null, pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchClassById = async (classId, token, signal) => {
  if (!classId) throw new Error("Class ID is required");
  try {
    const response = await api.get(`/api/v1/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createClass = async (classData, token) => {
  if (!classData) throw new Error("Class data is required");
  try {
    const response = await api.post(`/api/v1/classes`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createClassInGate = async (gateId, classData, token) => {
  if (!gateId || !classData) throw new Error("Gate ID and class data are required");
  try {
    const response = await api.post(`/api/v1/classes/${gateId}/`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateClass = async (classId, classData, token) => {
  if (!classId || !classData) throw new Error("Class ID and data are required");
  try {
    const response = await api.put(`/api/v1/classes/${classId}`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateClassStatus = async (gateId, classId, statusData, token) => {
  if (!gateId || !classId || !statusData) throw new Error("Gate ID, class ID, and status data are required");
  try {
    const response = await api.put(`/api/v1/classes/${gateId}/${classId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteClass = async (classId, token) => {
  if (!classId) throw new Error("Class ID is required");
  try {
    const response = await api.delete(`/api/v1/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchClassMembers = async (classId, token) => {
  if (!classId) throw new Error("Class ID is required");
  try {
    const response = await api.get(`/api/v1/classes/${classId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    return handleApiError(err);
  }
};