import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog"; // Передбачається, що цей компонент існує
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";
import { useNotification } from "../context/NotificationContext";

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
    // Додаємо методи для лайків, якщо вони є в API
    // likeClassById,
    // unlikeClassById,
  } = useClasses(token, handleLogout, navigate);

  const [editingClass, setEditingClass] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchClassesList();
  }, [isAuthenticated, fetchClassesList]);

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return classItem.is_public;
    if (quickFilter === "private") return !classItem.is_public;
    if (quickFilter === "liked") {
      const isLiked =
        localLikes[classItem.class_id] !== undefined ? localLikes[classItem.class_id] : classItem.is_liked;
      return isLiked;
    }
    return true;
  });

  const handleOpenCreateClass = () => {
    setPopupClass({ name: "", description: "", visibility: "Public" });
    setCreateDialogOpen(true);
  };

  const handleCancelCreateClass = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      const createdClass = await createNewClass({
        name: popupClass.name,
        description: popupClass.description,
        is_public: popupClass.visibility === "Public",
      });
      setSuccess("Class created successfully!");
      setCreateDialogOpen(false);
      setPopupClass({ name: "", description: "", visibility: "Public" });
      navigate(`/class/${createdClass.class_id}`);
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0] || err.message || "Failed to create class";
      showNotification(errorMsg, "error");
    }
  }, [popupClass, createNewClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      await updateExistingClass(editingClass.class_id, {
        name: editingClass.name,
        description: editingClass.description,
        is_public: editingClass.visibility === "Public",
      });
      setSuccess("Class updated successfully!");
      setEditingClass(null);
      await fetchClassesList();
    } catch (err) {
      showNotification(err.response?.data?.errors?.[0] || "Failed to update class", "error");
    }
  }, [editingClass, updateExistingClass, fetchClassesList, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    try {
      await deleteExistingClass(classToDelete);
      setSuccess("Class deleted successfully!");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      await fetchClassesList();
    } catch (err) {
      showNotification(err.response?.data?.errors?.[0] || "Failed to delete class", "error");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  }, [classToDelete, deleteExistingClass, fetchClassesList, showNotification]);

  const handleLike = useCallback(
    async (class_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [class_id]: optimisticLiked }));
      try {
        // Якщо у вас є методи likeClassById та unlikeClassById, розкоментуйте їх
        // if (isLiked) {
        //   await unlikeClassById(class_id);
        // } else {
        //   await likeClassById(class_id);
        // }
        setSuccess(`Class ${isLiked ? "unliked" : "liked"} successfully!`);
        await fetchClassesList();
        setLocalLikes({});
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [class_id]: isLiked }));
        showNotification(`Failed to ${isLiked ? "unlike" : "like"} class`, "error");
      }
    },
    [fetchClassesList, showNotification] // Додайте likeClassById, unlikeClassById, якщо вони будуть
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || classesLoading;
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle="Classes">
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button variant="contained" onClick={handleOpenCreateClass} startIcon={<Add />} sx={actionButtonStyles}>
            Create Class
          </Button>
        </ProfileHeader>
      </Box>

      <ClassesFilters
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <ClassesGrid
        filteredClasses={filteredClasses}
        localLikes={localLikes}
        handleLike={handleLike}
        setEditingClass={setEditingClass}
        setClassToDelete={setClassToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        navigate={navigate}
      />

      <ClassFormDialog
        open={createDialogOpen}
        title="Create New Class"
        classData={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
      />

      {editingClass && (
        <ClassFormDialog
          open={Boolean(editingClass)}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
      />
    </AppLayout>
  );
};

export default ClassesPage;