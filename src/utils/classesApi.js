import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch all classes
export const fetchClasses = async (token) => {
  try {
    const response = await api.get(`/api/v1/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.classes || [];
  } catch (err) {
    handleApiError(err);
    throw err; // Throw the error so useClasses can handle 401/403
  }
};

// Fetch classes by gate
export const fetchClassesByGate = async (gate_id, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${gate_id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.classes || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch a class by ID
export const fetchClassById = async (class_id, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${class_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Create a class in a gate
export const createClassInGate = async (gate_id, classData, token) => {
  try {
    const response = await api.post(`/api/v1/classes/${gate_id}/`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a class
export const updateClass = async (class_id, classData, token) => {
  try {
    const response = await api.put(`/api/v1/classes/${class_id}`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update class status
export const updateClassStatus = async (gate_id, class_id, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/classes/${gate_id}/${class_id}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a class
export const deleteClass = async (class_id, token) => {
  try {
    const response = await api.delete(`/api/v1/classes/${class_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch class members
export const fetchClassMembers = async (class_id, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${class_id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};