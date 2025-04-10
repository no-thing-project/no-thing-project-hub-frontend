import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
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
    error,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    likeExistingBoard,
    unlikeExistingBoard,
  } = useBoards(token, handleLogout, navigate);

  const [editingBoard, setEditingBoard] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "restricted",
    is_group: false,
    is_personal: true,
    tags: [],
    settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11 },
    gate_id: null,
    class_id: null,
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBoardsList();
  }, [isAuthenticated, fetchBoardsList]);

  useEffect(() => {
    if (error) setErrorMessage(error);
  }, [error]);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (quickFilter === "all") return true;
      if (quickFilter === "public") return board.is_public;
      if (quickFilter === "private") return !board.is_public;
      if (quickFilter === "liked") {
        const isLiked = localLikes[board.board_id] !== undefined
          ? localLikes[board.board_id]
          : board.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
        return isLiked;
      }
      if (quickFilter === "personal") return board.is_personal;
      if (quickFilter === "group") return board.is_group;
      return true;
    });
  }, [boards, quickFilter, searchQuery, localLikes, authData]);

  const validateBoardData = useCallback((boardData) => {
    if (!boardData.name.trim()) return "Board name is required";
    if (boardData.is_personal && boardData.is_group) return "Board cannot be both personal and group";
    if (boardData.settings.tweet_cost < 0 || boardData.settings.tweet_cost > 100) return "Tweet cost must be between 0 and 100";
    if (boardData.settings.like_cost < 0 || boardData.settings.like_cost > 100) return "Like cost must be between 0 and 100";
    if (boardData.settings.points_to_creator < 0 || boardData.settings.points_to_creator > 100) return "Points to creator must be between 0 and 100";
    if (boardData.settings.max_members < 1) return "Max members must be at least 1";
    return "";
  }, []);

  const handleOpenCreateBoard = useCallback(() => {
    setPopupBoard({
      name: "",
      description: "",
      visibility: "restricted",
      is_group: false,
      is_personal: true,
      tags: [],
      settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11 },
      gate_id: null,
      class_id: null,
    });
    setErrorMessage("");
    setCreateDialogOpen(true);
  }, []);

  const handleCancelCreateBoard = useCallback(() => {
    setCreateDialogOpen(false);
    setErrorMessage("");
  }, []);

  const handleCreateBoard = useCallback(async () => {
    const validationError = validateBoardData(popupBoard);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    try {
      const createdBoard = await createNewBoard(popupBoard);
      setSuccess("Board created successfully!");
      setCreateDialogOpen(false);
      setPopupBoard({
        name: "",
        description: "",
        visibility: "restricted",
        is_group: false,
        is_personal: true,
        tags: [],
        settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11 },
        gate_id: null,
        class_id: null,
      });
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create board");
    }
  }, [popupBoard, createNewBoard, navigate, validateBoardData]);

  const handleUpdateBoard = useCallback(async () => {
    const validationError = validateBoardData(editingBoard);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    try {
      await updateExistingBoard(editingBoard.board_id, null, null, editingBoard);
      setSuccess("Board updated successfully!");
      setEditingBoard(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update board");
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList, validateBoardData]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, null);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete board");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [boardToDelete, deleteExistingBoard, fetchBoardsList]);

  const handleLike = useCallback(
    async (board_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [board_id]: optimisticLiked }));
      try {
        if (isLiked) await unlikeExistingBoard(board_id);
        else await likeExistingBoard(board_id);
        setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
        await fetchBoardsList();
        setLocalLikes((prev) => ({ ...prev, [board_id]: undefined }));
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} board`);
      }
    },
    [likeExistingBoard, unlikeExistingBoard, fetchBoardsList]
  );

  const handleCloseSnackbar = useCallback(() => {
    setSuccess("");
    setErrorMessage("");
  }, []);

  if (authLoading || boardsLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            variant="contained"
            onClick={handleOpenCreateBoard}
            startIcon={<Add />}
            sx={actionButtonStyles}
            aria-label="Create new board"
          >
            Create Board
          </Button>
        </ProfileHeader>
      </Box>

      <BoardsFilters
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        additionalFilters={["personal", "group"]}
      />

      <BoardsGrid
        filteredBoards={filteredBoards}
        localLikes={localLikes}
        handleLike={handleLike}
        setEditingBoard={setEditingBoard}
        setBoardToDelete={setBoardToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        navigate={navigate}
      />

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

      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert severity="error" sx={{ width: "100%" }}>{errorMessage}</Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default memo(BoardsPage);