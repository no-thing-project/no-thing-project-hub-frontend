// src/hooks/useClasses.js
import { useState, useCallback } from "react";
import {
  fetchClasses,
  fetchClassesByGate,
  fetchClassById,
  createClassInGate,
  updateClass,
  updateClassStatus,
  deleteClass,
  fetchClassMembers,
} from "../utils/classesApi";

/**
 * Custom hook for managing classes-related operations.
 * @param {string} token - Authentication token
 * @param {() => void} onLogout - Callback to handle logout on auth errors
 * @param {import("react-router-dom").NavigateFunction} navigate - Navigation function for redirects
 * @returns {Object} - Classes state and operations
 */
export const useClasses = (token, onLogout, navigate) => {
  const [classes, setClasses] = useState([]);
  const [classData, setClassData] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle authentication errors (401/403)
  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch all classes (not tied to a specific gate)
  const fetchAllClasses = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClasses(token, signal);
        setClasses(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching all classes:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch classes by gate
  const fetchClassesByGateId = useCallback(
    async (gate_id, signal) => {
      if (!gate_id) {
        setError("Gate ID is required to fetch classes");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClassesByGate(gate_id, token, signal);
        setClasses(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching classes by gate:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch a single class by ID
  const fetchClass = useCallback(
    async (class_id, signal) => {
      if (!class_id) {
        setError("Class ID is required to fetch class");
        throw new Error("Class ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClassById(class_id, token, signal);
        if (!data) {
          throw new Error("Class not found");
        }
        setClassData(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching class:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Create a new class in a gate
  const createNewClass = useCallback(
    async (gate_id, classData) => {
      if (!gate_id) {
        setError("Gate ID is required to create a class");
        throw new Error("Gate ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const newClass = await createClassInGate(gate_id, classData, token);
        if (!newClass) {
          throw new Error("Failed to create class");
        }
        setClasses((prev) => [...prev, newClass]);
        return newClass;
      } catch (err) {
        console.error("Error creating class:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Update an existing class
  const updateExistingClass = useCallback(
    async (class_id, classData) => {
      if (!class_id) {
        setError("Class ID is required to update class");
        throw new Error("Class ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedClass = await updateClass(class_id, classData, token);
        if (!updatedClass) {
          throw new Error("Failed to update class");
        }
        setClasses((prev) =>
          prev.map((c) => (c._id === class_id ? updatedClass : c))
        );
        setClassData(updatedClass);
        return updatedClass;
      } catch (err) {
        console.error("Error updating class:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Update class status
  const updateClassStatusById = useCallback(
    async (gate_id, class_id, statusData) => {
      if (!gate_id || !class_id) {
        setError("Gate ID and Class ID are required to update class status");
        throw new Error("Gate ID and Class ID are required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedClass = await updateClassStatus(gate_id, class_id, statusData, token);
        if (!updatedClass) {
          throw new Error("Failed to update class status");
        }
        setClasses((prev) =>
          prev.map((c) => (c._id === class_id ? updatedClass : c))
        );
        setClassData(updatedClass);
        return updatedClass;
      } catch (err) {
        console.error("Error updating class status:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Delete an existing class
  const deleteExistingClass = useCallback(
    async (class_id) => {
      if (!class_id) {
        setError("Class ID is required to delete class");
        throw new Error("Class ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        await deleteClass(class_id, token);
        setClasses((prev) => prev.filter((c) => c._id !== class_id));
        setClassData(null);
      } catch (err) {
        console.error("Error deleting class:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Fetch class members
  const fetchMembersForClass = useCallback(
    async (class_id) => {
      if (!class_id) {
        setError("Class ID is required to fetch members");
        throw new Error("Class ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedMembers = await fetchClassMembers(class_id, token);
        setMembers(fetchedMembers);
        return fetchedMembers;
      } catch (err) {
        console.error("Error fetching class members:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    classes, // List of all classes
    classData, // Single class data
    members, // List of members for a class
    loading,
    error,
    fetchAllClasses, // Fetch all classes
    fetchClassesByGateId, // Fetch classes by gate
    fetchClass, // Fetch a single class
    createNewClass, // Create a new class
    updateExistingClass, // Update a class
    updateClassStatus: updateClassStatusById, // Update class status
    deleteExistingClass, // Delete a class
    fetchMembersForClass, // Fetch members of a class
  };
};