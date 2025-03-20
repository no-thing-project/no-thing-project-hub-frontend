// src/api/boardsApi.js
import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch all boards
export const fetchBoards = async (token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content?.boards || [];
  } catch (err) {
    handleApiError(err);
    throw err; // Throw the error so useBoards can handle 401/403
  }
};

// Fetch boards by gate
export const fetchBoardsByGate = async (gate_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards/gates/${gate_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content?.boards || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch boards by class
export const fetchBoardsByClass = async (class_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards/classes/${class_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content?.boards || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch a board by ID (standalone)
export const fetchBoardById = async (board_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch a board by ID within a gate
export const fetchBoardByIdGate = async (board_id, gate_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards/gates/${gate_id}/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch a board by ID within a class
export const fetchBoardByIdClass = async (board_id, class_id, token, signal) => {
  try {
    const response = await api.get(`/api/v1/boards/classes/${class_id}/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Create a board (standalone)
export const createBoard = async (boardData, token) => {
  try {
    const response = await api.post(`/api/v1/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Create a board in a gate
export const createBoardInGate = async (gate_id, boardData, token) => {
  try {
    const response = await api.post(`/api/v1/boards/gates/${gate_id}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Create a board in a class
export const createBoardInClass = async (class_id, boardData, token) => {
  try {
    const response = await api.post(`/api/v1/boards/classes/${class_id}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a board (standalone)
export const updateBoard = async (board_id, boardData, token) => {
  try {
    const response = await api.put(`/api/v1/boards/${board_id}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a board within a gate
export const updateBoardGate = async (gate_id, board_id, boardData, token) => {
  try {
    const response = await api.put(`/api/v1/boards/gates/${gate_id}/${board_id}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a board within a class
export const updateBoardClass = async (class_id, board_id, boardData, token) => {
  try {
    const response = await api.put(`/api/v1/boards/classes/${class_id}/${board_id}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update board status within a gate
export const updateBoardStatusGate = async (gate_id, board_id, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/boards/gates/${gate_id}/${board_id}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update board status within a class
export const updateBoardStatusClass = async (class_id, board_id, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/boards/classes/${class_id}/${board_id}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a board (standalone)
export const deleteBoard = async (board_id, token) => {
  try {
    const response = await api.delete(`/api/v1/boards/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a board within a gate
export const deleteBoardGate = async (gate_id, board_id, token) => {
  try {
    const response = await api.delete(`/api/v1/boards/gates/${gate_id}/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a board within a class
export const deleteBoardClass = async (class_id, board_id, token) => {
  try {
    const response = await api.delete(`/api/v1/boards/classes/${class_id}/${board_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Like a board
export const likeBoard = async (board_id, token) => {
  try {
    const response = await api.post(`/api/v1/boards/${board_id}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Unlike a board
export const unlikeBoard = async (board_id, token) => {
  try {
    const response = await api.post(`/api/v1/boards/${board_id}/unlike`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Fetch board members
export const fetchBoardMembers = async (board_id, token) => {
  try {
    const response = await api.get(`/api/v1/boards/${board_id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};