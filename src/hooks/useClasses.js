import { useState, useCallback } from "react";
import { createClassInGate, deleteClass, fetchClassById, fetchClasses, fetchClassesByGate, updateClass } from "../utils/classesApi";

export const useClasses = (token, onLogout, navigate) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch all classes (not tied to a specific gate)
  const fetchAllClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClasses(token);
      setClasses(data);
    } catch (err) {
      console.error("Error fetching all classes:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Fetch classes by gate
  const fetchClassesByGateId = useCallback(async (gate_id) => {
    if (!gate_id) {
      setError("Gate ID is required to fetch classes");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClassesByGate(gate_id, token);
      setClasses(data);
    } catch (err) {
      console.error("Error fetching classes by gate:", err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Fetch a single class by ID
  const fetchClass = useCallback(async (class_id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClassById( class_id, token);
      if (!data) {
        throw new Error("Class not found");
      }
      return data;
    } catch (err) {
      console.error("Error fetching class:", err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Create a new class in a gate
  const createClass = useCallback(async (gate_id, classData) => {
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
  }, [token, handleAuthError]);

  // Update an existing class
  const updateExistingClass = useCallback(async (class_id, classData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedClass = await updateClass(class_id, classData, token);
      if (!updatedClass) {
        throw new Error("Failed to update class");
      }
      setClasses((prev) =>
        prev.map((c) => (c.class_id === class_id ? updatedClass : c))
      );
      return updatedClass;
    } catch (err) {
      console.error("Error updating class:", err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Delete an existing class
  const deleteExistingClass = useCallback(async (class_id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteClass( class_id, token);
      setClasses((prev) => prev.filter((c) => c.class_id !== class_id));
    } catch (err) {
      console.error("Error deleting class:", err);
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  return {
    classes,
    loading,
    error,
    fetchAllClasses, // Fetch all classes
    fetchClasses: fetchClassesByGateId, // Fetch classes by gate
    fetchClass, // Fetch a single class
    createClass,
    updateExistingClass,
    deleteExistingClass,
  };
};