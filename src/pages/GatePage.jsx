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
import useAuth from "../hooks/useAuth";

const GatePage = () => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState("");

  const loadGateData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!gate_id || !token) {
      setErrorMessage("Gate ID or authentication missing.");
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
        setErrorMessage(err.message || "Failed to load gate data.");
      }
    }

    return () => controller.abort();
  }, [gate_id, token, fetchGate, fetchGateMembersList]);

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
          await loadGateData(); // Оновлюємо дані гейта, щоб отримати оновлений список класів
        }
      } catch (err) {
        setErrorMessage("Failed to create class.");
      }
    },
    [gate_id, createNewClassInGate, loadGateData]
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
        setErrorMessage("Failed to update gate.");
      }
    },
    [gate_id, updateExistingGate]
  );

  const handleDeleteGate = useCallback(async () => {
    try {
      await deleteExistingGate(gate_id);
      setSuccess("Gate deleted successfully!");
      navigate("/gates");
    } catch (err) {
      setErrorMessage("Failed to delete gate.");
    }
  }, [deleteExistingGate, gate_id, navigate]);

  const handleLike = useCallback(
    async (isLiked) => {
      try {
        const updatedGate = isLiked ? await unlikeGateById(gate_id) : await likeGateById(gate_id);
        if (updatedGate) {
          setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
        }
      } catch (err) {
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} gate`);
      }
    },
    [likeGateById, unlikeGateById, gate_id]
  );

  const handleStatusUpdate = useCallback(
    async (statusData) => {
      try {
        await updateGateStatusById(gate_id, statusData);
        setSuccess("Gate status updated successfully!");
        await fetchGate(gate_id);
      } catch (err) {
        setErrorMessage("Failed to update gate status.");
      }
    },
    [gate_id, updateGateStatusById, fetchGate]
  );

  const handleAddMember = useCallback(
    async (memberData) => {
      try {
        await addMemberToGate(gate_id, memberData);
        setSuccess("Member added successfully!");
        await fetchGateMembersList(gate_id);
      } catch (err) {
        setErrorMessage("Failed to add member.");
      }
    },
    [gate_id, addMemberToGate, fetchGateMembersList]
  );

  const handleRemoveMember = useCallback(
    async (memberId) => {
      try {
        await removeMemberFromGate(gate_id, memberId);
        setSuccess("Member removed successfully!");
        await fetchGateMembersList(gate_id);
      } catch (err) {
        setErrorMessage("Failed to remove member.");
      }
    },
    [gate_id, removeMemberFromGate, fetchGateMembersList]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || gateLoading || classesLoading;
  const error = gateError || classesError || errorMessage;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;
  if (!gateData) return <ErrorMessage message="Gate not found" />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <GateSection
        currentUser={authData}
        gateData={gateData}
        classes={gateData.classes || []} // Використовуємо classes із gateData
        members={members}
        token={token}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={() => setOpenUpdateModal(true)}
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