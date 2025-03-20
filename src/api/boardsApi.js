import api from "./apiClient";
import { handleApiError } from "./apiClient";

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

export const fetchBoardsByGateId = async (gateId, token, filters = {}, signal) => {
  if (!gateId) throw new Error("Gate ID is required");
  try {
    const response = await api.get(`/api/v1/boards/${gateId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
      signal,
    });
    return response.data?.content || { boards: [], gate: null, pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

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

export const fetchBoardById = async (boardId, gateId, classId, token, signal) => {
  if (!boardId) throw new Error("Board ID is required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/${gateId}/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createBoard = async (boardData, token) => {
  if (!boardData) throw new Error("Board data is required");
  try {
    const response = await api.post(`/api/v1/boards`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createBoardInGate = async (gateId, boardData, token) => {
  if (!gateId || !boardData) throw new Error("Gate ID and board data are required");
  try {
    const response = await api.post(`/api/v1/boards/${gateId}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const createBoardInClass = async (classId, boardData, token) => {
  if (!classId || !boardData) throw new Error("Class ID and board data are required");
  try {
    const response = await api.post(`/api/v1/boards/classes/${classId}`, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateBoard = async (boardId, gateId, classId, boardData, token) => {
  if (!boardId || !boardData) throw new Error("Board ID and data are required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/${gateId}/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.put(url, boardData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const updateBoardStatus = async (boardId, gateId, classId, statusData, token) => {
  if (!boardId || !statusData) throw new Error("Board ID and status data are required");
  let url = `/api/v1/boards/${gateId}/${boardId}/status`;
  if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}/status`;
  try {
    const response = await api.put(url, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const deleteBoard = async (boardId, gateId, classId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  let url = `/api/v1/boards/${boardId}`;
  if (gateId) url = `/api/v1/boards/${gateId}/${boardId}`;
  else if (classId) url = `/api/v1/boards/classes/${classId}/${boardId}`;
  try {
    const response = await api.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

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

export const likeBoard = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const unlikeBoard = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.post(`/api/v1/boards/${boardId}/unlike`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const fetchBoardStats = async (boardId, token) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const response = await api.get(`/api/v1/boards/${boardId}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};