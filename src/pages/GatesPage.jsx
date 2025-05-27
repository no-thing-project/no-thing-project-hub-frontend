import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, gridStyles, skeletonStyles, containerStyles } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import GatesGrid from "../components/Gates/GatesGrid";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import Filters from "../components/Filters/Filters";

const GatesPage = () => {
  const navigate = useNavigate();
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
    addMemberToGate, // Ensured this is destructured
    removeMemberFromGate, // Ensured this is destructured
    toggleFavoriteGate,
    updateMemberRole, // Ensured this is destructured
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

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const loadData = useCallback(
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
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (error) {
      showNotification(error, "error");
    }
  }, [error, showNotification]);

  const filteredGates = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return gates.filter((gate) => {
      const matchesSearch =
        gate.name?.toLowerCase().includes(lowerSearchQuery) ||
        gate.description?.toLowerCase().includes(lowerSearchQuery);
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return gate.is_public;
      if (quickFilter === "private") return !gate.is_public;
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
      // Reset popupGate state as in BoardsPage
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
      navigate(`/gate/${createdGate.gate_id}`); // Navigate to the new gate's page
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
    if (!gateToDelete) return; // Ensure gateToDelete is not null
    try {
      await deleteExistingGate(gateToDelete);
      setDeleteDialogOpen(false);
      setGateToDelete(null); // Reset state
      showNotification("Gate deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
      setDeleteDialogOpen(false); // Ensure dialog closes on error
      setGateToDelete(null); // Reset state on error
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
        await addMemberToGate(gateId, memberData); // Uses destructured addMemberToGate
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      }
    },
    [addMemberToGate, showNotification, gates] // Correct dependency
  );

  const handleRemoveMember = useCallback(
    async (gateId, username) => {
      try {
        await removeMemberFromGate(gateId, username); // Uses destructured removeMemberFromGate
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      }
    },
    [removeMemberFromGate, showNotification] // Correct dependency
  );

  const handleUpdateMemberRole = useCallback(
    async (gateId, username, newRole) => {
      try {
        await updateMemberRole(gateId, username, newRole); // Uses destructured updateMemberRole
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateMemberRole, showNotification] // Correct dependency
  );

  const handleOpenMemberDialog = useCallback((gateId) => {
    setSelectedGateId(gateId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null); // Reset selectedGateId
  }, []);

  const headerData = {
    type: "page",
    title: "Gates",
    titleAriaLabel: "Gates page",
    shortDescription: "Your Space for Big Ideas", // Adjusted to match BoardsPage style
    tooltipDescription:
      "Gates are like forum topics, starting points for broad discussions. Create a Gate to spark a conversation or join one to explore shared interests. It’s where communities form and ideas take root.", // Adjusted
  };

  if (authLoading || gatesLoading || isLoading) { // Combined loading states
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles }}>
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.header }} />
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.filter }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ ...skeletonStyles.card }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login"); // Redirect if not authenticated
    return null; // Return null to prevent rendering further
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData}>
          <Button
            onClick={handleOpenCreateGate}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles }}
            aria-label="Create a new gate"
          >
            Create Gate
          </Button>
        </ProfileHeader>
        <Filters
          type="gates"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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