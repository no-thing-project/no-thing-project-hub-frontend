// src/pages/ClassPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassSection from "../sections/ClassSection/ClassSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import CreateModal from "../components/Modals/CreateModal";
import UpdateModal from "../components/Modals/UpdateModal";
import { useClasses } from "../hooks/useClasses";
import { useBoards } from "../hooks/useBoards";
import { Snackbar, Alert } from "@mui/material";
import useAuth from "../hooks/useAuth";

const ClassPage = () => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState("");

  const loadClassData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!class_id || !token) {
      setErrorMessage("Class ID or authentication missing.");
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
        setErrorMessage(err.message || "Failed to load class data.");
      }
    }

    return () => controller.abort();
  }, [class_id, token, fetchClass, fetchClassMembersList]);

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
          await loadClassData(); // Оновлюємо classData, щоб отримати оновлений список дощок
        }
      } catch (err) {
        setErrorMessage("Failed to create board.");
      }
    },
    [class_id, createNewBoardInClass, loadClassData]
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
        setErrorMessage("Failed to update class.");
      }
    },
    [class_id, updateExistingClass]
  );

  const handleDeleteClass = useCallback(async () => {
    try {
      await deleteExistingClass(class_id);
      setSuccess("Class deleted successfully!");
      navigate("/classes");
    } catch (err) {
      setErrorMessage("Failed to delete class.");
    }
  }, [class_id, deleteExistingClass, navigate]);

  const handleStatusUpdate = useCallback(
    async (statusData) => {
      try {
        const gateId = gateInfo?.gate_id || null;
        await updateClassStatusById(gateId, class_id, statusData);
        setSuccess("Class status updated successfully!");
        await fetchClass(class_id);
      } catch (err) {
        setErrorMessage("Failed to update class status.");
      }
    },
    [class_id, gateInfo, updateClassStatusById, fetchClass]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || classLoading || boardsLoading;
  const error = classError || boardsError || errorMessage;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;
  if (!classData) return <ErrorMessage message="Class not found" />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ClassSection
        currentUser={authData}
        classData={classData}
        boards={classData.boards || []} // Використовуємо boards із classData
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
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default ClassPage;