import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Оптимізована функція для кешування помилок
const cachedErrors = new Map();

/**
 * Fetch all gates with pagination and filtering
 * @param {string} token - Authentication token
 * @param {Object} filters - Query filters (visibility, status, page, limit, sort)
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<{ gates: Array, pagination: Object }>} - Gates and pagination data
 * @example
 * fetchGates('token', { visibility: 'public', page: 1, limit: 10 }, abortSignal)
 */
export const fetchGates = async (token, filters = {}, signal) => {
  const queryKey = JSON.stringify(filters);
  if (cachedErrors.has(queryKey)) throw cachedErrors.get(queryKey);

  try {
    const response = await api.get(`/api/v1/gates`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { ...filters, page: filters.page || 1, limit: filters.limit || 20 },
      signal,
    });
    return response.data?.content || { gates: [], pagination: {} };
  } catch (err) {
    const error = handleApiError(err);
    cachedErrors.set(queryKey, error);
    throw error;
  }
};

/**
 * Fetch gate by ID
 * @param {string} gateId - Gate UUID
 * @param {string} token - Authentication token
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<Object>} - Gate details
 * @example
 * fetchGateById('550e8400-e29b-41d4-a716-446655440000', 'token')
 */
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

/**
 * Create a new gate
 * @param {Object} gateData - Gate data (name, description, visibility, etc.)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created gate details
 * @example
 * createGate({
 *   name: 'Community Hub',
 *   visibility: 'public',
 *   is_public: true,
 *   settings: { max_classes: 50 }
 * }, 'token')
 */
export const createGate = async (gateData, token) => {
  if (!gateData?.name) throw new Error("Gate name is required");
  try {
    const response = await api.post(`/api/v1/gates`, {
      name: gateData.name,
      description: gateData.description || '',
      visibility: gateData.visibility || 'public',
      is_public: gateData.is_public ?? false,
      type: gateData.type || 'community',
      min_access_level: gateData.min_access_level || 0,
      settings: { ...gateData.settings, tweet_cost: gateData.settings?.tweet_cost || 1 },
      tags: gateData.tags || [],
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Update an existing gate
 * @param {string} gateId - Gate UUID
 * @param {Object} gateData - Updated gate data
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated gate details
 */
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

/**
 * Add member to gate
 * @param {string} gateId - Gate UUID
 * @param {Object} memberData - Member data (anonymousId, role)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated gate details
 * @example
 * addGateMember('gate-id', { anonymousId: 'user-id', role: 'member' }, 'token')
 */
export const addGateMember = async (gateId, memberData, token) => {
  if (!gateId || !memberData?.anonymousId) throw new Error("Gate ID and member anonymousId are required");
  try {
    const response = await api.post(`/api/v1/gates/${gateId}/members`, {
      anonymousId: memberData.anonymousId,
      role: memberData.role || 'member',
    }, {
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

/**
 * Like a gate
 * @param {string} gateId - Gate UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated gate details
 */
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