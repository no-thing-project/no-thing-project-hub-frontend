// src/pages/BoardsPage.jsx
import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout";
import BoardsSection from "../sections/BoardsSection/BoardsSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { Typography } from "@mui/material";
import CreateModal from "../components/CreateModal/CreateModal";
import { useBoards } from "../hooks/useBoards";

const BoardsPage = ({ currentUser, onLogout, token }) => {
  const { boards, loading, error, fetchBoardsList } = useBoards(token);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchBoardsList();
  }, [fetchBoardsList]);

  const handleCreateSuccess = () => {
    fetchBoardsList();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <BoardsSection
        currentUser={currentUser}
        boards={boards}
        boardClasses={{}}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="board"
        token={token}
        onSuccess={handleCreateSuccess}
      />
    </AppLayout>
  );
};

export default BoardsPage;