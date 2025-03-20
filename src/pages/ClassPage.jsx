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
import { Snackbar, Alert } from "@mui/material";

const ClassPage = ({ currentUser, onLogout, token }) => {
  const { class_id } = useParams(); // Removed gate_id since it's not needed
  const navigate = useNavigate();
  const {
    classData,
    fetchClass,
    updateClassStatus,
    deleteClass,
    fetchClassMembers,
    loading,
    error,
  } = useClasses(token, onLogout, navigate);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadClass = async () => {
      try {
        await fetchClass(class_id);
        await fetchClassMembers(class_id);
      } catch (err) {
        console.error("Error loading class:", err);
      }
    };
    if (class_id && token) {
      loadClass();
    }
  }, [class_id, token, fetchClass, fetchClassMembers]);

  const handleCreateSuccess = () => {
    fetchClass(class_id);
    setSuccess("Board created successfully!");
  };

  const handleUpdateSuccess = () => {
    fetchClass(class_id);
    setSuccess("Class updated successfully!");
  };

  const handleDelete = useCallback(async () => {
    try {
      await deleteClass(class_id);
      setSuccess("Class deleted successfully!");
      navigate("/classes");
    } catch (err) {
      setErrorMessage("Failed to delete class");
    }
  }, [deleteClass, class_id, navigate]);

  const handleStatusUpdate = useCallback(async (statusData) => {
    try {
      await updateClassStatus(class_id, statusData);
      setSuccess("Class status updated successfully!");
    } catch (err) {
      setErrorMessage("Failed to update class status");
    }
  }, [updateClassStatus, class_id]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!classData) return <ErrorMessage message="Class not found" />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ClassSection
        currentUser={currentUser}
        classData={classData}
        token={token}
        onCreate={() => setOpenCreateModal(true)}
        onUpdate={() => setOpenUpdateModal(true)}
        onDelete={handleDelete}
        onStatusUpdate={handleStatusUpdate}
      />
      <CreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        entityType="board"
        token={token}
        classId={class_id}
        onSuccess={handleCreateSuccess}
        onLogout={onLogout}
        navigate={navigate}
      />
      <UpdateModal
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        entityType="class"
        entityData={classData}
        token={token}
        onSuccess={handleUpdateSuccess}
        onLogout={onLogout}
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