import api from "./apiClient";
import { handleApiError } from "./apiClient";

/**
 * Fetch all boards accessible to the user.
 * @param {string} token - Authentication token
 * @param {Object} filters - Query filters (e.g., visibility, page, limit, sort)
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<Object>} - Boards and pagination data
 */
export const fetchBoards = async (token, filters = {}, signal) => {
  try {
    const response = await api.get(`/api/v1/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { boards: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Fetch boards by gate ID.
 * @param {string} gateId - Gate UUID
 * @param {string} token - Authentication token
 * @param {Object} filters - Query filters
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<Object>} - Boards, gate info, and pagination
 */
export const fetchBoardsByGateId = async (gateId, token, filters = {}, signal) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.get(`/api/v1/boards/gates/${gateId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { boards: [], gate: null, pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Fetch boards by class ID.
 * @param {string} classId - Class UUID
 * @param {string} token - Authentication token
 * @param {Object} filters - Query filters
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<Object>} - Boards, class info, and pagination
 */
export const fetchBoardsByClassId = async (classId, token, filters = {}, signal) => {
  if (!classId) throw new Error("Class ID is required");
  try {
    const response = await api.get(`/api/v1/boards/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { boards: [], class: null, pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Fetch a specific board by ID, optionally within a gate or class context.
 * @param {string} boardId - Board UUID
 * @param {string} gateId - Gate UUID (optional)
 * @param {string} classId - Class UUID (optional)
 * @param {string} token - Authentication token
 * @param {AbortSignal} signal - Signal for request cancellation
 * @returns {Promise<Object>} - Board details
 */
export const fetchBoardById = async (boardId, gateId, classId, token, signal) => {
  if (!boardId) throw new Error("Board ID is required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/gates/${gateId}/boards/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Create a new board.
 * @param {Object} boardData - Board data (name, description, visibility, is_public, type, etc.)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created board details
 */
export const createBoard = async (boardData, token) => {
  if (!boardData) throw new Error("Board data is required");
  try {
    const response = await api.post(`/api/v1/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Create a new board within a gate.
 * @param {string} gateId - Gate UUID
 * @param {Object} boardData - Board data
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created board details
 */
export const createBoardInGate = async (gateId, boardData, token) => {
  if (!gateId || !boardData) throw new Error("Gate ID and board data are required");
  try {
    const response = await api.post(`/api/v1/boards/gates/${gateId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Create a new board within a class.
 * @param {string} classId - Class UUID
 * @param {Object} boardData - Board data
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Created board details
 */
export const createBoardInClass = async (classId, boardData, token) => {
  if (!classId || !boardData) throw new Error("Class ID and board data are required");
  try {
    const response = await api.post(`/api/v1/boards/classes/${classId}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Update an existing board.
 * @param {string} boardId - Board UUID
 * @param {string} gateId - Gate UUID (optional)
 * @param {string} classId - Class UUID (optional)
 * @param {Object} boardData - Updated board data
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const updateBoard = async (boardId, gateId, classId, boardData, token) => {
  if (!boardId || !boardData) throw new Error("Board ID and data are required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/gates/${gateId}/boards/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.put(url, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Delete a board.
 * @param {string} boardId - Board UUID
 * @param {string} gateId - Gate UUID (optional)
 * @param {string} classId - Class UUID (optional)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Deleted board info
 */
export const deleteBoard = async (boardId, gateId, classId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/gates/${gateId}/boards/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Fetch members of a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} - List of board members
 */
export const fetchBoardMembers = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.get(`/api/v1/boards/${boardId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Fetch stats for a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Board statistics
 */
export const fetchBoardStats = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.get(`/api/v1/boards/${boardId}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Like a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const likeBoard = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Unlike a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const unlikeBoard = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/unlike`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Add a member to a board.
 * @param {string} boardId - Board UUID
 * @param {Object} memberData - Member data (anonymous_id, role)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const addMember = async (boardId, memberData, token) => {
  if (!boardId || !memberData) throw new Error("Board ID and member data are required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Remove a member from a board.
 * @param {string} boardId - Board UUID
 * @param {Object} memberData - Member data (anonymous_id)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const removeMember = async (boardId, memberData, token) => {
  if (!boardId || !memberData) throw new Error("Board ID and member data are required");
  try {
    const response = await api.delete(`/api/v1/boards/${boardId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      data: memberData,
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Invite a user to a board.
 * @param {string} boardId - Board UUID
 * @param {Object} inviteData - Invite data (anonymous_id)
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const inviteUser = async (boardId, inviteData, token) => {
  if (!boardId || !inviteData) throw new Error("Board ID and invite data are required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/invite`, inviteData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Accept an invitation to a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const acceptInvite = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/accept-invite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};

/**
 * Run AI moderation on a board.
 * @param {string} boardId - Board UUID
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Updated board details
 */
export const runAIModeration = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/ai-moderation`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || {};
  } catch (err) {
    return handleApiError(err);
  }
};