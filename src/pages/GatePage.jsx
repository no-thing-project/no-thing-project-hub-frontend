// src/pages/GatePage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import GateSection from "../sections/GateSection/GateSection";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import { Snackbar, Alert } from "@mui/material";

const GatePage = ({ currentUser, onLogout, token }) => {
  const { gate_id } = useParams();
  const navigate = useNavigate();
  const {
    gate: gateData,
    fetchGate,
    updateGateStatus,
    deleteExistingGate,
    likeGate,
    unlikeGate,
    fetchMembersForGate,
    addMemberToGate,
    removeMemberFromGate,
    loading: gateLoading,
    error: gateError,
  } = useGates(token, onLogout, navigate);
  const {
    classes,
    fetchClassesByGateId,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, onLogout, navigate);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      try {
        await fetchGate(gate_id, signal);
        await fetchClassesByGateId(gate_id, signal);
        await fetchMembersForGate(gate_id);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading gate data:", err);
        }
      }
    };

    if (gate_id && token) {
      loadData();
    }

    return () => controller.abort();
  }, [gate_id, token, fetchGate, fetchClassesByGateId, fetchMembersForGate]);

  const handleCreateSuccess = () => {
    fetchClassesByGateId(gate_id);
    setSuccess("Class created successfully!");
  };

  const handleUpdateSuccess = () => {
    fetchGate(gate_id);
    setSuccess("Gate updated successfully!");
  };

  const handleDelete = useCallback(async () => {
    try {
      await deleteExistingGate(gate_id);
      setSuccess("Gate deleted successfully!");
      navigate("/gates");
    } catch (err) {
      setErrorMessage("Failed to delete gate");
    }
  }, [deleteExistingGate, gate_id, navigate]);

  const handleLike = useCallback(async (isLiked) => {
    try {
      if (isLiked) {
        await unlikeGate(gate_id);
      } else {
        await likeGate(gate_id);
      }
      setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
    } catch (err) {
      setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} gate`);
    }
  }, [likeGate, unlikeGate, gate_id]);

  const handleStatusUpdate = useCallback(async (statusData) => {
    try {
      await updateGateStatus(gate_id, statusData);
      setSuccess("Gate status updated successfully!");
    } catch (err) {
      setErrorMessage("Failed to update gate status");
    }
  }, [updateGateStatus, gate_id]);

  const handleAddMember = useCallback(async (memberData) => {
    try {
      await addMemberToGate(gate_id, memberData);
      setSuccess("Member added successfully!");
      fetchMembersForGate(gate_id);
    } catch (err) {
      setErrorMessage("Failed to add member");
    }
  }, [addMemberToGate, gate_id, fetchMembersForGate]);

  const handleRemoveMember = useCallback(async (memberId) => {
    try {
      await removeMemberFromGate(gate_id, memberId);
      setSuccess("Member removed successfully!");
      fetchMembersForGate(gate_id);
    } catch (err) {
      setErrorMessage("Failed to remove member");
    }
  }, [removeMemberFromGate, gate_id, fetchMembersForGate]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (gateLoading || classesLoading) return <LoadingSpinner />;
  if (gateError) return <ErrorMessage message={gateError} />;
  if (classesError) return <ErrorMessage message={classesError} />;
  if (!gateData) return <ErrorMessage message="Gate not found" />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <GateSection
        currentUser={currentUser}
        gateData={gateData}
        classes={classes}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={() => setOpenUpdateModal(true)}
        onDelete={handleDelete}
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
        onSuccess={handleCreateSuccess}
        onLogout={onLogout}
        navigate={navigate}
      />
      <UpdateModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        entityType="gate"
        entityData={gateData}
        token={token}
        onSuccess={handleUpdateSuccess}
        onLogout={onLogout}
        navigate={navigate}
      />
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default GatePage;