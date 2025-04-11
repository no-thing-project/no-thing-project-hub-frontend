import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, deleteButtonStyle } from "../styles/BaseStyles";
import GateFormDialog from "../components/Dialogs/GateFormDialog";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import ClassesFilters from "../components/Classes/ClassesFilters";
import ClassesGrid from "../components/Classes/ClassesGrid";

const GatePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { gate_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    gate: gateData,
    members,
    fetchGate,
    fetchGateMembersList,
    updateExistingGate,
    deleteExistingGate,
    likeGateById,
    unlikeGateById,
    addMemberToGate,
    removeMemberFromGate,
    loading: gatesLoading,
  } = useGates(token, handleLogout, navigate);
  const {
    classes,
    fetchClassesByGate,
    createNewClassInGate,
    updateExistingClass,
    deleteExistingClass,
    loading: classesLoading,
  } = useClasses(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingGate, setEditingGate] = useState(null);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [popupClass, setPopupClass] = useState({ name: "", description: "", visibility: "Public" });
  const [editingClass, setEditingClass] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

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
        fetchGateMembersList(gate_id),
        fetchClassesByGate(gate_id, {}, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load gate data.", "error");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [gate_id, token, fetchGate, fetchGateMembersList, fetchClassesByGate, showNotification]);

  useEffect(() => {
    if (isAuthenticated) loadGateData();
  }, [loadGateData, isAuthenticated]);

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const matchesSearch = classItem.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return classItem.is_public;
      if (quickFilter === "private") return !classItem.is_public;
      if (quickFilter === "liked") return localLikes[classItem.class_id] ?? classItem.is_liked;
      return true;
    });
  }, [classes, quickFilter, searchQuery, localLikes]);

  const handleOpenCreateClass = () => setCreateClassDialogOpen(true);
  const handleCancelCreateClass = () => setCreateClassDialogOpen(false);

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) return showNotification("Class name is required!", "error");
    try {
      const newClass = await createNewClassInGate(gate_id, {
        name: popupClass.name,
        description: popupClass.description,
        is_public: popupClass.visibility === "Public",
      });
      setCreateClassDialogOpen(false);
      setPopupClass({ name: "", description: "", visibility: "Public" });
      showNotification("Class created successfully!", "success");
      navigate(`/class/${newClass.class_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create class", "error");
    }
  }, [gate_id, popupClass, createNewClassInGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) return showNotification("Gate name is required!", "error");
    try {
      await updateExistingGate(editingGate.gate_id, {
        name: editingGate.name,
        description: editingGate.description,
        is_public: editingGate.visibility === "Public",
      });
      setEditingGate(null);
      showNotification("Gate updated successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to update gate", "error");
    }
  }, [editingGate, updateExistingGate, loadGateData, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    try {
      await deleteExistingGate(gate_id);
      showNotification("Gate deleted successfully!", "success");
      navigate("/gates");
    } catch (err) {
      showNotification(err.message || "Failed to delete gate", "error");
    }
  }, [gate_id, deleteExistingGate, navigate, showNotification]);

  const handleLikeGate = useCallback(async (isLiked) => {
    try {
      isLiked ? await unlikeGateById(gate_id) : await likeGateById(gate_id);
      showNotification(`Gate ${isLiked ? "unliked" : "liked"} successfully!`, "success");
      await loadGateData();
    } catch (err) {
      showNotification(`Failed to ${isLiked ? "unlike" : "like"} gate`, "error");
    }
  }, [gate_id, likeGateById, unlikeGateById, loadGateData, showNotification]);

  const handleAddMember = useCallback(async (memberData) => {
    try {
      await addMemberToGate(gate_id, memberData);
      showNotification("Member added successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to add member", "error");
    }
  }, [gate_id, addMemberToGate, loadGateData, showNotification]);

  const handleRemoveMember = useCallback(async (memberId) => {
    try {
      await removeMemberFromGate(gate_id, memberId);
      showNotification("Member removed successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to remove member", "error");
    }
  }, [gate_id, removeMemberFromGate, loadGateData, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) return showNotification("Class name is required!", "error");
    try {
      await updateExistingClass(editingClass.class_id, {
        name: editingClass.name,
        description: editingClass.description,
        is_public: editingClass.visibility === "Public",
      });
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    }
  }, [editingClass, updateExistingClass, loadGateData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    try {
      await deleteExistingClass(classToDelete);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      showNotification("Class deleted successfully!", "success");
      await loadGateData();
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  }, [classToDelete, deleteExistingClass, loadGateData, showNotification]);

  if (isLoading || authLoading || gatesLoading || classesLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return navigate("/login") || null;
  if (!gateData) return showNotification("Gate not found", "error") || null;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={handleOpenCreateClass} startIcon={<Add />} sx={actionButtonStyles}>
              Create Class
            </Button>
            <Button
              onClick={() => setEditingGate({ ...gateData, visibility: gateData.is_public ? "Public" : "Private" })}
              startIcon={<Edit />}
              sx={actionButtonStyles}
            >
              Edit Gate
            </Button>
            <Button onClick={handleDeleteGate} color="error" sx={deleteButtonStyle}>
              Delete Gate
            </Button>
          </Box>
        </ProfileHeader>
        <ClassesFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <ClassesGrid
          filteredClasses={filteredClasses}
          localLikes={localLikes}
          setEditingClass={setEditingClass}
          setClassToDelete={setClassToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          navigate={navigate}
        />
      </Box>
      <ClassFormDialog
        open={createClassDialogOpen}
        title="Create New Class"
        classData={popupClass}
        setClass={setPopupClass}
        onSave={handleCreateClass}
        onCancel={handleCancelCreateClass}
      />
      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
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
        />
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteClass}
        message="Are you sure you want to delete this class?"
      />
    </AppLayout>
  );
};

export default GatePage;