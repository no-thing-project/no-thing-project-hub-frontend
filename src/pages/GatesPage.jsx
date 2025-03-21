// src/pages/GatesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import GatesSection from "../sections/GatesSection/GatesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal";
import { useGates } from "../hooks/useGates";
import { Snackbar, Alert } from "@mui/material";
import useAuth from "../hooks/useAuth";

const GatesPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    gates,
    loading,
    error,
    fetchGatesList,
    createNewGate,
    updateExistingGate,
    deleteExistingGate,
    likeGateById,
    unlikeGateById,
  } = useGates(token, handleLogout, navigate);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadGates = useCallback(async () => {
    const controller = new AbortController();
    try {
      await fetchGatesList({}, controller.signal);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to load gates:", err);
        setErrorMessage("Failed to load gates.");
      }
    }
    return () => controller.abort();
  }, [fetchGatesList]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadGates();
  }, [loadGates, isAuthenticated]);

  const handleCreateGate = useCallback(
    async (gateData) => {
      try {
        const newGate = await createNewGate(gateData);
        if (newGate) {
          setSuccess("Gate created successfully!");
          setOpenCreateModal(false);
        }
      } catch (err) {
        setErrorMessage("Failed to create gate.");
      }
    },
    [createNewGate]
  );

  const handleUpdateGate = useCallback(
    async (gateData) => {
      try {
        const updatedGate = await updateExistingGate(selectedGate.gate_id, gateData);
        if (updatedGate) {
          setSuccess("Gate updated successfully!");
          setOpenUpdateModal(false);
          setSelectedGate(null);
        }
      } catch (err) {
        setErrorMessage("Failed to update gate.");
      }
    },
    [updateExistingGate, selectedGate]
  );

  const handleDelete = useCallback(
    async (gateId) => {
      try {
        await deleteExistingGate(gateId);
        setSuccess("Gate deleted successfully!");
      } catch (err) {
        setErrorMessage("Failed to delete gate.");
      }
    },
    [deleteExistingGate]
  );

  const handleLike = useCallback(
    async (gateId, isLiked) => {
      try {
        const updatedGate = isLiked ? await unlikeGateById(gateId) : await likeGateById(gateId);
        if (updatedGate) {
          setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
        }
      } catch (err) {
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} gate`);
      }
    },
    [likeGateById, unlikeGateById]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <GatesSection
        currentUser={authData}
        gates={gates}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={(gate) => {
          setSelectedGate(gate);
          setOpenUpdateModal(true);
        }}
        onDelete={handleDelete}
        onLike={handleLike}
      />
      <CreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        entityType="gate"
        token={token}
        onSuccess={handleCreateGate}
        onLogout={handleLogout}
        navigate={navigate}
      />
      <UpdateModal
        open={openUpdateModal}
        onClose={() => {
          setOpenUpdateModal(false);
          setSelectedGate(null);
        }}
        entityType="gate"
        entityData={selectedGate}
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

export default GatesPage;