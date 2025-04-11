import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import GatesFilters from "../components/Gates/GatesFilters";
import GatesGrid from "../components/Gates/GatesGrid";

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

  const [isLoading, setIsLoading] = useState(true);
  const [editingGate, setEditingGate] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupGate, setPopupGate] = useState({ name: "", description: "", visibility: "Public" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gateToDelete, setGateToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  const loadGatesData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      showNotification("Authentication missing.", "error");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      await fetchGatesList();
    } catch (err) {
      showNotification(err.message || "Failed to load gates", "error");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, fetchGatesList, showNotification]);

  useEffect(() => {
    loadGatesData();
  }, [loadGatesData]);

  const filteredGates = useMemo(() => {
    return gates.filter((gate) => {
      const matchesSearch = gate.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return gate.is_public;
      if (quickFilter === "private") return !gate.is_public;
      if (quickFilter === "liked") return localLikes[gate.gate_id] ?? gate.is_liked;
      return true;
    });
  }, [gates, quickFilter, searchQuery, localLikes]);

  const handleOpenCreateGate = () => setCreateDialogOpen(true);
  const handleCancelCreateGate = () => setCreateDialogOpen(false);

  const handleCreateGate = useCallback(async () => {
    if (!popupGate.name.trim()) return showNotification("Gate name is required!", "error");
    try {
      const createdGate = await createNewGate({
        name: popupGate.name,
        description: popupGate.description,
        is_public: popupGate.visibility === "Public",
      });
      setCreateDialogOpen(false);
      setPopupGate({ name: "", description: "", visibility: "Public" });
      showNotification("Gate created successfully!", "success");
      navigate(`/gate/${createdGate.gate_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create gate", "error");
    }
  }, [popupGate, createNewGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) return showNotification("Gate name is required!", "error");
    try {
      await updateExistingGate(editingGate.gate_id, {
        name: editingGate.name,
        description: editingGate.description,
        is_public: editingGate.visibility === "Public",
      });
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
      await loadGatesData();
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    }
  }, [editingGate, updateExistingGate, loadGatesData, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    if (!gateToDelete) return;
    try {
      await deleteExistingGate(gateToDelete);
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      showNotification("Gate deleted successfully!", "success");
      await loadGatesData();
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
    }
  }, [gateToDelete, deleteExistingGate, loadGatesData, showNotification]);

  const handleLike = useCallback(async (gate_id, isLiked) => {
    setLocalLikes((prev) => ({ ...prev, [gate_id]: !isLiked }));
    try {
      isLiked ? await unlikeGateById(gate_id) : await likeGateById(gate_id);
      showNotification(`Gate ${isLiked ? "unliked" : "liked"} successfully!`, "success");
      await loadGatesData();
    } catch (err) {
      setLocalLikes((prev) => ({ ...prev, [gate_id]: isLiked }));
      showNotification(`Failed to ${isLiked ? "unlike" : "like"} gate`, "error");
    }
  }, [likeGateById, unlikeGateById, loadGatesData, showNotification]);

  if (isLoading || authLoading || gatesLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return navigate("/login") || null;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button onClick={handleOpenCreateGate} startIcon={<Add />} sx={actionButtonStyles}>
            Create Gate
          </Button>
        </ProfileHeader>
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
      </Box>
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
          open={true}
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
        message="Are you sure you want to delete this gate?"
      />
    </AppLayout>
  );
};

export default GatesPage;