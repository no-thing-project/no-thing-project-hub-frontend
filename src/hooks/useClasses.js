import { useState, useCallback } from "react";
import {
  fetchClasses,
  fetchClassesByGateId,
  fetchClassById,
  createClass,
  createClassInGate,
  updateClass,
  updateClassStatus,
  deleteClass,
  fetchClassMembers,
} from "../api/classesApi";

export const useClasses = (token, onLogout, navigate) => {
  const [classes, setClasses] = useState([]);
  const [classData, setClassData] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [gateInfo, setGateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred.");
    },
    [onLogout, navigate]
  );

  const fetchClassesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError("Authentication required.");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClasses(token, filters, signal);
        setClasses(data.classes);
        setPagination(data.pagination);
        return data.classes;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchClassesByGate = useCallback(
    async (gateId, filters = {}, signal) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClassesByGateId(gateId, token, filters, signal);
        setClasses(data.classes);
        setGateInfo(data.gate);
        setPagination(data.pagination);
        return data.classes;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchClass = useCallback(
    async (classId, signal) => {
      if (!token || !classId) {
        setError("Authentication or class ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchClassById(classId, token, signal);
        setClassData(data);
        return data;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewClass = useCallback(
    async (classData) => {
      if (!token || !classData) {
        setError("Authentication or class data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newClass = await createClass(classData, token);
        setClasses((prev) => [...prev, newClass]);
        return newClass;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewClassInGate = useCallback(
    async (gateId, classData) => {
      if (!token || !gateId || !classData) {
        setError("Authentication, gate ID, or class data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newClass = await createClassInGate(gateId, classData, token);
        setClasses((prev) => [...prev, newClass]);
        return newClass;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateExistingClass = useCallback(
    async (classId, classData) => {
      if (!token || !classId || !classData) {
        setError("Authentication, class ID, or data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedClass = await updateClass(classId, classData, token);
        setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
        setClassData(updatedClass);
        return updatedClass;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateClassStatusById = useCallback(
    async (gateId, classId, statusData) => {
      if (!token || !gateId || !classId || !statusData) {
        setError("Authentication, gate ID, class ID, or status data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedClass = await updateClassStatus(gateId, classId, statusData, token);
        setClasses((prev) => prev.map((c) => (c.class_id === classId ? updatedClass : c)));
        setClassData(updatedClass);
        return updatedClass;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingClass = useCallback(
    async (classId) => {
      if (!token || !classId) {
        setError("Authentication or class ID missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteClass(classId, token);
        setClasses((prev) => prev.filter((c) => c.class_id !== classId));
        setClassData(null);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchClassMembersList = useCallback(
    async (classId) => {
      if (!token || !classId) {
        setError("Authentication or class ID missing.");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const membersData = await fetchClassMembers(classId, token);
        setMembers(membersData);
        return membersData;
      } catch (err) {
        handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    classes,
    classData,
    members,
    pagination,
    gateInfo,
    loading,
    error,
    fetchClassesList,
    fetchClassesByGate,
    fetchClass,
    createNewClass,
    createNewClassInGate,
    updateExistingClass,
    updateClassStatusById,
    deleteExistingClass,
    fetchClassMembersList,
  };
};

export default useClasses;