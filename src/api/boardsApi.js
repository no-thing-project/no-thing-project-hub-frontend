// api/boardsApi.js
import api from "./apiClient";
import { handleApiError } from "./apiClient";

const BASE_BOARD_PATH = "/api/v1/boards";

const ERROR_MESSAGES = {
  TOKEN_REQUIRED: "Token is required",
  BOARD_ID_REQUIRED: "Board ID is required",
  GATE_ID_REQUIRED: "Gate ID is required",
  CLASS_ID_REQUIRED: "Class ID is required",
  PARENT_BOARD_ID_REQUIRED: "Parent board ID is required",
  USERNAME_REQUIRED: "Username is required",
  ROLE_REQUIRED: "Role is required",
  DATA_REQUIRED: "Board data is required",
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
 * Fetch list of boards
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Boards data
 */
export const fetchBoards = async (token, filters = {}, signal) => {
  validateStringParam(token, "token");
  try {
    const response = await api.get(BASE_BOARD_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content || { boards: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch boards by gate ID
 * @param {string} gateId - Gate UUID
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Boards data
 */
export const fetchBoardsByGateId = async (gateId, token, filters = {}, signal) => {
  validateStringParam(gateId, "gateId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_BOARD_PATH}/gates/${gateId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content || { boards: [], gate: null, pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch boards by class ID
 * @param {string} classId - Class UUID
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Boards data
 */
export const fetchBoardsByClassId = async (classId, token, filters = {}, signal) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_BOARD_PATH}/classes/${classId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data.content || { boards: [], class: null, pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch a single board by ID
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Board data
 */
export const fetchBoardById = async (boardId, token, signal) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_BOARD_PATH}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoard = async (boardData, token) => {
  validateStringParam(token, "token");
  validateObjectParam(boardData, "data");
  try {
    const response = await api.post(BASE_BOARD_PATH, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in a gate
 * @param {string} gateId - Gate UUID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInGate = async (gateId, boardData, token) => {
  validateStringParam(gateId, "gateId");
  validateStringParam(token, "token");
  validateObjectParam(boardData, "data");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/gates/${gateId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in a class
 * @param {string} classId - Class UUID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInClass = async (classId, boardData, token) => {
  validateStringParam(classId, "classId");
  validateStringParam(token, "token");
  validateObjectParam(boardData, "data");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/classes/${classId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in another board
 * @param {string} parentBoardId - Parent board UUID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInBoard = async (parentBoardId, boardData, token) => {
  validateStringParam(parentBoardId, "parentBoardId");
  validateStringParam(token, "token");
  validateObjectParam(boardData, "data");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/boards/${parentBoardId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a board
 * @param {string} boardId - Board UUID
 * @param {object} boardData - Updated board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateBoard = async (boardId, boardData, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  validateObjectParam(boardData, "data");
  try {
    const response = await api.put(`${BASE_BOARD_PATH}/${boardId}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update board status
 * @param {string} boardId - Board UUID
 * @param {object} statusData - New status data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateBoardStatus = async (boardId, statusData, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  validateObjectParam(statusData, "status");
  try {
    const response = await api.put(`${BASE_BOARD_PATH}/${boardId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a board
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Deleted board data
 */
export const deleteBoard = async (boardId, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.delete(`${BASE_BOARD_PATH}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add a member to a board
 * @param {string} boardId - Board UUID
 * @param {object} memberData - Member data (username, role)
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const addMember = async (boardId, memberData, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  validateObjectParam(memberData, "data");
  validateStringParam(memberData.username, "username");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/${boardId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove a member from a board
 * @param {string} boardId - Board UUID
 * @param {string} username - Username of member to remove
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const removeMember = async (boardId, username, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(username, "username");
  validateStringParam(token, "token");
  try {
    const response = await api.delete(`${BASE_BOARD_PATH}/${boardId}/members/${username}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a member's role in a board
 * @param {string} boardId - Board UUID
 * @param {string} username - Username of member
 * @param {object} roleData - New role data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateMember = async (boardId, username, roleData, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(username, "username");
  validateStringParam(token, "token");
  validateObjectParam(roleData, "role");
  try {
    const response = await api.put(`${BASE_BOARD_PATH}/${boardId}/members/${username}`, roleData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Favorite a board
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const favoriteBoard = async (boardId, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/${boardId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Unfavorite a board
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const unfavoriteBoard = async (boardId, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.delete(`${BASE_BOARD_PATH}/${boardId}/favorite`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch board members
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Members data
 */
export const fetchBoardMembers = async (boardId, token, signal) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.get(`${BASE_BOARD_PATH}/${boardId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || { members: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Invite a user to a board
 * @param {string} boardId - Board UUID
 * @param {object} inviteData - Invite data (username)
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const inviteUser = async (boardId, inviteData, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  validateObjectParam(inviteData, "data");
  validateStringParam(inviteData.username, "username");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/${boardId}/invite`, inviteData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Accept an invitation to a board
 * @param {string} boardId - Board UUID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const acceptInvite = async (boardId, token) => {
  validateStringParam(boardId, "boardId");
  validateStringParam(token, "token");
  try {
    const response = await api.post(`${BASE_BOARD_PATH}/${boardId}/accept-invite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};