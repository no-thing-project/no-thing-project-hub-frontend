// src/hooks/useGates.js
import { useState, useCallback } from "react";
import {
  fetchGates,
  fetchGateById,
  createGate,
  updateGate,
  updateGateStatus,
  deleteGate,
  addGateMember,
  removeGateMember,
  fetchGateMembers,
  likeGate,
  unlikeGate,
} from "../utils/gatesApi";

/**
 * Custom hook for managing gates-related operations.
 * @param {string} token - Authentication token
 * @param {() => void} [onLogout] - Optional callback to handle logout on auth errors
 * @param {import("react-router-dom").NavigateFunction} [navigate] - Optional navigation function for redirects
 * @returns {Object} - Gates state and operations
 */
export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle authentication errors (401/403)
  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (onLogout && navigate) {
          onLogout("Session expired. Please log in again.");
          navigate("/login");
        }
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch all gates
  const fetchGatesList = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGates(token, signal);
        setGates(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching gates:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch a single gate by ID
  const fetchGate = useCallback(
    async (gate_id, signal) => {
      if (!gate_id) {
        setError("Gate ID is required to fetch gate");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGateById(gate_id, token, signal);
        if (!data) {
          throw new Error("Gate not found");
        }
        setGate(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching gate:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Create a new gate
  const createNewGate = useCallback(
    async (gateData) => {
      setLoading(true);
      setError(null);
      try {
        const newGate = await createGate(gateData, token);
        if (!newGate) {
          throw new Error("Failed to create gate");
        }
        setGates((prev) => [...prev, newGate]);
        return newGate;
      } catch (err) {
        console.error("Error creating gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Update an existing gate
  const updateExistingGate = useCallback(
    async (gate_id, gateData) => {
      if (!gate_id) {
        setError("Gate ID is required to update gate");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await updateGate(gate_id, gateData, token);
        if (!updatedGate) {
          throw new Error("Failed to update gate");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        console.error("Error updating gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Update gate status
  const updateGateStatusById = useCallback(
    async (gate_id, statusData) => {
      if (!gate_id) {
        setError("Gate ID is required to update gate status");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await updateGateStatus(gate_id, statusData, token);
        if (!updatedGate) {
          throw new Error("Failed to update gate status");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        console.error("Error updating gate status:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Delete a gate
  const deleteExistingGate = useCallback(
    async (gate_id) => {
      if (!gate_id) {
        setError("Gate ID is required to delete gate");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        await deleteGate(gate_id, token);
        setGates((prev) => prev.filter((g) => g._id !== gate_id));
        setGate(null);
      } catch (err) {
        console.error("Error deleting gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Add a member to a gate
  const addMemberToGate = useCallback(
    async (gate_id, memberData) => {
      if (!gate_id) {
        setError("Gate ID is required to add member");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await addGateMember(gate_id, memberData, token);
        if (!updatedGate) {
          throw new Error("Failed to add member to gate");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        setMembers((prev) => [...prev, memberData]);
        return updatedGate;
      } catch (err) {
        console.error("Error adding member to gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Remove a member from a gate
  const removeMemberFromGate = useCallback(
    async (gate_id, memberId) => {
      if (!gate_id || !memberId) {
        setError("Gate ID and Member ID are required to remove member");
        throw new Error("Gate ID and Member ID are required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await removeGateMember(gate_id, memberId, token);
        if (!updatedGate) {
          throw new Error("Failed to remove member from gate");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
        return updatedGate;
      } catch (err) {
        console.error("Error removing member from gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch gate members
  const fetchMembersForGate = useCallback(
    async (gate_id) => {
      if (!gate_id) {
        setError("Gate ID is required to fetch members");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedMembers = await fetchGateMembers(gate_id, token);
        setMembers(fetchedMembers);
        return fetchedMembers;
      } catch (err) {
        console.error("Error fetching gate members:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Like a gate
  const likeGateById = useCallback(
    async (gate_id) => {
      if (!gate_id) {
        setError("Gate ID is required to like gate");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await likeGate(gate_id, token);
        if (!updatedGate) {
          throw new Error("Failed to like gate");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        console.error("Error liking gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Unlike a gate
  const unlikeGateById = useCallback(
    async (gate_id) => {
      if (!gate_id) {
        setError("Gate ID is required to unlike gate");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await unlikeGate(gate_id, token);
        if (!updatedGate) {
          throw new Error("Failed to unlike gate");
        }
        setGates((prev) =>
          prev.map((g) => (g._id === gate_id ? updatedGate : g))
        );
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        console.error("Error unliking gate:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    gates, // List of all gates
    gate, // Single gate data
    members, // List of members for a gate
    loading,
    error,
    fetchGatesList, // Fetch all gates
    fetchGate, // Fetch a single gate by ID
    createNewGate, // Create a new gate
    updateExistingGate, // Update a gate
    updateGateStatus: updateGateStatusById, // Update gate status
    deleteExistingGate, // Delete a gate
    addMemberToGate, // Add a member to a gate
    removeMemberFromGate, // Remove a member from a gate
    fetchMembersForGate, // Fetch members of a gate
    likeGate: likeGateById, // Like a gate
    unlikeGate: unlikeGateById, // Unlike a gate
  };
};