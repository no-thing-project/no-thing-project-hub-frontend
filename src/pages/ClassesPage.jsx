// src/pages/ClassesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Typography, Snackbar, Alert } from "@mui/material";
import CreateModal from "../components/Modals/CreateModal";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";

const ClassesPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout } = useAuth(navigate);
  const { classes, loading, error, fetchClassesList } = useClasses(token, handleLogout, navigate);
  const [openModal, setOpenModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchClassesList();
  }, [fetchClassesList]);

  const handleCreateSuccess = () => {
    fetchClassesList();
    setSuccess("Class created successfully!");
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

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