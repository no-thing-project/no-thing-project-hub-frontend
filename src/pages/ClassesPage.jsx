import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton, useTheme } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import { useClasses } from "../hooks/useClasses";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { debounce } from "lodash";
import PropTypes from "prop-types";

const ClassesPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classes,
    loading: classesLoading,
    error,
    fetchClassesList,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    toggleFavoriteClass,
    updateMemberRole,
  } = useClasses(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(
    token,
    handleLogout,
    navigate
  );

  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    is_public: false,
    visibility: "private",
    gate_id: "",
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
        await Promise.all([
          fetchClassesList({}, signal),
          fetchGatesList({ visibility: "public" }, signal),
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load data", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchClassesList, fetchGatesList, showNotification]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (error) showNotification(error, "error");
    if (gatesError) showNotification(gatesError, "error");
  }, [error, gatesError, showNotification]);

  const filteredClasses = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return classes
      .map((classItem) => {
        const gate = gates.find((g) => g.gate_id === classItem.gate_id);
        return {
          ...classItem,
          gateName: gate ? gate.name : "No Gate",
        };
      })
      .filter((classItem) => {
        const matchesSearch =
          classItem.name?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.description?.toLowerCase().includes(lowerSearchQuery) ||
          classItem.gateName.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        if (quickFilter === "all") return true;
        if (quickFilter === "public") return classItem.is_public;
        if (quickFilter === "private") return !classItem.is_public;
        if (quickFilter === "favorited") return classItem.is_favorited;
        return true;
      });
  }, [classes, gates, quickFilter, searchQuery]);

  const handleOpenCreateClass = useCallback(() => setCreateDialogOpen(true), []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupClass({
      name: "",
      description: "",
      is_public: false,
      visibility: "private",
      gate_id: "",
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
  }, []);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      const createdClass = await createNewClass(popupClass);
      setCreateDialogOpen(false);
      setPopupClass({
        name: "",
        description: "",
        is_public: false,
        visibility: "private",
        gate_id: "",
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
      showNotification("Class created successfully!", "success");
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create class", "error");
    }
  }, [popupClass, createNewClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    }
  }, [editingClass, updateExistingClass, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    try {
      await deleteExistingClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification("Class deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  }, [classToDelete, deleteExistingClass, showNotification]);

  const handleAddMember = useCallback(
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

  const handleRemoveMember = useCallback(
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

  const handleUpdateMemberRole = useCallback(
    async (classId, username, newRole) => {
      try {
        await updateMemberRole(classId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateMemberRole, showNotification]
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

  if (authLoading || classesLoading || gatesLoading || isLoading) {
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
          >
            Create Class
          </Button>
        </ProfileHeader>
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
          handleRemoveMember={handleRemoveMember}
          navigate={navigate}
          currentUser={authData}
        />
      </Box>
      <ClassFormDialog
        open={createDialogOpen}
        title="Create New Class"
        classItem={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
        disabled={classesLoading || gatesLoading}
        gates={gates}
      />
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classItem={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
          disabled={classesLoading || gatesLoading}
          gates={gates}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Members"
        classId={selectedClassId}
        token={token}
        onSave={() => {}}
        onCancel={handleCancelMemberDialog}
        disabled={classesLoading}
        members={classes.find((c) => c.class_id === selectedClassId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class? This action cannot be undone."
        disabled={classesLoading}
      />
    </AppLayout>
  );
};

ClassesPage.propTypes = {
  navigate: PropTypes.func,
  token: PropTypes.string,
  authData: PropTypes.object,
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(ClassesPage);