import React, { useState, useCallback, useEffect } from "react";
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
  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);
  const { gate_id } = useParams();

  const {
    gate: gateData,
    members,
    fetchGate,
    fetchGateMembersList,
    updateExistingGate,
    updateGateStatusById,
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
  const [popupClass, setPopupClass] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [editingClass, setEditingClass] = useState(null);
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  const loadGateData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!gate_id || !token) {
      showNotification("Gate ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [gateResult, membersResult, classesResult] = await Promise.all([
        fetchGate(gate_id, signal),
        fetchGateMembersList(gate_id),
        fetchClassesByGate(gate_id, {}, signal),
      ]);
      console.log("Gate data:", gateResult);
      console.log("Members:", membersResult);
      console.log("Classes:", classesResult);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading gate data:", err);
        showNotification(err.message || "Failed to load gate data.", "error");
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [
    gate_id,
    token,
    fetchGate,
    fetchGateMembersList,
    fetchClassesByGate,
    showNotification,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadGateData();
  }, [loadGateData, isAuthenticated]);

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = classItem.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return classItem.is_public;
    if (quickFilter === "private") return !classItem.is_public;
    if (quickFilter === "liked") {
      const isLiked =
        localLikes[classItem.class_id] !== undefined
          ? localLikes[classItem.class_id]
          : classItem.is_liked;
      return isLiked;
    }
    return true;
  });

  const handleOpenCreateClass = () => {
    setPopupClass({ name: "", description: "", visibility: "Public" });
    setCreateClassDialogOpen(true);
  };

  const handleCancelCreateClass = () => {
    setCreateClassDialogOpen(false);
  };

  const handleCreateClass = useCallback(async () => {
    if (!popupClass.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      const newClass = await createNewClassInGate(gate_id, {
        name: popupClass.name,
        description: popupClass.description,
        is_public: popupClass.visibility === "Public",
      });
      setSuccess("Class created successfully!");
      setCreateClassDialogOpen(false);
      setPopupClass({ name: "", description: "", visibility: "Public" });
      navigate(`/class/${newClass.class_id}`); // Перенаправлення на сторінку нового класу
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Failed to create class";
      showNotification(errorMsg, "error");
    }
  }, [gate_id, popupClass, createNewClassInGate, navigate, showNotification]);

  const handleUpdateGate = useCallback(async () => {
    if (!editingGate?.name.trim()) {
      showNotification("Gate name is required!", "error");
      return;
    }
    try {
      await updateExistingGate(editingGate.gate_id, {
        name: editingGate.name,
        description: editingGate.description,
        is_public: editingGate.visibility === "Public",
      });
      setSuccess("Gate updated successfully!");
      setEditingGate(null);
      await loadGateData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to update gate",
        "error"
      );
    }
  }, [editingGate, updateExistingGate, loadGateData, showNotification]);

  const handleDeleteGate = useCallback(async () => {
    try {
      await deleteExistingGate(gate_id);
      setSuccess("Gate deleted successfully!");
      navigate("/gates");
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to delete gate",
        "error"
      );
    }
  }, [deleteExistingGate, gate_id, navigate, showNotification]);

  const handleLikeGate = useCallback(
    async (isLiked) => {
      const optimisticLiked = !isLiked;
      try {
        if (isLiked) {
          await unlikeGateById(gate_id);
        } else {
          await likeGateById(gate_id);
        }
        setSuccess(`Gate ${isLiked ? "unliked" : "liked"} successfully!`);
        await loadGateData();
      } catch (err) {
        showNotification(
          `Failed to ${isLiked ? "unlike" : "like"} gate`,
          "error"
        );
      }
    },
    [likeGateById, unlikeGateById, gate_id, loadGateData, showNotification]
  );

  const handleStatusUpdate = useCallback(
    async (statusData) => {
      try {
        await updateGateStatusById(gate_id, statusData);
        setSuccess("Gate status updated successfully!");
        await loadGateData();
      } catch (err) {
        showNotification("Failed to update gate status.", "error");
      }
    },
    [gate_id, updateGateStatusById, loadGateData, showNotification]
  );

  const handleAddMember = useCallback(
    async (memberData) => {
      try {
        await addMemberToGate(gate_id, memberData);
        setSuccess("Member added successfully!");
        await loadGateData();
      } catch (err) {
        showNotification("Failed to add member.", "error");
      }
    },
    [gate_id, addMemberToGate, loadGateData, showNotification]
  );

  const handleRemoveMember = useCallback(
    async (memberId) => {
      try {
        await removeMemberFromGate(gate_id, memberId);
        setSuccess("Member removed successfully!");
        await loadGateData();
      } catch (err) {
        showNotification("Failed to remove member.", "error");
      }
    },
    [gate_id, removeMemberFromGate, loadGateData, showNotification]
  );

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
      await loadGateData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to update class",
        "error"
      );
    }
  }, [editingClass, updateExistingClass, loadGateData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    if (!classToDelete) return;
    try {
      await deleteExistingClass(classToDelete);
      setSuccess("Class deleted successfully!");
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      await loadGateData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to delete class",
        "error"
      );
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  }, [classToDelete, deleteExistingClass, loadGateData, showNotification]);

  const handleLikeClass = useCallback(
    async (class_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [class_id]: optimisticLiked }));
      try {
        // Якщо у вас є методи likeClassById та unlikeClassById, додайте їх до useClasses і розкоментуйте
        // if (isLiked) {
        //   await unlikeClassById(class_id);
        // } else {
        //   await likeClassById(class_id);
        // }
        setSuccess(`Class ${isLiked ? "unliked" : "liked"} successfully!`);
        await loadGateData();
        setLocalLikes({});
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [class_id]: isLiked }));
        showNotification(
          `Failed to ${isLiked ? "unlike" : "like"} class`,
          "error"
        );
      }
    },
    [loadGateData, showNotification]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  if (isLoading || authLoading || gatesLoading || classesLoading)
    return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (!gateData) {
    showNotification("Gate not found", "error");
    return null;
  }

  return (
    <AppLayout
      currentUser={authData}
      onLogout={handleLogout}
      token={token}
    >
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleOpenCreateClass}
              startIcon={<Add />}
              sx={actionButtonStyles}
            >
              Create Class
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                setEditingGate({
                  gate_id: gateData.gate_id,
                  name: gateData.name,
                  description: gateData.description || "",
                  visibility: gateData.is_public ? "Public" : "Private",
                })
              }
              startIcon={<Edit />}
              sx={actionButtonStyles}
            >
              Edit Gate
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteGate}
              sx={deleteButtonStyle}
            >
              Delete Gate
            </Button>
          </Box>
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
        handleLike={handleLikeClass}
        setEditingClass={setEditingClass}
        setClassToDelete={setClassToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        navigate={navigate}
      />

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
          open={Boolean(editingClass)}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
        />
      )}

      {editingGate && (
        <GateFormDialog
          open={Boolean(editingGate)}
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
        message="Are you sure you want to delete this class? This action cannot be undone."
      />
    </AppLayout>
  );
};

export default GatePage;
