// src/pages/GatesPage.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout";
import GatesSection from "../sections/GatesSection/GatesSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Button, Typography } from "@mui/material";
import CreateModal from "../components/CreateModal/CreateModal";
import { useGates } from "../hooks/useGates";

const GatesPage = ({ currentUser, onLogout, token }) => {
  const { gates, loading, error, fetchGatesList } = useGates(token);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchGatesList();
  }, [fetchGatesList]);

  const handleCreateSuccess = () => {
    fetchGatesList();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <GatesSection
        currentUser={currentUser}
        gates={gates}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="gate"
        token={token}
        onSuccess={handleCreateSuccess}
      />
    </AppLayout>
  );
};

export default GatesPage;