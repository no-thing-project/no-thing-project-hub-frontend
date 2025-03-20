import axios from "axios";
import config from "../config";
import { handleApiError } from "./apiClient";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000, // Optional: Add a timeout to prevent hanging requests
});

// Gates
// Fetch all gates
  export const fetchGates = async (token, signal) => {
    try {
      const response = await api.get(`/api/v1/gates`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      return response.data?.content?.gates || [];
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };

  // Fetch a gate by ID
  export const fetchGateById = async (gate_id, token, signal) => {
    try {
      const response = await api.get(`/api/v1/gates/${gate_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const createGate = async (gateData, token) => {
    try {
      const response = await api.post(`/api/v1/gates`, gateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const updateGate = async (gate_id, gateData, token) => {
    try {
      const response = await api.put(`/api/v1/gates/${gate_id}`, gateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const updateGateStatus = async (gate_id, statusData, token) => {
    try {
      const response = await api.put(`/api/v1/gates/${gate_id}/status`, statusData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const deleteGate = async (gate_id, token) => {
    try {
      const response = await api.delete(`/api/v1/gates/${gate_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const addGateMember = async (gate_id, memberData, token) => {
    try {
      const response = await api.post(`/api/v1/gates/${gate_id}/members`, memberData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const removeGateMember = async (gate_id, memberId, token) => {
    try {
      const response = await api.delete(`/api/v1/gates/${gate_id}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const fetchGateMembers = async (gate_id, token) => {
    try {
      const response = await api.get(`/api/v1/gates/${gate_id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content?.members || [];
    } catch (err) {
      handleApiError(err);
      return [];
    }
  };
  
  export const likeGate = async (gate_id, token) => {
    try {
      const response = await api.post(`/api/v1/gates/${gate_id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  
  export const unlikeGate = async (gate_id, token) => {
    try {
      const response = await api.post(`/api/v1/gates/${gate_id}/unlike`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.content || null;
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };
  