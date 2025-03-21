// src/pages/ClassesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import CreateModal from "../components/Modals/CreateModal";
import { useClasses } from "../hooks/useClasses";
import { Snackbar, Alert } from "@mui/material";
import useAuth from "../hooks/useAuth";

const ClassesPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { classes, loading, error, fetchClassesList } = useClasses(token, handleLogout, navigate);
  const [openModal, setOpenModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage("");
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;

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

export default ClassesPage;