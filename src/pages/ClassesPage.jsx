import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassesSection from "../sections/ClassesSection/ClassesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Button, Typography } from "@mui/material";
import CreateModal from "../components/CreateModal/CreateModal";
import { useClasses } from "../hooks/useClasses";

const ClassesPage = ({ currentUser, onLogout, token }) => {
  const navigate = useNavigate();
  const { classes, loading, error, fetchAllClasses } = useClasses(token, onLogout, navigate);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchAllClasses();
  }, [fetchAllClasses]);

  const handleCreateSuccess = () => {
    fetchAllClasses();
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
      />
    </AppLayout>
  );
};

export default ClassesPage;