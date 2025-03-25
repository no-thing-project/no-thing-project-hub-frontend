import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Snackbar, Alert } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useBoards } from "../hooks/useBoards";
import useAuth from "../hooks/useAuth";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles } from "../styles/BaseStyles";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import BoardsFilters from "../components/Boards/BoardsFilters";
import BoardsGrid from "../components/Boards/BoardsGrid";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    boards,
    loading: boardsLoading,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    likeBoardById,
    unlikeBoardById,
  } = useBoards(token, handleLogout, navigate);

  const [editingBoard, setEditingBoard] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  // Стан для фільтрів та пошуку
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  // Стан для оптимістичних змін лайку
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBoardsList();
  }, [isAuthenticated, fetchBoardsList]);

  // Фільтруємо дошки
  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return board.is_public;
    if (quickFilter === "private") return !board.is_public;
    if (quickFilter === "liked") {
      const isLiked =
        localLikes[board.board_id] !== undefined ? localLikes[board.board_id] : board.is_liked;
      return isLiked;
    }
    return true;
  });

  // Handlers для створення, оновлення та видалення дошок
  const handleOpenCreateBoard = () => {
    setPopupBoard({ name: "", description: "", visibility: "Public" });
    setErrorMessage("");
    setCreateDialogOpen(true);
  };

  const handleCancelCreateBoard = () => {
    setCreateDialogOpen(false);
    setErrorMessage("");
  };

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      setErrorMessage("Board name is required!");
      return;
    }
    try {
      const createdBoard = await createNewBoard({
        name: popupBoard.name,
        description: popupBoard.description,
        is_public: popupBoard.visibility === "Public",
      });
      setSuccess("Board created successfully!");
      setCreateDialogOpen(false);
      setPopupBoard({ name: "", description: "", visibility: "Public" });
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to create board");
    }
  }, [popupBoard, createNewBoard, navigate]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      setErrorMessage("Board name is required!");
      return;
    }
    try {
      await updateExistingBoard(editingBoard.board_id, null, null, {
        name: editingBoard.name,
        description: editingBoard.description,
        is_public: editingBoard.visibility === "Public",
      });
      setSuccess("Board updated successfully!");
      setEditingBoard(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to update board");
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, null);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to delete board");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [boardToDelete, deleteExistingBoard, fetchBoardsList]);

  const handleLike = useCallback(
    async (board_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [board_id]: optimisticLiked }));
      try {
        if (isLiked) {
          await unlikeBoardById(board_id);
        } else {
          await likeBoardById(board_id);
        }
        setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
        await fetchBoardsList();
        setLocalLikes({});
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} board`);
      }
    },
    [likeBoardById, unlikeBoardById, fetchBoardsList]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || boardsLoading;
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle={"Boards"}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button variant="contained" onClick={handleOpenCreateBoard} startIcon={<Add />} sx={actionButtonStyles}>
            Create Board
          </Button>
        </ProfileHeader>
      </Box>

      {/* Компонент для фільтрів і пошуку */}
      <BoardsFilters
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Компонент-сітка з картками */}
      <BoardsGrid
        filteredBoards={filteredBoards}
        localLikes={localLikes}
        handleLike={handleLike}
        setEditingBoard={setEditingBoard}
        setBoardToDelete={setBoardToDelete}
        navigate={navigate}
      />

      {/* Діалоги */}
      <BoardFormDialog
        open={createDialogOpen}
        title="Create New Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        errorMessage={errorMessage}
      />

      {editingBoard && (
        <BoardFormDialog
          open={Boolean(editingBoard)}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          errorMessage={errorMessage}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }} role="alert">
          {errorMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default BoardsPage;
