import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassSection from "../sections/ClassSection/ClassSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal";
import { useClasses } from "../hooks/useClasses";
import { useBoards } from "../hooks/useBoards";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";

const ClassPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { class_id } = useParams();

  const {
    classData,
    members,
    gateInfo,
    fetchClass,
    fetchClassMembersList,
    updateExistingClass,
    updateClassStatusById,
    deleteExistingClass,
    loading: classLoading,
    error: classError,
  } = useClasses(token, handleLogout, navigate);

  const {
    createNewBoardInClass,
    loading: boardsLoading,
    error: boardsError,
  } = useBoards(token, handleLogout, navigate);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [success, setSuccess] = useState("");

  const loadClassData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!class_id || !token) {
      showNotification("Class ID or authentication missing.", "error");
      return;
    }

    try {
      const [classResult, membersResult] = await Promise.all([
        fetchClass(class_id, signal),
        fetchClassMembersList(class_id, signal),
      ]);
      console.log("Class data:", classResult);
      console.log("Members:", membersResult);
      console.log("Boards from classData:", classResult.boards);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading class data:", err);
        showNotification(err.message || "Failed to load class data.", "error");
      }
    }

    return () => controller.abort();
  }, [class_id, token, fetchClass, fetchClassMembersList, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadClassData();
  }, [loadClassData, isAuthenticated]);

  const handleCreateBoard = useCallback(
    async (boardData) => {
      try {
        const newBoard = await createNewBoardInClass(class_id, boardData);
        if (newBoard) {
          setSuccess("Board created successfully!");
          setOpenCreateModal(false);
          await loadClassData();
        }
      } catch (err) {
        showNotification("Failed to create board.", "error");
      }
    },
    [class_id, createNewBoardInClass, loadClassData, showNotification]
  );

  const handleUpdateClass = useCallback(
    async (classData) => {
      try {
        const updatedClass = await updateExistingClass(class_id, classData);
        if (updatedClass) {
          setSuccess("Class updated successfully!");
          setOpenUpdateModal(false);
        }
      } catch (err) {
        showNotification("Failed to update class.", "error");
      }
    },
    [class_id, updateExistingClass, showNotification]
  );

  const handleDeleteClass = useCallback(async () => {
    try {
      await deleteExistingClass(class_id);
      setSuccess("Class deleted successfully!");
      navigate("/classes");
    } catch (err) {
      showNotification("Failed to delete class.", "error");
    }
  }, [class_id, deleteExistingClass, navigate, showNotification]);

  const handleStatusUpdate = useCallback(
    async (statusData) => {
      try {
        const gateId = gateInfo?.gate_id || null;
        await updateClassStatusById(gateId, class_id, statusData);
        setSuccess("Class status updated successfully!");
        await fetchClass(class_id);
      } catch (err) {
        showNotification("Failed to update class status.", "error");
      }
    },
    [class_id, gateInfo, updateClassStatusById, fetchClass, showNotification]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || classLoading || boardsLoading;
  const error = classError || boardsError;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) showNotification(error, "error");
  if (!classData) showNotification("Class not found", "error");

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ClassSection
        currentUser={authData}
        classData={classData}
        boards={classData.boards || []}
        members={members}
        gateInfo={gateInfo}
        token={token}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={() => setOpenUpdateModal(true)}
        onDelete={handleDeleteClass}
        onStatusUpdate={handleStatusUpdate}
      />
      <CreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        entityType="board"
        token={token}
        classId={class_id}
        onSuccess={handleCreateBoard}
        onLogout={handleLogout}
        navigate={navigate}
      />
      <UpdateModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        entityType="class"
        entityData={classData}
        token={token}
        onSuccess={handleUpdateClass}
        onLogout={handleLogout}
        navigate={navigate}
      />
    </AppLayout>
  );
};

export default ClassPage;