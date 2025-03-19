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
    return [];
  }
};

// Fetch classes by gate
export const fetchClassesByGate = async (gateId, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.classes || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Fetch a class by ID
export const fetchClassById = async (classId, gateId, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${gateId}/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

// Create a class
// export const createClass = async (classData, token) => {
//   try {
//     const response = await api.post(`/api/v1/classes`, classData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// Create a class in a gate
export const createClassInGate = async (gateId, classData, token) => {
  try {
    const response = await api.post(`/api/v1/classes/${gateId}/`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a class
export const updateClass = async (gateId, classId, classData, token) => {
  try {
    const response = await api.put(`/api/v1/classes/${gateId}/${classId}`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update class status
export const updateClassStatus = async (gateId, classId, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/classes/${gateId}/${classId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a class
export const deleteClass = async (gateId, classId, token) => {
  try {
    const response = await api.delete(`/api/v1/classes/${gateId}/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch class members
export const fetchClassMembers = async (classId, token) => {
  try {
    const response = await api.get(`/api/v1/classes/${classId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};