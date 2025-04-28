import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton, useTheme } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import GatesFilters from "../components/Gates/GatesFilters";
import GatesGrid from "../components/Gates/GatesGrid";
import { debounce } from "lodash";
import PropTypes from "prop-types";

const GatesPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gates,
    loading: gatesLoading,
    error,
    fetchGatesList,
    createNewGate,
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    toggleFavoriteGate,
    updateMemberRole,
  } = useGates(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingGate, setEditingGate] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState(null);
  const [popupGate, setPopupGate] = useState({
    name: "",
    description: "",
    is_public: true,
    visibility: "public",
    settings: {
      class_creation_cost: 100,
      board_creation_cost: 50,
      max_members: 1000,
      ai_moderation_enabled: true,
    },
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gateToDelete, setGateToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadGatesData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Authentication required.", "error");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await fetchGatesList({}, signal);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load gates", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchGatesList, showNotification]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadGatesData(controller.signal);
    return () => controller.abort();
  }, [loadGatesData]);

  useEffect(() => {
    if (error) {
      showNotification(error, "error");
    }
  }, [error, showNotification]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filteredGates = useMemo(() => {
    return gates.filter((gate) => {
      const matchesSearch = gate.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return gate.access?.is_public;
      if (quickFilter === "private") return !gate.access?.is_public;
      if (quickFilter === "favorited") return gate.is_favorited;
      return true;
    });
  }, [gates, quickFilter, searchQuery]);

  const handleOpenCreateGate = useCallback(() => setCreateDialogOpen(true), []);
  const handleCancelCreateGate = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupGate({
      name: "",
      description: "",
      is_public: true,
      visibility: "public",
      settings: {
        class_creation_cost: 100,
        board_creation_cost: 50,
        max_members: 1000,
        ai_moderation_enabled: true,
      },
    });
  }, []);

  const handleCreateGate = useCallback(async () => {
    if (!popupGate.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    try {
      const createdGate = await createNewGate(popupGate);
      setCreateDialogOpen(false);
      setPopupGate({
        name: "",
        description: "",
        is_public: true,
        visibility: "public",
        settings: {
          class_creation_cost: 100,
          board_creation_cost: 50,
          max_members: 1000,
          ai_moderation_enabled: true,
        },
      });
      showNotification("Gate created successfully!", "success");
      navigate(`/gate/${createdGate.gate_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create gate", "error");
    }
  }, [popupGate, createNewGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    }
  }, [editingGate, updateExistingGate, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    if (!gateToDelete) return;
    try {
      await deleteExistingGate(gateToDelete);
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      showNotification("Gate deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
      setDeleteDialogOpen(false);
      setGateToDelete(null);
    }
  }, [gateToDelete, deleteExistingGate, showNotification]);

  const handleAddMember = useCallback(
    async (gateId, memberData) => {
      try {
        const gate = gates.find((g) => g.gate_id === gateId);
        if (gate?.members?.length >= gate?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToGate(gateId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      }
    },
    [addMemberToGate, showNotification, gates]
  );

  const handleRemoveMember = useCallback(
    async (gateId, username) => {
      try {
        await removeMemberFromGate(gateId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      }
    },
    [removeMemberFromGate, showNotification]
  );

  const handleUpdateMemberRole = useCallback(
    async (gateId, username, newRole) => {
      try {
        await updateMemberRole(gateId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleOpenMemberDialog = useCallback((gateId) => {
    setSelectedGateId(gateId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
  }, []);

  if (authLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            onClick={handleOpenCreateGate}
            startIcon={<Add />}
            sx={{
              ...actionButtonStyles,
              [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
            }}
            aria-label="Create a new gate"
          >
            Create Gate
          </Button>
        </ProfileHeader>
        <GatesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
        />
        <GatesGrid
          filteredGates={filteredGates}
          handleFavorite={toggleFavoriteGate}
          setEditingGate={setEditingGate}
          setGateToDelete={setGateToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleAddMember={handleOpenMemberDialog}
          handleRemoveMember={handleRemoveMember}
          navigate={navigate}
          currentUser={authData}
        />
      </Box>
      <GateFormDialog
        open={createDialogOpen}
        title="Create New Gate"
        gate={popupGate}
        setGate={setPopupGate}
        onSave={handleCreateGate}
        onCancel={handleCancelCreateGate}
        disabled={gatesLoading}
      />
      {editingGate && (
        <GateFormDialog
          open={true}
          title="Edit Gate"
          gate={editingGate}
          setGate={setEditingGate}
          onSave={handleUpdateGate}
          onCancel={() => setEditingGate(null)}
          disabled={gatesLoading}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Members"
        gateId={selectedGateId}
        token={token}
        onSave={() => {}}
        onCancel={handleCancelMemberDialog}
        disabled={gatesLoading}
        members={gates.find((g) => g.gate_id === selectedGateId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteGate}
        message="Are you sure you want to delete this gate? This action cannot be undone."
        disabled={gatesLoading}
      />
    </AppLayout>
  );
};

GatesPage.propTypes = {
  navigate: PropTypes.func,
  token: PropTypes.string,
  authData: PropTypes.object,
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(GatesPage);