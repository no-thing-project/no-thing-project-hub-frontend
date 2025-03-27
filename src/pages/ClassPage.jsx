import React, { useState, useCallback, useEffect } from "react";
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
  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);
  const { class_id } = useParams();

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
    fetchBoardsByClass,
    createNewBoardInClass,
    updateExistingBoard,
    deleteExistingBoard,
    likeBoardById,
    unlikeBoardById,
    loading: boardsLoading,
  } = useBoards(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [editingBoard, setEditingBoard] = useState(null);
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});

  const loadClassData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!class_id || !token) {
      showNotification("Class ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [classResult, membersResult, boardsResult] = await Promise.all([
        fetchClass(class_id, signal),
        fetchClassMembersList(class_id),
        fetchBoardsByClass(class_id, {}, signal),
      ]);
      console.log("Class data:", classResult);
      console.log("Members:", membersResult);
      console.log("Boards:", boardsResult);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading class data:", err);
        showNotification(err.message || "Failed to load class data.", "error");
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [
    class_id,
    token,
    fetchClass,
    fetchClassMembersList,
    fetchBoardsByClass,
    showNotification,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadClassData();
  }, [loadClassData, isAuthenticated]);

  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return board.is_public;
    if (quickFilter === "private") return !board.is_public;
    if (quickFilter === "liked") {
      const isLiked =
        localLikes[board.board_id] !== undefined
          ? localLikes[board.board_id]
          : board.is_liked;
      return isLiked;
    }
    return true;
  });

  const handleOpenCreateBoard = () => {
    setPopupBoard({ name: "", description: "", visibility: "Public" });
    setCreateBoardDialogOpen(true);
  };

  const handleCancelCreateBoard = () => {
    setCreateBoardDialogOpen(false);
  };

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      const newBoard = await createNewBoardInClass(class_id, {
        name: popupBoard.name,
        description: popupBoard.description,
        is_public: popupBoard.visibility === "Public",
      });
      setSuccess("Board created successfully!");
      setCreateBoardDialogOpen(false);
      setPopupBoard({ name: "", description: "", visibility: "Public" });
      navigate(`/board/${newBoard.board_id}`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.[0] ||
        err.message ||
        "Failed to create board";
      showNotification(errorMsg, "error");
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
        is_public: editingClass.visibility === "Public",
      });
      setSuccess("Class updated successfully!");
      setEditingClass(null);
      await loadClassData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to update class",
        "error"
      );
    }
  }, [editingClass, updateExistingClass, loadClassData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    try {
      await deleteExistingClass(class_id);
      setSuccess("Class deleted successfully!");
      navigate("/classes");
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to delete class",
        "error"
      );
    }
  }, [deleteExistingClass, class_id, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      await updateExistingBoard(editingBoard.board_id, null, class_id, {
        name: editingBoard.name,
        description: editingBoard.description,
        is_public: editingBoard.visibility === "Public",
      });
      setSuccess("Board updated successfully!");
      setEditingBoard(null);
      await loadClassData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to update board",
        "error"
      );
    }
  }, [
    editingBoard,
    updateExistingBoard,
    class_id,
    loadClassData,
    showNotification,
  ]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, class_id);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await loadClassData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to delete board",
        "error"
      );
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [
    boardToDelete,
    deleteExistingBoard,
    class_id,
    loadClassData,
    showNotification,
  ]);

  const handleLikeBoard = useCallback(
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
        await loadClassData();
        setLocalLikes({});
      } catch (err) {
        setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
        showNotification(
          `Failed to ${isLiked ? "unlike" : "like"} board`,
          "error"
        );
      }
    },
    [likeBoardById, unlikeBoardById, loadClassData, showNotification]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  if (isLoading || authLoading || classesLoading || boardsLoading)
    return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (!classData) {
    showNotification("Class not found", "error");
    return null;
  }

  return (
    <AppLayout
      currentUser={authData}
      onLogout={handleLogout}
      token={token}
      headerTitle={classData.name || "Class"}
    >
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
                  visibility: classData.is_public ? "Public" : "Private",
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
        title="Create New Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
      />

      {editingBoard && (
        <BoardFormDialog
          open={Boolean(editingBoard)}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
        />
      )}

      {editingClass && (
        <ClassFormDialog
          open={Boolean(editingClass)}
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

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default ClassPage;
