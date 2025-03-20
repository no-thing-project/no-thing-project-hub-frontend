// src/pages/ClassesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Typography, Snackbar, Alert } from "@mui/material";
import CreateModal from "../components/Modals/CreateModal";
import { useClasses } from "../hooks/useClasses";

const ClassesPage = ({ currentUser, onLogout, token }) => {
  const navigate = useNavigate();
  const { classes, loading, error, fetchAllClasses } = useClasses(token, onLogout, navigate);
  const [openModal, setOpenModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchAllClasses();
  }, [fetchAllClasses]);

  const handleCreateSuccess = () => {
    fetchAllClasses();
    setSuccess("Class created successfully!");
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ClassesSection
        currentUser={currentUser}
        classes={classes}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="class"
        token={token}
        onSuccess={handleCreateSuccess}
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

export default ClassesPage;