import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useClasses } from "../hooks/useClasses";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { debounce } from "lodash";

const ClassesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    classes,
    loading: classesLoading,
    fetchClassesList,
    createNewClass,
    updateExistingClass,
    deleteExistingClass,
  } = useClasses(token, handleLogout, navigate);
  const { gates, fetchGatesList } = useGates(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    is_public: true,
    type: "personal",
    gate_id: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadClassesData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      showNotification("Authentication missing.", "error");
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    try {
      await Promise.all([
        fetchClassesList({}, controller.signal),
        fetchGatesList({}, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load classes", "error");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [isAuthenticated, token, fetchClassesList, fetchGatesList, showNotification]);

  useEffect(() => {
    loadClassesData();
  }, [loadClassesData]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const matchesSearch =
        classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (classItem.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      switch (quickFilter) {
        case "all":
          return true;
        case "public":
          return classItem.is_public;
        case "private":
          return !classItem.is_public;
        case "personal":
          return classItem.type === "personal";
        case "group":
          return classItem.type === "group";
        case "gate":
          return !!classItem.gate_id;
        default:
          return true;
      }
    });
  }, [classes, quickFilter, searchQuery]);

  const handleOpenCreateClass = () => setCreateDialogOpen(true);
  const handleCancelCreateClass = () => {
    setCreateDialogOpen(false);
    setPopupClass({ name: "", description: "", is_public: true, type: "personal", gate_id: null });
  };

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const createdClass = await createNewClass({
        name: popupClass.name,
        description: popupClass.description,
        is_public: popupClass.is_public,
        type: popupClass.type,
        gate_id: popupClass.gate_id,
      });
      setCreateDialogOpen(false);
      setPopupClass({ name: "", description: "", is_public: true, type: "personal", gate_id: null });
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
      await updateExistingClass(editingClass.class_id, {
        name: editingClass.name,
        description: editingClass.description,
        is_public: editingClass.is_public,
        type: editingClass.type,
        gate_id: editingClass.gate_id,
      });
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
      await loadClassesData();
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, loadClassesData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification("Class deleted successfully!", "success");
      await loadClassesData();
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [classToDelete, deleteExistingClass, loadClassesData, showNotification]);

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSearchQuery("");
  };

  if (authLoading || classesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
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
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            onClick={handleOpenCreateClass}
            startIcon={<Add />}
            sx={actionButtonStyles}
            disabled={actionLoading}
          >
            Create Class
          </Button>
        </ProfileHeader>
        <ClassesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          additionalFilters={["personal", "group", "gate"]}
          onReset={handleResetFilters}
        />
        <ClassesGrid
          filteredClasses={filteredClasses}
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          navigate={navigate}
        />
      </Box>
      <ClassFormDialog
        open={createDialogOpen}
        title="Create New Class"
        classData={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
        token={token}
        gates={gates}
        disabled={actionLoading}
      />
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
          token={token}
          gates={gates}
          disabled={actionLoading}
        />
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class?"
        disabled={actionLoading}
      />
    </AppLayout>
  );
};

export default React.memo(ClassesPage);