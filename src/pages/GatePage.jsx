import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import GateSection from "../sections/GateSection/GateSection";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";

const GatePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { gate_id } = useParams();

  const {
    gate: gateData,
    members,
    fetchGate,
    fetchGateMembersList,
    updateExistingGate,
    updateGateStatusById,
    deleteExistingGate,
    likeGateById,
    unlikeGateById,
    addMemberToGate,
    removeMemberFromGate,
    loading: gateLoading,
    error: gateError,
  } = useGates(token, handleLogout, navigate);

  const {
    createNewClassInGate,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, handleLogout, navigate);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [success, setSuccess] = useState("");

  const loadGateData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!gate_id || !token) {
      showNotification("Gate ID or authentication missing.", "error");
      return;
    }

    try {
      const [gateResult, membersResult] = await Promise.all([
        fetchGate(gate_id, signal),
        fetchGateMembersList(gate_id),
      ]);
      console.log("Gate data:", gateResult);
      console.log("Members:", membersResult);
      console.log("Classes from gateData:", gateResult.classes);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading gate data:", err);
        showNotification(err.message || "Failed to load gate data.", "error");
      }
    }

    return () => controller.abort();
  }, [gate_id, token, fetchGate, fetchGateMembersList, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadGateData();
  }, [loadGateData, isAuthenticated]);

  const handleCreateClass = useCallback(
    async (classData) => {
      try {
        const newClass = await createNewClassInGate(gate_id, classData);
        if (newClass) {
          setSuccess("Class created successfully!");
          setOpenCreateModal(false);
          await loadGateData();
        }
      } catch (err) {
        showNotification("Failed to create class.", "error");
      }
    },
    [gate_id, createNewClassInGate, loadGateData, showNotification]
  );

  const handleUpdateGate = useCallback(
    async (gateData) => {
      try {
        const updatedGate = await updateExistingGate(gate_id, gateData);
        if (updatedGate) {
          setSuccess("Gate updated successfully!");
          setOpenUpdateModal(false);
        }
      } catch (err) {
        showNotification("Failed to update gate.", "error");
      }
    },
    [gate_id, updateExistingGate, showNotification]
  );

  const handleDeleteGate = useCallback(async () => {
    try {
      await deleteExistingGate(gate_id);
      setSuccess("Gate deleted successfully!");
      navigate("/gates");
    } catch (err) {
      showNotification("Failed to delete gate.", "error");
    }
  }, [deleteExistingGate, gate_id, navigate, showNotification]);

  const handleLike = useCallback(
    async (isLiked) => {
      try {
        const updatedGate = isLiked ? await unlikeGateById(gate_id) : await likeGateById(gate_id);
        if (updatedGate) {
          setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
        }
      } catch (err) {
        showNotification(`Failed to ${isLiked ? "unlike" : "like"} gate`, "error");
      }
    },
    [likeGateById, unlikeGateById, gate_id, showNotification]
  );

  const handleStatusUpdate = useCallback(
    async (statusData) => {
      try {
        await updateGateStatusById(gate_id, statusData);
        setSuccess("Gate status updated successfully!");
        await fetchGate(gate_id);
      } catch (err) {
        showNotification("Failed to update gate status.", "error");
      }
    },
    [gate_id, updateGateStatusById, fetchGate, showNotification]
  );

  const handleAddMember = useCallback(
    async (memberData) => {
      try {
        await addMemberToGate(gate_id, memberData);
        setSuccess("Member added successfully!");
        await fetchGateMembersList(gate_id);
      } catch (err) {
        showNotification("Failed to add member.", "error");
      }
    },
    [gate_id, addMemberToGate, fetchGateMembersList, showNotification]
  );

  const handleRemoveMember = useCallback(
    async (memberId) => {
      try {
        await removeMemberFromGate(gate_id, memberId);
        setSuccess("Member removed successfully!");
        await fetchGateMembersList(gate_id);
      } catch (err) {
        showNotification("Failed to remove member.", "error");
      }
    },
    [gate_id, removeMemberFromGate, fetchGateMembersList, showNotification]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || gateLoading || classesLoading;
  const error = gateError || classesError;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) showNotification(error, "error");
  if (!gateData) showNotification("Gate not found", "error");

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <GateSection
        currentUser={authData}
        gateData={gateData}
        classes={gateData.classes || []}
        members={members}
        token={token}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={() => setOpenUpdateModal(false)}
        onDelete={handleDeleteGate}
        onLike={handleLike}
        onStatusUpdate={handleStatusUpdate}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
      />
      <CreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        entityType="class"
        token={token}
        gateId={gate_id}
        onSuccess={handleCreateClass}
        onLogout={handleLogout}
        navigate={navigate}
      />
      <UpdateModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        entityType="gate"
        entityData={gateData}
        token={token}
        onSuccess={handleUpdateGate}
        onLogout={handleLogout}
        navigate={navigate}
      />
    </AppLayout>
  );
};

export default GatePage;