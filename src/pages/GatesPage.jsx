// src/pages/GatesPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Snackbar, Alert } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import GatesFilters from "../components/Gates/GatesFilters";
import GatesGrid from "../components/Gates/GatesGrid";

const GatesPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    gates,
    loading: gatesLoading,
    fetchGatesList,
    createNewGate,
    updateExistingGate,
    deleteExistingGate,
    likeGateById,
    unlikeGateById,
  } = useGates(token, handleLogout, navigate);

  const [editingGate, setEditingGate] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupGate, setPopupGate] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gateToDelete, setGateToDelete] = useState(null);

  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchGatesList();
  }, [isAuthenticated, fetchGatesList]);

  const filteredGates = gates.filter((gate) => {
    const matchesSearch = gate.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return gate.is_public;
    if (quickFilter === "private") return !gate.is_public;
    if (quickFilter === "liked") {
      const isLiked =
        localLikes[gate.gate_id] !== undefined ? localLikes[gate.gate_id] : gate.is_liked;
      return isLiked;
    }
    return true;
  });

  const handleOpenCreateGate = () => {
    setPopupGate({ name: "", description: "", visibility: "Public" });
    setErrorMessage("");
    setCreateDialogOpen(true);
  };

  const handleCancelCreateGate = () => {
    setCreateDialogOpen(false);
    setErrorMessage("");
  };

  const handleCreateGate = useCallback(async () => {
    if (!popupGate.name.trim()) {
      setErrorMessage("Gate name is required!");
      return;
    }
    try {
      const createdGate = await createNewGate({
        name: popupGate.name,
        description: popupGate.description,
        is_public: popupGate.visibility === "Public",
      });
      setSuccess("Gate created successfully!");
      setCreateDialogOpen(false);
      setPopupGate({ name: "", description: "", visibility: "Public" });
      navigate(`/gate/${createdGate.gate_id}`);
    } catch (err) {
      // Витягуємо точне повідомлення з помилки
      const errorMsg = err.response?.data?.errors?.[0] || err.message || "Failed to create gate";
      setErrorMessage(errorMsg);
    }
  }, [popupGate, createNewGate, navigate]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      setErrorMessage("Gate name is required!");
      return;
    }
    try {
      await updateExistingGate(editingGate.gate_id, {
        name: editingGate.name,
        description: editingGate.description,
        is_public: editingGate.visibility === "Public",
      });
      setSuccess("Gate updated successfully!");
      setEditingGate(null);
      await fetchGatesList();
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to update gate");
    }
  }, [editingGate, updateExistingGate, fetchGatesList]);

  const handleDeleteGate = useCallback(async () => {
    if (!gateToDelete) return;
    try {
      await deleteExistingGate(gateToDelete);
      setSuccess("Gate deleted successfully!");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      await fetchGatesList();
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to delete gate");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
    }
  }, [gateToDelete, deleteExistingGate, fetchGatesList]);

  const handleLike = useCallback(
    async (gate_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [gate_id]: optimisticLiked }));
      try {
        if (isLiked) {
          await unlikeGateById(gate_id);
        } else {
          await likeGateById(gate_id);
        }
        setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
        await fetchGatesList();
        setLocalLikes({});
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [gate_id]: isLiked }));
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} gate`);
      }
    },
    [likeGateById, unlikeGateById, fetchGatesList]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || gatesLoading;
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle="Gates">
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button variant="contained" onClick={handleOpenCreateGate} startIcon={<Add />} sx={actionButtonStyles}>
            Create Gate
          </Button>
        </ProfileHeader>
      </Box>

      <GatesFilters
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <GatesGrid
        filteredGates={filteredGates}
        localLikes={localLikes}
        handleLike={handleLike}
        setEditingGate={setEditingGate}
        setGateToDelete={setGateToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        navigate={navigate}
      />

      <GateFormDialog
        open={createDialogOpen}
        title="Create New Gate"
        gate={popupGate}
        setGate={setPopupGate}
        onSave={handleCreateGate}
        onCancel={handleCancelCreateGate}
        errorMessage={errorMessage}
      />

      {editingGate && (
        <GateFormDialog
          open={Boolean(editingGate)}
          title="Edit Gate"
          gate={editingGate}
          setGate={setEditingGate}
          onSave={handleUpdateGate}
          onCancel={() => setEditingGate(null)}
          errorMessage={errorMessage}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteGate}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }} role="alert">
          {errorMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default GatesPage;