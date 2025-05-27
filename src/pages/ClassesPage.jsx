import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import AppLayout from "../components/Layout/AppLayout";
import { useClasses } from "../hooks/useClasses";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import Filters from "../components/Filters/Filters";
import Grids from "../components/Grids/Grids";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import Card from "../components/Cards/CardMain";
import { actionButtonStyles, gridStyles, skeletonStyles, containerStyles } from "../styles/BaseStyles";

const DEFAULT_CLASS = {
  name: "",
  description: "",
  is_public: false,
  visibility: "private",
  gate_id: "",
  type: "personal",
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
};

/**
 * ClassesPage component for managing and displaying user classes.
 */
const ClassesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classes,
    loading: classesLoading,
    error: classesError,
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [popupClass, setPopupClass] = useState(DEFAULT_CLASS);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All Classes" },
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "favorited", label: "Favorited" },
      { value: "group", label: "Group" },
      { value: "personal", label: "Personal" },
    ],
    []
  );

  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Authentication required.", "error");
        setIsLoading(false);
        navigate("/login", { state: { from: "/classes" } });
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchClassesList({}, signal),
          fetchGatesList({ visibility: "public" }, signal),
        ]);
        setRetryCount(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Load data error:", err);
          const errorMessage = err.message || "Failed to load data. Please try again.";
          showNotification(errorMessage, "error");
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => setRetryCount((prev) => prev + 1), delay);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchClassesList, fetchGatesList, showNotification, retryCount, navigate]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (classesError) showNotification(classesError, "error");
    if (gatesError) showNotification(gatesError, "error");
  }, [classesError, gatesError, showNotification]);

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
          (classItem.name || "").toLowerCase().includes(lowerSearchQuery) ||
          (classItem.description || "").toLowerCase().includes(lowerSearchQuery) ||
          (classItem.gateName || "").toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        switch (quickFilter) {
          case "public":
            return classItem.is_public;
          case "private":
            return !classItem.is_public;
          case "favorited":
            return classItem.is_favorited;
          case "group":
            return classItem.type === "group";
          case "personal":
            return classItem.type !== "group";
          default:
            return true;
        }
      });
  }, [classes, gates, quickFilter, searchQuery]);

  const handleOpenCreateClass = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCancelCreateClass = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupClass(DEFAULT_CLASS);
  }, []);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass(popupClass);
      setCreateDialogOpen(false);
      setPopupClass(DEFAULT_CLASS);
      showNotification("Class created successfully!", "success");
      navigate(`/class/${createdClass.class_id}`);
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
      setEditDialogOpen(false);
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

  const handleOpenMemberDialog = useCallback((classId) => {
    setSelectedClassId(classId);
    setMemberDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
    showNotification("Members updated successfully!", "success");
  }, [showNotification]);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedClassId(null);
  }, []);

  const handleAddMember = useCallback(
    async (classId, memberData) => {
      setActionLoading(true);
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
        await updateMemberRole(classId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  const headerData = useMemo(
    () => ({
      type: "page",
      title: "Classes",
      titleAriaLabel: "Classes page",
      shortDescription: "Your Spaces for Focused Learning",
      tooltipDescription:
        "Classes are dedicated spaces within gates for learning and collaboration. Create a class to share knowledge, work on projects, or dive into specific topics with your community.",
    }),
    []
  );

  if (authLoading || classesLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles, maxWidth: "1500px", mx: "auto" }}>
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.header, height: "150px" }} />
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.filter, height: "60px" }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ ...skeletonStyles.card, height: "210px" }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login", { state: { from: "/classes" } });
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles, maxWidth: "1500px", mx: "auto" }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData}>
          <Button
            onClick={handleOpenCreateClass}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles }}
            aria-label="Create a new class"
            disabled={classesLoading || gatesLoading || actionLoading}
          >
            Create Class
          </Button>
        </ProfileHeader>
        <Filters
          type="classes"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />
        <Grids
          items={filteredClasses}
          cardComponent={Card}
          itemKey="class_id"
          gridType="classes"
          handleFavorite={toggleFavoriteClass}
          setEditingItem={(classItem) => {
            setEditingClass(classItem);
            setEditDialogOpen(true);
          }}
          setItemToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleManageMembers={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreateClass}
        />
      </Box>
      <ClassFormDialog
        open={createDialogOpen}
        title="Create New Class"
        classItem={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
        disabled={classesLoading || gatesLoading || actionLoading}
        gates={gates}
        loading={actionLoading}
        aria-labelledby="create-class-dialog"
      />
      {editingClass && (
        <ClassFormDialog
          open={editDialogOpen}
          title="Edit Class"
          classItem={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => {
            setEditDialogOpen(false);
            setEditingClass(null);
          }}
          disabled={classesLoading || gatesLoading || actionLoading}
          gates={gates}
          loading={actionLoading}
          aria-labelledby="edit-class-dialog"
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Members"
        classId={selectedClassId}
        token={token}
        onSave={handleSaveMembers}
        onCancel={handleCancelMemberDialog}
        disabled={classesLoading || actionLoading}
        members={classes.find((c) => c.class_id === selectedClassId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
        loading={actionLoading}
        aria-labelledby="manage-members-dialog"
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class? This action cannot be undone."
        disabled={classesLoading || actionLoading}
        loading={actionLoading}
        aria-labelledby="delete-class-dialog"
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