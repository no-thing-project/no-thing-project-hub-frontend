import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Snackbar, Alert } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useBoards } from "../hooks/useBoards";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
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
    setBoards,
    loading: boardsLoading,
    error,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    likeExistingBoard,
    unlikeExistingBoard,
  } = useBoards(token, handleLogout, navigate);
  const { gates, fetchGatesList } = useGates(token, handleLogout, navigate);
  const { classes, fetchClassesList } = useClasses(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "private",
    type: "personal",
    tags: [],
    settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11, tweets_limit_trigger: 111 },
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
    const controller = new AbortController();
    Promise.all([
      fetchBoardsList({}, controller.signal),
      fetchGatesList({}, controller.signal),
      fetchClassesList({}, controller.signal),
    ]).catch((err) => {
      if (err.name !== "AbortError") setErrorMessage(err.message || "Failed to load data");
    });
    return () => controller.abort();
  }, [isAuthenticated, fetchBoardsList, fetchGatesList, fetchClassesList]);

  useEffect(() => {
    if (error) setErrorMessage(error);
  }, [error]);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const matchesSearch =
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      switch (quickFilter) {
        case "all": return true;
        case "public": return board.is_public;
        case "private": return !board.is_public;
        case "liked": return localLikes[board.board_id] ?? board.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
        case "personal": return board.type === "personal";
        case "group": return board.type === "group";
        case "gate": return !!board.gate_id;
        case "class": return !!board.class_id;
        default: return true;
      }
    });
  }, [boards, quickFilter, searchQuery, localLikes, authData]);

  const validateBoardData = useCallback((data) => {
    if (!data.name?.trim()) return "Board name is required";
    if (data.type === "group" && data.visibility === "public" && !data.gate_id && !data.class_id) {
      return "Public group board must have a gate or class";
    }
    const s = data.settings || {};
    if (s.tweet_cost < 0 || s.tweet_cost > 100) return "Tweet cost must be 0-100";
    if (s.like_cost < 0 || s.like_cost > 100) return "Like cost must be 0-100";
    if (s.points_to_creator < 0 || s.points_to_creator > 100) return "Points to creator must be 0-100";
    if (s.max_members < 1) return "Max members must be at least 1";
    if (s.tweets_limit_trigger < 11) return "Tweet limit trigger must be at least 11";
    return "";
  }, []);

  const handleOpenCreateBoard = () => setCreateDialogOpen(true);

  const handleCreateBoard = useCallback(async () => {
    const validationError = validateBoardData(popupBoard);
    if (validationError) return setErrorMessage(validationError);
    try {
      const createdBoard = await createNewBoard(popupBoard);
      setSuccess("Board created successfully!");
      setCreateDialogOpen(false);
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create board");
    }
  }, [popupBoard, createNewBoard, navigate]);

  const handleUpdateBoard = useCallback(async () => {
    const validationError = validateBoardData(editingBoard);
    if (validationError) return setErrorMessage(validationError);
    try {
      const updatedBoard = await updateExistingBoard(editingBoard.board_id, null, null, editingBoard);
      setBoards((prev) => prev.map((b) => (b.board_id === updatedBoard.board_id ? updatedBoard : b)));
      setEditingBoard(null);
      setSuccess("Board updated successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to update board");
    }
  }, [editingBoard, updateExistingBoard, setBoards]);

  const handleDeleteBoard = useCallback(async () => {
    try {
      await deleteExistingBoard(boardToDelete, null, null);
      setBoards((prev) => prev.filter((b) => b.board_id !== boardToDelete));
      setBoardToDelete(null);
      setDeleteDialogOpen(false);
      setSuccess("Board deleted successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete board");
    }
  }, [boardToDelete, deleteExistingBoard, setBoards]);

  const handleLike = useCallback(async (board_id, isLiked) => {
    setLocalLikes((prev) => ({ ...prev, [board_id]: !isLiked }));
    try {
      await (isLiked ? unlikeExistingBoard(board_id) : likeExistingBoard(board_id));
      setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
    } catch (err) {
      setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
      setErrorMessage("Failed to like/unlike board");
    }
  }, [likeExistingBoard, unlikeExistingBoard]);

  if (authLoading || boardsLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return navigate("/login") || null;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: "auto", px: 2, mt: 2 }}>
        <ProfileHeader user={authData} isOwnProfile>
          <Button onClick={handleOpenCreateBoard} startIcon={<Add />} sx={actionButtonStyles}>
            Create Board
          </Button>
        </ProfileHeader>
        <BoardsFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          additionalFilters={["gate", "class"]}
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
      </Box>
      <BoardFormDialog
        open={createDialogOpen}
        title="Create Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={() => setCreateDialogOpen(false)}
        errorMessage={errorMessage}
        token={token}
        onLogout={handleLogout}
        navigate={navigate}
      />
      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          errorMessage={errorMessage}
          token={token}
          onLogout={handleLogout}
          navigate={navigate}
        />
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
      />
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")}>
        <Alert severity="error">{errorMessage}</Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default BoardsPage;