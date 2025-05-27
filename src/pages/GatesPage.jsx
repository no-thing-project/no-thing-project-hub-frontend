import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import AppLayout from "../components/Layout/AppLayout";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import Filters from "../components/Filters/Filters";
import Grids from "../components/Grids/Grids";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import CardMain from "../components/Cards/CardMain";
import { containerStyles } from "../styles/BaseStyles";

const GatesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gates,
    loading: gatesLoading,
    error: gatesError,
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
  const [actionLoading, setActionLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGateId, setSelectedGateId] = useState(null);
  const [editingGate, setEditingGate] = useState(null);
  const [gateToDelete, setGateToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [popupGate, setPopupGate] = useState({
    name: "",
    description: "",
    is_public: true,
    visibility: "public",
    type: "community",
    settings: {
      class_creation_cost: 100,
      board_creation_cost: 50,
      max_members: 1000,
      ai_moderation_enabled: true,
    },
  });

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
        setRetryCount(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load gates", "error");
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            setTimeout(() => setRetryCount((prev) => prev + 1), delay);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchGatesList, showNotification, retryCount]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (gatesError) showNotification(gatesError, "error");
  }, [gatesError, showNotification]);

  const filteredGates = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return gates.filter((gate) => {
      const matchesSearch =
        (gate.name?.toLowerCase() || "").includes(lowerSearchQuery) ||
        (gate.description?.toLowerCase() || "").includes(lowerSearchQuery) ||
        (gate.tags || []).some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
      if (!matchesSearch) return false;
      switch (quickFilter) {
        case "public":
          return gate.is_public || gate.access?.is_public;
        case "private":
          return !(gate.is_public || gate.access?.is_public);
        case "favorited":
          return gate.is_favorited;
        case "community":
          return gate.type === "community";
        case "organization":
          return gate.type === "organization";
        default:
          return true;
      }
    });
  }, [gates, quickFilter, searchQuery]);

  const handleOpenCreateGate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCancelCreateGate = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleCreateGate = useCallback(async () => {
    if (!popupGate.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const createdGate = await createNewGate(popupGate);
      setCreateDialogOpen(false);
      setPopupGate({
        name: "",
        description: "",
        is_public: true,
        visibility: "public",
        type: "community",
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
    } finally {
      setActionLoading(false);
    }
  }, [popupGate, createNewGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditDialogOpen(false);
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    if (!gateToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingGate(gateToDelete);
      setDeleteDialogOpen(false);
      setGateToDelete(null);
      showNotification("Gate deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [gateToDelete, deleteExistingGate, showNotification]);

  const handleOpenMemberDialog = useCallback((gateId) => {
    setSelectedGateId(gateId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null);
  }, []);

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedGateId(null);
    showNotification("Members updated successfully!", "success");
  }, [showNotification]);

  const handleAddMember = useCallback(
    async (gateId, memberData) => {
      setActionLoading(true);
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
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToGate, showNotification, gates]
  );

  const handleRemoveMember = useCallback(
    async (gateId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromGate(gateId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromGate, showNotification]
  );

  const handleUpdateMemberRole = useCallback(
    async (gateId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(gateId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification]
  );

  const headerData = useMemo(
    () => ({
      type: "page",
      title: "Gates",
      titleAriaLabel: "Gates page",
      shortDescription: "Your Space for Big Ideas",
      tooltipDescription:
        "Gates are like forum topics, starting points for broad discussions. Create a Gate to spark a conversation or join one to explore shared interests. It’s where communities form and ideas take root.",
      actions: [
        {
          label: "Create Gate",
          icon: <Add />,
          onClick: handleOpenCreateGate,
          tooltip: "Create a new gate",
          disabled: actionLoading || gatesLoading,
          ariaLabel: "Create a new gate",
        },
      ],
    }),
    [handleOpenCreateGate, actionLoading, gatesLoading]
  );

  if (authLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles, maxWidth: 1500, mx: "auto", p: { xs: 2, md: 4 } }}>
          <Skeleton variant="rectangular" height={150} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(320px, 1fr))" },
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={210} sx={{ borderRadius: 2 }} />
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
      <Box sx={{ ...containerStyles, maxWidth: 1500, mx: "auto", p: { xs: 2, md: 4 } }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} />
        <Filters
          type="gates"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={[
            { value: "all", label: "All" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
            { value: "favorited", label: "Favorited" },
            { value: "community", label: "Community" },
            { value: "organization", label: "Organization" },
          ]}
        />
        <Grids
          items={filteredGates}
          cardComponent={CardMain}
          itemKey="gate_id"
          gridType="gates"
          handleFavorite={toggleFavoriteGate}
          setEditingItem={(gate) => {
            setEditingGate(gate);
            setEditDialogOpen(true);
          }}
          setItemToDelete={setGateToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleManageMembers={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreateGate}
        />
        <GateFormDialog
          open={createDialogOpen}
          title="Create New Gate"
          gate={popupGate}
          setGate={setPopupGate}
          onSave={handleCreateGate}
          onCancel={handleCancelCreateGate}
          disabled={actionLoading || gatesLoading}
          loading={actionLoading}
        />
        {editingGate && (
          <GateFormDialog
            open={editDialogOpen}
            title="Edit Gate"
            gate={editingGate}
            setGate={setEditingGate}
            onSave={handleUpdateGate}
            onCancel={() => {
              setEditDialogOpen(false);
              setEditingGate(null);
            }}
            disabled={actionLoading || gatesLoading}
            loading={actionLoading}
          />
        )}
        <MemberFormDialog
          open={memberDialogOpen}
          title="Manage Members"
          gateId={selectedGateId}
          token={token}
          onSave={handleSaveMembers}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading || gatesLoading}
          members={gates.find((g) => g.gate_id === selectedGateId)?.members || []}
          addMember={handleAddMember}
          removeMember={handleRemoveMember}
          updateMemberRole={handleUpdateMemberRole}
          loading={actionLoading}
        />
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setGateToDelete(null);
          }}
          onConfirm={handleDeleteGate}
          message="Are you sure you want to delete this gate? This action cannot be undone."
          disabled={actionLoading || gatesLoading}
          loading={actionLoading}
        />
      </Box>
    </AppLayout>
  );
};

GatesPage.propTypes = {
  navigate: PropTypes.func,
  token: PropTypes.string,
  authData: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
    avatar: PropTypes.string,
    total_points: PropTypes.number,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(GatesPage);