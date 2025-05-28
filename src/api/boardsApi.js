import { get, post, put, del, handleApiError } from './apiClient';

const BASE_BOARD_PATH = '/api/v1/boards';

const ERROR_MESSAGES = {
  TOKEN_REQUIRED: 'Token is required',
  BOARD_ID_REQUIRED: 'Board ID is required',
  GATE_ID_REQUIRED: 'Gate ID is required',
  CLASS_ID_REQUIRED: 'Class ID is required',
  PARENT_BOARD_ID_REQUIRED: 'Parent board ID is required',
  USERNAME_REQUIRED: 'Username is required',
  DATA_REQUIRED: 'Board data is required',
  STATUS_REQUIRED: 'Status is required',
};

/**
 * Validate that a parameter is a non-empty string
 * @param {string} param - Parameter to validate
 * @param {string} paramName - Name of the parameter for error message
 * @throws {Error} If parameter is invalid
 */
const validateStringParam = (param, paramName) => {
  if (!param || typeof param !== 'string' || !param.trim()) {
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
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
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
  validateStringParam(token, 'token');
  try {
    const response = await get(BASE_BOARD_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { boards: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch boards by gate ID
 * @param {string} gateId - Gate ID
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Boards data
 */
export const fetchBoardsByGateId = async (gateId, token, filters = {}, signal) => {
  validateStringParam(gateId, 'gateId');
  validateStringParam(token, 'token');
  try {
    const response = await get(`${BASE_BOARD_PATH}/gates/${gateId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { boards: [], gate: null, pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch boards by class ID
 * @param {string} classId - Class ID
 * @param {string} token - Authorization token
 * @param {object} [filters={}] - Query filters
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Boards data
 */
export const fetchBoardsByClassId = async (classId, token, filters = {}, signal) => {
  validateStringParam(classId, 'classId');
  validateStringParam(token, 'token');
  try {
    const response = await get(`${BASE_BOARD_PATH}/classes/${classId}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { boards: [], class: null, pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch a single board by ID
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Board data
 */
export const fetchBoardById = async (boardId, token, signal) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(token, 'token');
  try {
    const response = await get(`${BASE_BOARD_PATH}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
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
  validateObjectParam(boardData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await post(BASE_BOARD_PATH, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in a gate
 * @param {string} gateId - Gate ID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInGate = async (gateId, boardData, token) => {
  validateStringParam(gateId, 'gateId');
  validateObjectParam(boardData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/gates/${gateId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in a class
 * @param {string} classId - Class ID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInClass = async (classId, boardData, token) => {
  validateStringParam(classId, 'classId');
  validateObjectParam(boardData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/classes/${classId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new board in another board
 * @param {string} parentBoardId - Parent board ID
 * @param {object} boardData - Board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created board data
 */
export const createBoardInBoard = async (parentBoardId, boardData, token) => {
  validateStringParam(parentBoardId, 'parentBoardId');
  validateObjectParam(boardData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/boards/${parentBoardId}/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a board
 * @param {string} boardId - Board ID
 * @param {object} boardData - Updated board data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateBoard = async (boardId, boardData, token) => {
  validateStringParam(boardId, 'boardId');
  validateObjectParam(boardData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await put(`${BASE_BOARD_PATH}/${boardId}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update board status
 * @param {string} boardId - Board ID
 * @param {object} statusData - New status data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateBoardStatus = async (boardId, statusData, token) => {
  validateStringParam(boardId, 'boardId');
  validateObjectParam(statusData, 'status');
  validateStringParam(token, 'token');
  try {
    const response = await put(`${BASE_BOARD_PATH}/${boardId}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a board
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Deleted board data
 */
export const deleteBoard = async (boardId, token) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(token, 'token');
  try {
    const response = await del(`${BASE_BOARD_PATH}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add a member to a board
 * @param {string} boardId - Board ID
 * @param {object} memberData - Member data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const addMember = async (boardId, memberData, token) => {
  validateStringParam(boardId, 'boardId');
  validateObjectParam(memberData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/${boardId}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove a member from a board
 * @param {string} boardId - Board ID
 * @param {string} username - Username of member to remove
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const removeMember = async (boardId, username, token) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(username, 'username');
  validateStringParam(token, 'token');
  try {
    const response = await del(`${BASE_BOARD_PATH}/${boardId}/members/${encodeURIComponent(username)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update a member's role in a board
 * @param {string} boardId - Board ID
 * @param {string} username - Username of member
 * @param {object} roleData - New role data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const updateMember = async (boardId, username, roleData, token) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(username, 'username');
  validateObjectParam(roleData, 'data');
  validateStringParam(token, 'token');
  try {
    const response = await put(`${BASE_BOARD_PATH}/${boardId}/members/${encodeURIComponent(username)}`, roleData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Favorite a board
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const favoriteBoard = async (boardId, token) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/${boardId}/favorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Unfavorite a board
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated board data
 */
export const unfavoriteBoard = async (boardId, token) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(token, 'token');
  try {
    const response = await post(`${BASE_BOARD_PATH}/${boardId}/unfavorite`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch board members
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Members data
 */
export const fetchBoardMembers = async (boardId, token, signal) => {
  validateStringParam(boardId, 'boardId');
  validateStringParam(token, 'token');
  try {
    const response = await get(`${BASE_BOARD_PATH}/${boardId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { members: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};