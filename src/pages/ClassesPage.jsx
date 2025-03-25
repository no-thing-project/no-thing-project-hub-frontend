import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import CreateModal from "../components/Modals/CreateModal";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";

const ClassesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { classes, loading, error, fetchClassesList } = useClasses(token, handleLogout, navigate);
  const [openModal, setOpenModal] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchClassesList();
  }, [fetchClassesList, isAuthenticated]);

  const handleCreateSuccess = useCallback(() => {
    fetchClassesList();
    setSuccess("Class created successfully!");
  }, [fetchClassesList]);

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) showNotification(error, "error");

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ClassesSection
        currentUser={authData}
        classes={classes}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="class"
        token={token}
        onSuccess={handleCreateSuccess}
        onLogout={handleLogout}
        navigate={navigate}
      />
    </AppLayout>
  );
};

export default ClassesPage;