// src/pages/GatesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import AppLayout from "../components/Layout/AppLayout";
import GatesSection from "../sections/GatesSection/GatesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Typography, Snackbar, Alert } from "@mui/material";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal"; // We'll create this
import { useGates } from "../hooks/useGates";

const GatesPage = ({ currentUser, onLogout, token }) => {
  const { gates, loading, error, fetchGatesList, likeGate, unlikeGate, deleteExistingGate } = useGates(token, onLogout);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchGatesList();
  }, [fetchGatesList]);

  const handleCreateSuccess = () => {
    fetchGatesList();
    setSuccess("Gate created successfully!");
  };

  const handleUpdateSuccess = () => {
    fetchGatesList();
    setSuccess("Gate updated successfully!");
  };

  const handleDelete = useCallback(async (gate_id) => {
    try {
      await deleteExistingGate(gate_id);
      setSuccess("Gate deleted successfully!");
    } catch (err) {
      setErrorMessage("Failed to delete gate");
    }
  }, [deleteExistingGate]);

  const handleLike = useCallback(async (gate_id, isLiked) => {
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
  }, [likeGate, unlikeGate]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <GatesSection
        currentUser={currentUser}
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
        onSuccess={handleCreateSuccess}
        onLogout={onLogout}
        navigate={null} // Will be provided by GatesSection if needed
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
        onSuccess={handleUpdateSuccess}
        onLogout={onLogout}
        navigate={null}
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