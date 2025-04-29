import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Skeleton, Typography, useTheme } from "@mui/material";
import { Add, Star } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useClasses } from "../hooks/useClasses"; // Custom hook for class data
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { debounce } from "lodash";
import PropTypes from "prop-types";

const GatePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { gate_id } = useParams();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classes,
    gateData,
    members,
    loading: classesLoading,
    error,
    fetchClassesByGate,
    fetchGate,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    toggleFavoriteClass,
    updateMemberRoleInClass,
  } = useClasses(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingGate, setEditingGate] = useState(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    visibility: "public",
    is_public: true,
    gate_id,
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
    tags: [],
  });
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSetSearchQuery = useMemo(() => debounce((value) => setSearchQuery(value), 300), []);

  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token || !gate_id) {
        showNotification("Authentication or gate ID required.", "error");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([fetchGate(gate_id, signal), fetchClassesByGate(gate_id, {}, signal)]);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load gate or classes", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, gate_id, fetchGate, fetchClassesByGate, showNotification]
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

  const filteredClasses = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return classes.filter((cls) => {
      const matchesSearch =
        cls.name?.toLowerCase().includes(lowerSearchQuery) ||
        cls.description?.toLowerCase().includes(lowerSearchQuery);
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return cls.access?.is_public;
      if (quickFilter === "private") return !cls.access?.is_public;
      if (quickFilter === "favorited") return cls.is_favorited;
      return true;
    });
  }, [classes, quickFilter, searchQuery]);

  const handleOpenCreateClass = useCallback(() => {
    setCreateClassDialogOpen(true);
  }, []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateClassDialogOpen(false);
    setPopupClass({
      name: "",
      description: "",
      visibility: "public",
      is_public: true,
      gate_id,
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
      tags: [],
    });
  }, [gate_id]);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass(gate_id, popupClass);
      setCreateClassDialogOpen(false);
      showNotification("Class created successfully!", "success");
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [popupClass, createNewClass, navigate, showNotification, gate_id]);

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

  const handleAddMember = useCallback(
    async (classId, memberData) => {
      setActionLoading(true);
      try {
        const cls = classes.find((c) => c.class_id === classId);
        if (cls?.members?.length >= cls?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToClass(classId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToClass, showNotification, classes]
  );

  const handleRemoveMember = useCallback(
    async (classId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromClass(classId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromClass, showNotification]
  );

  const handleUpdateMemberRole = useCallback(
    async (classId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRoleInClass(classId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRoleInClass, showNotification]
  );

  const handleFavoriteToggle = useCallback(
    async (classId, isFavorited) => {
      setActionLoading(true);
      try {
        await toggleFavoriteClass(classId, isFavorited);
        showNotification(
          isFavorited ? "Removed from favorites!" : "Added to favorites!",
          "success"
        );
      } catch (err) {
        showNotification(err.message || "Failed to toggle favorite", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [toggleFavoriteClass, showNotification]
  );

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
  }, []);

  if (authLoading || classesLoading || isLoading) {
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
            onClick={handleOpenCreateClass}
            startIcon={<Add />}
            sx={{
              ...actionButtonStyles,
              [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
            }}
            aria-label="Create a new class"
            disabled={actionLoading || classesLoading}
          >
            Create Class
          </Button>
        </ProfileHeader>
        <Box sx={{ my: 2 }}>
          <Typography variant="h4">{gateData?.name || "Gate"}</Typography>
          <Typography variant="body1" color="text.secondary">
            {gateData?.description || "No description available."}
          </Typography>
          <Button
            onClick={() => handleFavoriteToggle(gateData?.gate_id, gateData?.is_favorited)}
            startIcon={gateData?.is_favorited ? <Star color="warning" /> : <Star />}
            sx={{ mt: 2 }}
            aria-label={gateData?.is_favorited ? "Remove from favorites" : "Add to favorites"}
            disabled={actionLoading}
          >
            {gateData?.is_favorited ? "Remove from Favorites" : "Add to Favorites"}
          </Button>
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
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleAddMember={handleAddMember}
          handleRemoveMember={handleRemoveMember}
          handleFavorite={handleFavoriteToggle}
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
        disabled={actionLoading || classesLoading}
        gates={[{ gate_id, name: gateData?.name || "Current Gate" }]}
        fixedGateId={gate_id}
      />
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classItem={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
          disabled={actionLoading || classesLoading}
          gates={[{ gate_id, name: gateData?.name || "Current Gate" }]}
          fixedGateId={gate_id}
        />
      )}
      {editingGate && (
        <GateFormDialog
          open={true}
          title="Edit Gate"
          gate={editingGate}
          setGate={setEditingGate}
          onSave={() => {} /* Implement if needed */}
          onCancel={() => setEditingGate(null)}
          disabled={actionLoading}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Members"
        gateId={gate_id}
        token={token}
        onSave={() => {}}
        onCancel={() => setMemberDialogOpen(false)}
        disabled={actionLoading}
        members={members}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class? This action cannot be undone."
        disabled={actionLoading}
      />
    </AppLayout>
  );
};

GatePage.propTypes = {
  navigate: PropTypes.func,
  gate_id: PropTypes.string,
  token: PropTypes.string,
  authData: PropTypes.object,
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(GatePage);