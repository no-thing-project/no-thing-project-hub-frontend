import { useState, useCallback, useEffect } from "react";
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
} from "../api/gatesApi";

export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred.");
      return null;
    },
    [onLogout, navigate]
  );

  const resetState = useCallback(() => {
    setGates([]);
    setGate(null);
    setMembers([]);
    setPagination({});
    setError(null);
  }, []);

  const fetchGatesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError("Authentication required.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGates(token, filters, signal);
        setGates(data.gates || []);
        setPagination(data.pagination || {});
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchGate = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGateById(gateId, token, signal);
        setGate(data || null);
        return data;
      } catch (err) {
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewGate = useCallback(
    async (gateData) => {
      if (!token || !gateData) {
        setError("Authentication or gate data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newGate = await createGate(gateData, token);
        setGates((prev) => [...prev, newGate]);
        return newGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateExistingGate = useCallback(
    async (gateId, gateData) => {
      if (!token || !gateId || !gateData) {
        setError("Authentication, gate ID, or data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await updateGate(gateId, gateData, token);
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateGateStatusById = useCallback(
    async (gateId, statusData) => {
      if (!token || !gateId || !statusData) {
        setError("Authentication, gate ID, or status data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await updateGateStatus(gateId, statusData, token);
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingGate = useCallback(
    async (gateId) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteGate(gateId, token);
        setGates((prev) => prev.filter((g) => g.gate_id !== gateId));
        setGate(null);
        return true;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const addMemberToGate = useCallback(
    async (gateId, memberData) => {
      if (!token || !gateId || !memberData) {
        setError("Authentication, gate ID, or member data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await addGateMember(gateId, memberData, token);
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const removeMemberFromGate = useCallback(
    async (gateId, memberId) => {
      if (!token || !gateId || !memberId) {
        setError("Authentication, gate ID, or member ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await removeGateMember(gateId, memberId, token);
        setGate(updatedGate);
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchGateMembersList = useCallback(
    async (gateId) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const membersData = await fetchGateMembers(gateId, token);
        setMembers(membersData || []);
        return membersData;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const likeGateById = useCallback(
    async (gateId) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await likeGate(gateId, token);
        setGate(updatedGate);
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const unlikeGateById = useCallback(
    async (gateId) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = await unlikeGate(gateId, token);
        setGate(updatedGate);
        setGates((prev) => prev.map((g) => (g.gate_id === gateId ? updatedGate : g)));
        return updatedGate;
      } catch (err) {
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  useEffect(() => {
    if (!token) {
      resetState();
    }
  }, [token, resetState]);

  return {
    gates,
    setGates,
    gate,
    members,
    pagination,
    loading,
    error,
    fetchGatesList,
    fetchGate,
    createNewGate,
    updateExistingGate,
    updateGateStatusById,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    fetchGateMembersList,
    likeGateById,
    unlikeGateById,
  };
};

export default useGates;