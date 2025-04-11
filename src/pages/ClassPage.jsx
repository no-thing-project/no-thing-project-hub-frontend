import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Snackbar, Alert } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useClasses } from "../hooks/useClasses";
import { useBoards } from "../hooks/useBoards";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, deleteButtonStyle } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import BoardsFilters from "../components/Boards/BoardsFilters";
import BoardsGrid from "../components/Boards/BoardsGrid";

const ClassPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { class_id } = useParams();

  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);

  const {
    classData,
    members,
    fetchClass,
    fetchClassMembersList,
    updateExistingClass,
    deleteExistingClass,
    loading: classesLoading,
  } = useClasses(token, handleLogout, navigate);

  const {
    boards,
    setBoards,
    fetchBoardsByClass,
    createNewBoardInClass,
    updateExistingBoard,
    deleteExistingBoard,
    likeExistingBoard,
    unlikeExistingBoard,
    loading: boardsLoading,
  } = useBoards(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "public",
    type: "group",
    tags: [],
    settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11 },
    class_id,
  });
  const [editingBoard, setEditingBoard] = useState(null);
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  const loadClassData = useCallback(async () => {
    if (!class_id || !token) {
      showNotification("Class ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    try {
      await Promise.all([
        fetchClass(class_id, controller.signal),
        fetchClassMembersList(class_id),
        fetchBoardsByClass(class_id, {}, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load class data.", "error");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [class_id, token, fetchClass, fetchClassMembersList, fetchBoardsByClass, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadClassData();
  }, [isAuthenticated, loadClassData]);

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      switch (quickFilter) {
        case "all": return true;
        case "public": return board.is_public;
        case "private": return !board.is_public;
        case "liked":
          return localLikes[board.board_id] !== undefined
            ? localLikes[board.board_id]
            : board.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
        case "personal": return board.type === "personal";
        case "group": return board.type === "group";
        default: return true;
      }
    });
  }, [boards, quickFilter, searchQuery, localLikes, authData]);

  const handleOpenCreateBoard = () => {
    setPopupBoard({
      name: "",
      description: "",
      visibility: "public",
      type: "group",
      tags: [],
      settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11 },
      class_id,
    });
    setCreateBoardDialogOpen(true);
  };

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      const newBoard = await createNewBoardInClass(class_id, popupBoard);
      setSuccess("Board created successfully!");
      setCreateBoardDialogOpen(false);
      navigate(`/board/${newBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    }
  }, [class_id, popupBoard, createNewBoardInClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    try {
      await updateExistingClass(editingClass.class_id, {
        name: editingClass.name,
        description: editingClass.description,
        is_public: editingClass.visibility === "public",
      });
      setSuccess("Class updated successfully!");
      setEditingClass(null);
      await loadClassData();
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    }
  }, [editingClass, updateExistingClass, loadClassData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    try {
      await deleteExistingClass(class_id);
      setSuccess("Class deleted successfully!");
      navigate("/classes");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
    }
  }, [deleteExistingClass, class_id, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      const updatedBoard = await updateExistingBoard(editingBoard.board_id, null, class_id, editingBoard);
      setSuccess("Board updated successfully!");
      setEditingBoard(null);
      setBoards((prev) => prev.map((b) => (b.board_id === updatedBoard.board_id ? updatedBoard : b)));
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, class_id, setBoards, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, class_id);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      setBoards((prev) => prev.filter((b) => b.board_id !== boardToDelete));
    } catch (err) {
      showNotification(err.message || "Failed to delete board", "error");
    }
  }, [boardToDelete, deleteExistingBoard, class_id, setBoards, showNotification]);

  const handleLikeBoard = useCallback(
    async (board_id, isLiked) => {
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [board_id]: optimisticLiked }));
      try {
        const updatedBoard = isLiked
          ? await unlikeExistingBoard(board_id)
          : await likeExistingBoard(board_id);
        setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
        setBoards((prev) => prev.map((b) => (b.board_id === board_id ? updatedBoard : b)));
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
        showNotification(`Failed to ${isLiked ? "unlike" : "like"} board`, "error");
      }
    },
    [likeExistingBoard, unlikeExistingBoard, setBoards, showNotification]
  );

  const handleCloseSnackbar = () => setSuccess("");

  if (isLoading || authLoading || classesLoading || boardsLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (!classData) {
    showNotification("Class not found", "error");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleOpenCreateBoard}
              startIcon={<Add />}
              sx={actionButtonStyles}
            >
              Create Board
            </Button>
            <Button
              variant="contained"
              onClick={() =>
                setEditingClass({
                  class_id: classData.class_id,
                  name: classData.name,
                  description: classData.description || "",
                  visibility: classData.is_public ? "public" : "private",
                })
              }
              startIcon={<Edit />}
              sx={actionButtonStyles}
            >
              Edit Class
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteClass}
              sx={deleteButtonStyle}
            >
              Delete Class
            </Button>
          </Box>
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
        handleLike={handleLikeBoard}
        setEditingBoard={setEditingBoard}
        setBoardToDelete={setBoardToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        navigate={navigate}
      />

      <BoardFormDialog
        open={createBoardDialogOpen}
        title="Create New Board in Class"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={() => setCreateBoardDialogOpen(false)}
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
          token={token}
          onLogout={handleLogout}
          navigate={navigate}
        />
      )}

      {editingClass && (
        <ClassFormDialog
          open={true}
          title="Edit Class"
          classData={editingClass}
          setClass={setEditingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
        message="Are you sure you want to delete this board? This action cannot be undone."
      />

      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <Alert severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default memo(ClassPage);