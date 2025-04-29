import api from "./apiClient";
import { handleApiError } from "./apiClient";

const BASE_CLASS_PATH = "/api/v1/classes";

const ERROR_MESSAGES = {
  TOKEN_REQUIRED: "Token is required",
  CLASS_ID_REQUIRED: "Class ID is required",
  GATE_ID_REQUIRED: "Gate ID is required",
  USERNAME_REQUIRED: "Username is required",
  ROLE_REQUIRED: "Role is required",
  DATA_REQUIRED: "Data is required",
  STATUS_REQUIRED: "Status is required",
  INVALID_RESPONSE: "Invalid response from server",
};

/**
 * Validate that a parameter is a non-empty string
 * @param {string} param - Parameter to validate
 * @param {string} paramName - Name of the parameter for error message
 * @throws {Error} If parameter is invalid
 */
const validateStringParam = (param, paramName) => {
  if (!param || typeof param !== "string") {
    throw new Error(ERROR_MESSAGES[`${paramName.toUpperCase()}_REQUIRED`]);
  }
};

/**
 * Validate that an object is non-null and not empty
 * @param {object} obj - Object to validate
 * @param {string} paramName - Name of the parameter for error message
 * @throws {Error} If object is invalid
 */
const validateObjectParam = (obj, paramName) => {
  if (!obj || typeof obj !== "object" || Object.keys(obj).length === 0) {
    throw new Error(ERROR_MESSAGES[`${paramName.toUpperCase()}_REQUIRED`]);
  }
};

/**
 * Fetch list of classes
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Classes data
 */
export const fetchClasses = async (token, filters = {}, signal) => {
  validateStringParam(token, "token");
  try {
    const response = await api.get(BASE_CLASS_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content || { classes: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch classes by gate ID
 * @param {string} gateId - Gate ID
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Classes data
 */
export const fetchClassesByGateId = async (gateId, token, filters = {}, signal) => {
  validateStringParam(gateId, "gateId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_CLASS_PATH}/gate/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content || { classes: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch a single class by ID
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Class data
 */
export const fetchClassById = async (classId, token, signal) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_CLASS_PATH}/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new class
 * @param {object} classData - Class data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created class data
 */
export const createClass = async (classData, token) => {
  validateStringParam(token, "token");
  validateObjectParam(classData, "data");
  try {
    const response = await api.post(BASE_CLASS_PATH, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new class in a specific gate
 * @param {string} gateId - Gate ID
 * @param {object} classData - Class data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created class data
 */
export const createClassInGate = async (gateId, classData, token) => {
  validateStringParam(gateId, "gateId");
  validateStringParam(token, "token");
  validateObjectParam(classData, "data");
  try {
    const response = await api.post(`${BASE_CLASS_PATH}/gate/${gateId}`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a class
 * @param {string} classId - Class ID
 * @param {object} classData - Updated class data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const updateClass = async (classId, classData, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  validateObjectParam(classData, "data");
  try {
    const response = await api.put(`${BASE_CLASS_PATH}/${classId}`, classData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update class status
 * @param {string} classId - Class ID
 * @param {object} statusData - New status data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const updateClassStatus = async (classId, statusData, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  validateObjectParam(statusData, "status");
  try {
    const response = await api.put(`${BASE_CLASS_PATH}/${classId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a class
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Deleted class data
 */
export const deleteClass = async (classId, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.delete(`${BASE_CLASS_PATH}/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add a member to a class
 * @param {string} classId - Class ID
 * @param {object} memberData - Member data (username, role)
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const addClassMember = async (classId, memberData, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  validateObjectParam(memberData, "data");
  validateStringParam(memberData.username, "username");
  try {
    const response = await api.post(`${BASE_CLASS_PATH}/${classId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove a member from a class
 * @param {string} classId - Class ID
 * @param {string} username - Username of member to remove
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const removeClassMember = async (classId, username, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(username, "username");
  validateStringParam(token, "token");
  try {
    const response = await api.delete(`${BASE_CLASS_PATH}/${classId}/members/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a member's role in a class
 * @param {string} classId - Class ID
 * @param {string} username - Username of member
 * @param {object} roleData - New role data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const updateClassMember = async (classId, username, roleData, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(username, "username");
  validateStringParam(token, "token");
  validateObjectParam(roleData, "role");
  try {
    const response = await api.put(`${BASE_CLASS_PATH}/${classId}/members/${username}`, roleData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Favorite a class
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const favoriteClass = async (classId, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.post(`${BASE_CLASS_PATH}/${classId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Unfavorite a class
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated class data
 */
export const unfavoriteClass = async (classId, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.post(`${BASE_CLASS_PATH}/${classId}/unfavorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch class members
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Members data
 */
export const fetchClassMembers = async (classId, token, signal) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_CLASS_PATH}/${classId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || { members: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};