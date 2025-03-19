// src/hooks/useClasses.js
import { useState, useCallback } from "react";
import {
  fetchClasses,
  fetchClassById,
  createClass,
  createClassInGate,
  updateClass,
  deleteClass,
} from "../utils/apiPages";

export const useClasses = (token) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClasses(token);
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchClass = useCallback(async (class_id, gate_id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClassById(class_id, gate_id, token);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createNewClass = useCallback(async (classData, gate_id) => {
    setLoading(true);
    setError(null);
    try {
      const newClass = gate_id
        ? await createClassInGate(gate_id, classData, token)
        : await createClass(classData, token);
      setClasses((prev) => [...prev, newClass]);
      return newClass;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateExistingClass = useCallback(async (gate_id, class_id, classData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedClass = await updateClass(gate_id, class_id, classData, token);
      setClasses((prev) =>
        prev.map((c) => (c.class_id === class_id ? updatedClass : c))
      );
      return updatedClass;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteExistingClass = useCallback(async (gate_id, class_id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteClass(gate_id, class_id, token);
      setClasses((prev) => prev.filter((c) => c.class_id !== class_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete class");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    classes,
    loading,
    error,
    fetchAllClasses,
    fetchClass,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
  };
};