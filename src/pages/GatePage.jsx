import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Skeleton, useTheme } from "@mui/material";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import AppLayout from "../components/Layout/AppLayout";

import ProfileHeader from "../components/Headers/ProfileHeader";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import { Add, Edit, Delete, Public, Lock, People, Forum, Star } from "@mui/icons-material";

const GatePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { gate_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    gate: gateData,
    members,
    stats,
    fetchGate,
    fetchGateMembersList,
    updateExistingGate,
    deleteExistingGate,
    addMemberToGate,
    removeMemberFromGate,
    updateMemberRole: updateGateMemberRole,
    toggleFavoriteGate,
    loading: gatesLoading,
    error: gateError,
  } = useGates(token, handleLogout, navigate);
  const {
    classes,
    fetchClassesByGate,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
    toggleFavoriteClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [editingGate, setEditingGate] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    is_public: false,
    visibility: "private",
    gate_id,
    type: "group",
    settings: {
      max_boards: 100,
      max_members: 50,
      board_creation_cost: 15,
      tweet_cost: 1,
      allow_invites: true,
      require_approval: false,
      ai_moderation_enabled: true,
      auto_archive_after: 30,
    },
  });

  const loadData = useCallback(
    async (signal) => {
      if (!gate_id || !token || !isAuthenticated) {
        showNotification("Gate ID or authentication missing.", "error");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchGate(gate_id, signal),
          fetchGateMembersList(gate_id, signal),
          fetchClassesByGate(gate_id, {}, signal),
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load gate data.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [gate_id, token, isAuthenticated, fetchGate, fetchGateMembersList, 
            fetchClassesByGate, showNotification]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (gateError) showNotification(gateError, "error");
    if (classesError) showNotification(classesError, "error");
  }, [gateError, classesError, showNotification]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filteredClasses = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return classes
      .map((classItem) => ({
        ...classItem,
        gateName: gateData?.name || "Unknown Gate",
      }))
      .filter((item) => {
        const matchesSearch =
          item.name?.toLowerCase().includes(lowerSearchQuery) ||
          item.description?.toLowerCase().includes(lowerSearchQuery) ||
          item.gateName.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        if (quickFilter === "all") return true;
        if (quickFilter === "public") return item.access?.is_public;
        if (quickFilter === "private") return !item.access?.is_public;
        if (quickFilter === "favorited") return item.is_favorited;
        return true;
      });
  }, [classes, gateData, quickFilter, searchQuery]);

  const handleOpenCreateClass = useCallback(() => setCreateClassDialogOpen(true), []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({
      name: "",
      description: "",
      is_public: false,
      visibility: "private",
      gate_id,
      type: "group",
      settings: {
        max_boards: 100,
        max_members: 50,
        board_creation_cost: 15,
        tweet_cost: 1,
        allow_invites: true,
        require_approval: false,
        ai_moderation_enabled: true,
        auto_archive_after: 30,
      },
    });
  }, [gate_id]);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const newClass = await createNewClass(popupClass);
      showNotification("Class created successfully!", "success");
      setCreateClassDialogOpen(false);
      navigate(`/class/${newClass.class_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, createNewClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification("Class deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [classToDelete, deleteExistingClass, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingGate(editingGate.gate_id, editingGate);
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingGate, updateExistingGate, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingGate(gate_id);
      showNotification("Gate deleted successfully!", "success");
      navigate("/gates");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, deleteExistingGate, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    setActionLoading(true);
    try {
      await toggleFavoriteGate(gate_id, gateData?.is_favorited);
      showNotification(
        gateData?.is_favorited ? "Gate removed from favorites!" : "Gate added successfully!", "Gate added to favorites!",
        "success"
      );
    } catch (err) {
      showNotification(
        err.message || "Failed to add gate from favorites",
        gateData?.is_favorited
          ? "Failed to remove gate from favorites"
          : "Failed to add gate to favorites",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }, [gate_id, gateData, toggleFavoriteGate, showNotification]);

  const handleAddMember = useCallback(
    async (gateId, memberData) => {
      try {
        if (members.length >= gateData?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToGate(gateId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      }
    },
    [addMemberToGate, showNotification, members, gateData]
  );

  const handleRemoveMember = useCallback(
    async (gatingId, username) => {
      try {
        await removeMemberFromGate(gatingId, username);
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
        await updateGateMemberRole(gateId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateGateMemberRole,, showNotification]
  );

  const handleAddClassMember = useCallback(
    async (classId, memberData) => {
      try {
        const classItem = classes.find((c) => c.class_id === classId);
        if (classItem?.members?.length >= classItem?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToClass(classId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      }
    },
    [addMemberToClass, showNotification, classes]
  );

  const handleRemoveClassMember = useCallback(
    async (classId, username) => {
      try {
        await removeMemberFromClass(classId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      }
    },
    [removeMemberFromClass, showNotification]
  );

  const handleUpdateClassMemberRole = useCallback(
    async (classId, username, newRole) => {
      try {
        await updateClassMemberRole(classId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateClassMemberRole, showNotification]
  );

  const handleOpenMemberDialog = useCallback((classId) => {
    setSelectedClassId(classId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
  }, []);

  const userRole = useMemo(
    () => members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "none",
  [members, authData]
);

const headerData = useMemo(
    () => ({
      type: "gate",
      title: gateData?.name || "Untitled Gate",
      titleAriaLabel: `Gate name: ${gateData?.name || "Untitled Gate"}`,
      description: gateData?.description ? `Gate description: ${gateData.description}` : undefined,
      chips: [
        {
          label: gateData?.access?.is_public ? "Public" : "Private",
          icon: gateData?.access?.is_public ? <Public /> : <Lock />,
          color: gateData?.access?.is_public ? "success" : "default",
          ariaLabel: gateData?.access?.is_public ? "Public gate" : "Private gate",
        },
        {
          label: `Members: ${stats?.member_count || members.length || 0}`,
          icon: <People />,
          color: "primary",
          ariaLabel: `Members: ${stats?.member_count || members.length || 0}`,
        },
        {
          label: `Classes: ${filteredClasses?.length || 0}`,
          icon: <Forum />,
          color: "info",
          ariaLabel: `Classes: ${filteredClasses?.length || 0}`,
        },
        {
          label: `Favorites: ${stats?.favorite_count || 0}`,
          icon: <Star />,
          color: "warning",
          ariaLabel: `Favorites: ${stats?.favorite_count || 0}`,
        },
        {
          label: `Owner: ${gateData?.creator?.username || "Unknown"}`,
          ariaLabel: `Owner: ${gateData?.creator?.username || "Unknown"}`,
        },
      ],
      actions: [
        {
          label: "Create Class",
          icon: <Add />,
          onClick: handleOpenCreateClass,
          tooltip: "Create a new class within this gate",
          disabled: actionLoading,
          ariaLabel: "Create a new class",
          isMenuItem: false,
        },
        {
          label: "Edit Gate",
          onClick: () =>
            setEditingGate({
              gate_id,
              id: gateData.gate_id,
              name: gateData.name,
              description: gateData.description,
              is_public: gateData.access?.is_public,
              visibility: gateData.access?.is_public ? "public" : "private",
              settings: gateData.settings,
            }),
          tooltip: "Edit gate details",
          disabled: actionLoading || !["owner", "admin"].includes(userRole),
          ariaLabel: "Edit gate",
          isMenuItem: true,
        },
        {
          label: "Manage Members",
          onClick: () => setMemberDialogOpen(true),
          tooltip: "Manage gate members",
          disabled: actionLoading || !["owner", "admin"].includes(userRole),
          ariaLabel: "Manage members",
          isMenuItem: true,
        },
        {
          label: "Delete Gate",
          onClick: handleDeleteGate,
          tooltip: "Permanently delete this gate",
          disabled: actionLoading || userRole !== "owner",
          ariaLabel: "Delete gate",
          variant: "delete",
          isMenuItem: true,
        },
      ],
      isFavorited: gateData?.is_favorited,
      onFavoriteToggle: handleFavoriteToggle,
    }),
  [
    gateData,
    stats,
    members,
    filteredClasses,
    userRole,
    actionLoading,
    handleOpenCreateClass,
    handleDeleteGate,
    handleFavoriteToggle,
  ]
);

  if (authLoading || gatesLoading || classesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 4 } }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 3, borderRadius: 2 }} />
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
              }}
            >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
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

  if (!gateData) {
    showNotification("Gate not found", "error");
    navigate("/gates");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 4 } }}>
        <ProfileHeader
          user={authData}
          isOwnProfile={true}
          headerData={headerData}
          userRole={userRole}
          />
        <ClassesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
          sx={{ mb: 3, bgcolor: theme.palette.background.paper, p: 2, borderRadius: 2 }}
          />
        <ClassesGrid
          filteredClasses={filteredClasses}
          handleFavorite={toggleFavoriteClass}
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleOpenMemberDialog={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
        />
        <ClassFormDialog
          open={createClassDialogOpen}
          title="Create New Class"
          classItem={popupClass}
          setClass={setPopupClass}
          onSave={handleCreateClass}
          onCancel={handleCancelCreateClass}
          token={token}
          gates={[{ gate_id, name: gateData.name }]}
          fixedGateId={gate_id}
          disabled={actionLoading || classesLoading || gatesLoading}
          />
        {editingClass && (
          <ClassFormDialog
            open={true}
            title="Edit Class"
            classItem={editingClass}
            setClass={setEditingClass}
            onSave={handleUpdateClass}
            onCancel={() => setEditingClass(null)}
            token={token}
            gates={[{ gate_id, name: gateData.name }]}
            fixedGateId={gate_id}
            disabled={actionLoading || classesLoading}
            />
          )}
        {editingGate && (
          <GateFormDialog
            open={true}
            title="Edit Gate"
            gate={editingGate}
            setGate={setEditingGate}
            onSave={handleUpdateGate}
            onCancel={() => setEditingGate(null)}
            disabled={actionLoading || gatesLoading}
            />
          )}
        <MemberFormDialog
          open={memberDialogOpen}
          title={selectedClassId ? "Manage Class Members" : "Manage Gate Members"}
          gateId={selectedClassId ? null : gate_id}
          classId={selectedClassId}
          token={token}
          onSave={handleCancelMemberDialog}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading || classesLoading || gatesLoading}
          members={
            selectedClassId
              ? classes.find((c) => c.class_id === selectedClassId)?.members || []
              : members
            }
          addMember={selectedClassId ? handleAddClassMember : handleAddMember}
          removeMember={selectedClassId ? handleRemoveClassMember : handleRemoveMember}
          updateMemberRole={selectedClassId ? handleUpdateClassMemberRole : handleUpdateMemberRole}
          />
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteClass}
          message="Are you sure you want to delete this class? This action cannot be undone."
          disabled={actionLoading || classesLoading}
          />
      </Box>
    </AppLayout>
  );
};

GatePage.propTypes = {
  navigate: PropTypes.func,
  location: PropTypes.object,
  gate_id: PropTypes.string,
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

export default React.memo(GatePage);