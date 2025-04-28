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
  favoriteGate,
  unfavoriteGate,
  updateGateMember,
} from "../api/gatesApi";

const gateListCache = new Map();

export const useGates = (token, onLogout, navigate) => {
  const [gates, setGates] = useState([]);
  const [gate, setGate] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
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
    setStats(null);
    setPagination({});
    setError(null);
  }, []);

  const normalizeMembers = (members) => {
    return members.map((member) => ({
      member_id: member.member_id || member.anonymous_id || member._id,
      username: member.username || member.user?.username || member.anonymous_id || "Unknown",
      role: member.role,
      joined_at: member.joined_at,
      avatar: member.avatar || member.user?.avatar || null,
      total_points: member.total_points || member.user?.total_points || 0,
      anonymous_id: member.anonymous_id || member.member_id || member._id,
    }));
  };

  const fetchGatesList = useCallback(
    async (filters = {}, signal) => {
      if (!token) {
        setError("Authentication required.");
        return null;
      }
      const cacheKey = JSON.stringify(filters);
      if (gateListCache.has(cacheKey)) {
        const cachedData = gateListCache.get(cacheKey);
        setGates(cachedData.gates || []);
        setPagination(cachedData.pagination || {});
        return cachedData;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGates(token, filters, signal);
        console.log("Fetch gates response:", data);
        setGates(data.gates || []);
        setPagination(data.pagination || {});
        gateListCache.set(cacheKey, data);
        return data;
      } catch (err) {
        console.error("Fetch gates error:", err);
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
        console.log("Fetch gate response:", data);
        setGate(data || null);
        setMembers(normalizeMembers(data.members || []));
        setStats(data.stats || null);
        return data;
      } catch (err) {
        console.error("Fetch gate error:", err);
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const createNewGate = useCallback(
    async (gateData) => {
      if (!token || !gateData?.name?.trim()) {
        setError("Authentication or gate name missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newGate = await createGate(
          {
            ...gateData,
            is_public: gateData.is_public ?? true,
            visibility: gateData.visibility || (gateData.is_public ? "public" : "private"),
            settings: {
              ...gateData.settings,
              class_creation_cost: gateData.settings?.class_creation_cost || 100,
              board_creation_cost: gateData.settings?.board_creation_cost || 50,
              max_members: gateData.settings?.max_members || 1000,
              ai_moderation_enabled: gateData.settings?.ai_moderation_enabled ?? true,
            },
          },
          token
        );
        console.log("Create gate response:", newGate);
        setGates((prev) => [...prev, newGate]);
        gateListCache.clear();
        return newGate;
      } catch (err) {
        console.error("Create gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateExistingGate = useCallback(
    async (gateId, gateData) => {
      if (!token || !gateId || !gateData?.name?.trim()) {
        setError("Authentication, gate ID, or name missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const { gate_id, ...updateData } = gateData;
        const updatedGate = await updateGate(gate_id, updateData, token);
        console.log("Update gate response:", updatedGate);
        setGates((prev) =>
          prev.map((g) => (g.gate_id === gateId ? updatedGate : g))
        );
        setGate(updatedGate);
        gateListCache.clear();
        return updatedGate;
      } catch (err) {
        console.error("Update gate error:", err);
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
        console.log("Update gate status response:", updatedGate);
        setGates((prev) =>
          prev.map((g) => (g.gate_id === gateId ? updatedGate : g))
        );
        setGate(updatedGate);
        gateListCache.clear();
        return updatedGate;
      } catch (err) {
        console.error("Update gate status error:", err);
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
        console.log("Gate deleted:", gateId);
        setGates((prev) => prev.filter((g) => g.gate_id !== gateId));
        setGate(null);
        gateListCache.clear();
        return true;
      } catch (err) {
        console.error("Delete gate error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const addMemberToGate = useCallback(
    async (gateId, { username, role = "viewer" }) => {
      if (!token || !gateId || !username?.trim()) {
        setError("Authentication, gate ID, or username missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const gate = await addGateMember(gateId, { username, role }, token);
        console.log("Add member response:", gate);
        setMembers(normalizeMembers(gate.members || []));
        setGate(gate);
        return gate;
      } catch (err) {
        console.error("Add member error:", err);
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
        const gate = await removeGateMember(gateId, memberId, token);
        console.log("Remove member response:", gate);
        setMembers(normalizeMembers(gate.members || []));
        setGate(gate);
        return gate;
      } catch (err) {
        console.error("Remove member error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const updateMemberRole = useCallback(
    async (gateId, memberId, role) => {
      if (!token || !gateId || !memberId || !role) {
        setError("Authentication, gate ID, member ID, or role missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const gate = await updateGateMember(gateId, memberId, { role }, token);
        console.log("Update member role response:", gate);
        setMembers(normalizeMembers(gate.members || []));
        setGate(gate);
        return gate;
      } catch (err) {
        console.error("Update member role error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const fetchGateMembersList = useCallback(
    async (gateId, signal) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGateMembers(gateId, token, signal);
        console.log("Fetch gate members response:", data);
        setMembers(normalizeMembers(data.members || []));
        return data;
      } catch (err) {
        console.error("Fetch gate members error:", err);
        return err.name !== "AbortError" ? handleAuthError(err) : null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const toggleFavoriteGate = useCallback(
    async (gateId, isFavorited) => {
      if (!token || !gateId) {
        setError("Authentication or gate ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedGate = isFavorited
          ? await unfavoriteGate(gateId, token)
          : await favoriteGate(gateId, token);
        console.log("Toggle favorite response:", updatedGate);
        setGates((prev) =>
          prev.map((g) => (g.gate_id === gateId ? updatedGate : g))
        );
        setGate((prev) => (prev?.gate_id === gateId ? updatedGate : prev));
        gateListCache.clear();
        return updatedGate;
      } catch (err) {
        console.error("Toggle favorite error:", err);
        return handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  useEffect(() => {
    if (!token) {
      gateListCache.clear();
      resetState();
    }
  }, [token, resetState]);

  return {
    gates,
    gate,
    members,
    stats,
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
    updateMemberRole,
    fetchGateMembersList,
    toggleFavoriteGate,
    resetState,
  };
};