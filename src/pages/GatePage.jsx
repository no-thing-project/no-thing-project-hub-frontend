import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Chip, Skeleton, Typography, Tooltip, useTheme } from "@mui/material";
import { Add, Edit, Delete, Public, Lock, People, Forum, Star } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, deleteButtonStyle } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { debounce } from "lodash";
import PropTypes from "prop-types";

/**
 * GatePage component for displaying and managing a gate and its classes
 * @param {Object} props - Component props
 * @returns {JSX.Element} The rendered GatePage component
 */
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
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    toggleFavoriteClass,
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
      board_creation_cost: 50,
      tweet_cost: 1,
      allow_invites: true,
      require_approval: false,
      ai_moderation_enabled: true,
      auto_archive_after: 30,
    },
  });

  const loadGateData = useCallback(async () => {
    if (!gate_id || !token) {
      showNotification("Gate ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    try {
      await Promise.all([
        fetchGate(gate_id, controller.signal),
        fetchGateMembersList(gate_id, controller.signal),
        fetchClassesByGate(gate_id, {}, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load gate data.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [gate_id, token, fetchGate, fetchGateMembersList, fetchClassesByGate, showNotification]);

  useEffect(() => {
    if (isAuthenticated) loadGateData();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [loadGateData, isAuthenticated]);

  useEffect(() => {
    if (gateError || classesError) {
      showNotification(gateError || classesError, "error");
    }
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
      .filter((classItem) => {
        const matchesSearch =
          classItem.name?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.description?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.gateName.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        if (quickFilter === "all") return true;
        if (quickFilter === "public") return classItem.access?.is_public;
        if (quickFilter === "private") return !classItem.access?.is_public;
        if (quickFilter === "favorited") return classItem.is_favorited;
        return true;
      });
  }, [classes, quickFilter, searchQuery, gateData]);

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
        board_creation_cost: 50,
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
        gateData?.is_favorited ? "Gate removed from favorites!" : "Gate added to favorites!",
        "success"
      );
    } catch (err) {
      showNotification(
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
        await updateGateMemberRole(gateId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateGateMemberRole, showNotification]
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

  const userRole = members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "none";
  const canManage = ["owner", "admin"].includes(userRole);

  if (authLoading || gatesLoading || classesLoading || isLoading) {
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

  if (!gateData) {
    showNotification("Gate not found", "error");
    navigate("/gates");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", p: { xs: 2, md: 3 } }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Tooltip title="Create a new class within this gate">
              <Button
                onClick={handleOpenCreateClass}
                startIcon={<Add />}
                sx={{
                  ...actionButtonStyles,
                  [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                }}
                disabled={actionLoading}
                aria-label="Create a new class"
              >
                Create Class
              </Button>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title="Edit gate details and settings">
                  <Button
                    onClick={() =>
                      setEditingGate({
                        gate_id: gateData.gate_id,
                        name: gateData.name,
                        description: gateData.description,
                        is_public: gateData.access?.is_public,
                        visibility: gateData.access?.is_public ? "public" : "private",
                        settings: gateData.settings,
                      })
                    }
                    startIcon={<Edit />}
                    sx={{
                      ...actionButtonStyles,
                      [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                    }}
                    disabled={actionLoading}
                    aria-label="Edit gate"
                  >
                    Edit Gate
                  </Button>
                </Tooltip>
                <Tooltip title="Manage gate members">
                  <Button
                    onClick={() => setMemberDialogOpen(true)}
                    startIcon={<People />}
                    sx={{
                      ...actionButtonStyles,
                      [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                    }}
                    disabled={actionLoading}
                    aria-label="Manage members"
                  >
                    Manage Members
                  </Button>
                </Tooltip>
                {userRole === "owner" && (
                  <Tooltip title="Permanently delete this gate">
                    <Button
                      onClick={handleDeleteGate}
                      startIcon={<Delete />}
                      sx={{
                        ...deleteButtonStyle,
                        [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                      }}
                      disabled={actionLoading}
                      aria-label="Delete gate"
                    >
                      Delete Gate
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
            <Tooltip
              title={gateData.is_favorited ? "Remove gate from favorites" : "Add gate to favorites"}
            >
              <Button
                onClick={handleFavoriteToggle}
                startIcon={gateData.is_favorited ? <Star color="warning" /> : <Star />}
                sx={{
                  ...actionButtonStyles,
                  [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                }}
                disabled={actionLoading}
                aria-label={gateData.is_favorited ? "Remove from favorites" : "Add to favorites"}
              >
                {gateData.is_favorited ? "Remove Favorite" : "Add Favorite"}
              </Button>
            </Tooltip>
          </Box>
        </ProfileHeader>
        <Box sx={{ my: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
            }}
          >
            {gateData.name || "Untitled Gate"}
          </Typography>
          {gateData.description && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 2, fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              {gateData.description}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              label={gateData.access?.is_public ? "Public" : "Private"}
              icon={gateData.access?.is_public ? <Public /> : <Lock />}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              aria-label={gateData.access?.is_public ? "Public gate" : "Private gate"}
            />
            <Chip
              label={`Members: ${stats?.member_count || members.length}`}
              icon={<People />}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              aria-label={`Members: ${stats?.member_count || members.length}`}
            />
            <Chip
              label={`Classes: ${filteredClasses.length}`}
              icon={<Forum />}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              aria-label={`Classes: ${filteredClasses.length}`}
            />
            <Chip
              label={`Favorites: ${stats?.favorite_count || 0}`}
              icon={<Star />}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              aria-label={`Favorites: ${stats?.favorite_count || 0}`}
            />
            <Chip
              label={`Owner: ${gateData.creator?.username || "Unknown"}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              aria-label={`Owner: ${gateData.creator?.username || "Unknown"}`}
            />
          </Box>
        </Box>
        <ClassesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
        />
        <ClassesGrid
          filteredClasses={filteredClasses}
          handleFavorite={toggleFavoriteClass}
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleAddMember={handleOpenMemberDialog}
          handleRemoveMember={handleRemoveClassMember}
          navigate={navigate}
          currentUser={authData}
        />
      </Box>
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
          disabled={actionLoading || classesLoading || gatesLoading}
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
        onSave={() => {}}
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