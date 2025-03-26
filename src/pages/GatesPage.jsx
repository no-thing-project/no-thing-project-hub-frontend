import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
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
import { useNotification } from "../context/NotificationContext";

const GatesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
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
    setCreateDialogOpen(true);
  };

  const handleCancelCreateGate = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateGate = useCallback(async () => {
    if (!popupGate.name.trim()) {
      showNotification("Gate name is required!", "error");
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
      const errorMsg = err.response?.data?.errors?.[0] || err.message || "Failed to create gate";
      showNotification(errorMsg, "error");
    }
  }, [popupGate, createNewGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
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
      showNotification(err.response?.data?.errors?.[0] || "Failed to update gate", "error");
    }
  }, [editingGate, updateExistingGate, fetchGatesList, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    if (!gateToDelete) return;
    try {
      await deleteExistingGate(gateToDelete);
      setSuccess("Gate deleted successfully!");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      await fetchGatesList();
    } catch (err) {
      showNotification(err.response?.data?.errors?.[0] || "Failed to delete gate", "error");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
    }
  }, [gateToDelete, deleteExistingGate, fetchGatesList, showNotification]);

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
        showNotification(`Failed to ${isLiked ? "unlike" : "like"} gate`, "error");
      }
    },
    [likeGateById, unlikeGateById, fetchGatesList, showNotification]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
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
      />

      {editingGate && (
        <GateFormDialog
          open={Boolean(editingGate)}
          title="Edit Gate"
          gate={editingGate}
          setGate={setEditingGate}
          onSave={handleUpdateGate}
          onCancel={() => setEditingGate(null)}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteGate}
      />
    </AppLayout>
  );
};

export default GatesPage;