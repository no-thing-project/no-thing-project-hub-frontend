import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Skeleton } from "@mui/material";
import { Add, Edit } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useClasses } from "../hooks/useClasses";
import { useBoards } from "../hooks/useBoards";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, deleteButtonStyle } from "../styles/BaseStyles";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import BoardsFilters from "../components/Boards/BoardsFilters";
import BoardsGrid from "../components/Boards/BoardsGrid";
import { debounce } from "lodash";

const ClassPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { class_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    classData,
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
  const { gates, fetchGatesList } = useGates(token, handleLogout, navigate);

  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    is_public: true,
    type: "group",
    tags: [],
    settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11, tweets_limit_trigger: 111 },
    class_id,
    gate_id: null,
  });
  const [editingBoard, setEditingBoard] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [localLikes, setLocalLikes] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setPopupBoard((prev) => ({
      ...prev,
      class_id,
      gate_id: classData?.gate_id || null,
    }));
  }, [classData, class_id]);

  const loadClassData = useCallback(async () => {
    if (!class_id || !token) {
      showNotification("Class ID or authentication missing.", "error");
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    try {
      await Promise.all([
        fetchClass(class_id, controller.signal),
        fetchClassMembersList(class_id),
        fetchBoardsByClass(class_id, {}, controller.signal),
        fetchGatesList({}, controller.signal),
      ]);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load class data.", "error");
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [class_id, token, fetchClass, fetchClassMembersList, fetchBoardsByClass, fetchGatesList, showNotification]);

  useEffect(() => {
    if (isAuthenticated) loadClassData();
  }, [isAuthenticated, loadClassData]);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      const matchesSearch =
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      switch (quickFilter) {
        case "all":
          return true;
        case "public":
          return board.is_public;
        case "private":
          return !board.is_public;
        case "liked":
          return localLikes[board.board_id] ?? board.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
        case "personal":
          return board.type === "personal";
        case "group":
          return board.type === "group";
        default:
          return true;
      }
    });
  }, [boards, quickFilter, searchQuery, localLikes, authData]);

  const handleOpenCreateBoard = () => setCreateBoardDialogOpen(true);
  const handleCancelCreateBoard = () => {
    setCreateBoardDialogOpen(false);
    setPopupBoard({
      name: "",
      description: "",
      is_public: true,
      type: "group",
      tags: [],
      settings: { tweet_cost: 1, like_cost: 1, points_to_creator: 1, max_members: 11, tweets_limit_trigger: 111 },
      class_id,
      gate_id: classData?.gate_id || null,
    });
  };

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const newBoard = await createNewBoardInClass(class_id, popupBoard);
      setCreateBoardDialogOpen(false);
      showNotification("Board created successfully!", "success");
      navigate(`/board/${newBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [class_id, popupBoard, createNewBoardInClass, navigate, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, {
        name: editingClass.name,
        description: editingClass.description,
        is_public: editingClass.is_public,
        type: editingClass.type,
        gate_id: editingClass.gate_id,
      });
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
      await loadClassData();
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, loadClassData, showNotification]);

  const handleDeleteClass = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingClass(class_id);
      showNotification("Class deleted successfully!", "success");
      navigate("/classes");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [class_id, deleteExistingClass, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const updatedBoard = await updateExistingBoard(editingBoard.board_id, null, class_id, editingBoard);
      setBoards((prev) => prev.map((b) => (b.board_id === updatedBoard.board_id ? updatedBoard : b)));
      setEditingBoard(null);
      showNotification("Board updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, updateExistingBoard, class_id, setBoards, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingBoard(boardToDelete, null, class_id);
      setBoards((prev) => prev.filter((b) => b.board_id !== boardToDelete));
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification("Board deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, class_id, setBoards, showNotification]);

  const handleLikeBoard = useCallback(async (board_id, isLiked) => {
    setLocalLikes((prev) => ({ ...prev, [board_id]: !isLiked }));
    setActionLoading(true);
    try {
      const updatedBoard = isLiked ? await unlikeExistingBoard(board_id) : await likeExistingBoard(board_id);
      setBoards((prev) => prev.map((b) => (b.board_id === board_id ? updatedBoard : b)));
      showNotification(`Board ${isLiked ? "unliked" : "liked"} successfully!`, "success");
    } catch (err) {
      setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
      showNotification(`Failed to ${isLiked ? "unlike" : "like"} board`, "error");
    } finally {
      setActionLoading(false);
    }
  }, [likeExistingBoard, unlikeExistingBoard, setBoards, showNotification]);

  const handleResetFilters = () => {
    setQuickFilter("all");
    setSearchQuery("");
  };

  if (authLoading || classesLoading || boardsLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ mb: 2 }} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={200} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (!classData) {
    showNotification("Class not found", "error");
    navigate("/classes");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              onClick={handleOpenCreateBoard}
              startIcon={<Add />}
              sx={actionButtonStyles}
              disabled={actionLoading}
            >
              Create Board
            </Button>
            <Button
              onClick={() =>
                setEditingClass({ ...classData, is_public: classData.is_public, type: classData.type, gate_id: classData.gate_id })
              }
              startIcon={<Edit />}
              sx={actionButtonStyles}
              disabled={actionLoading}
            >
              Edit Class
            </Button>
            <Button
              onClick={handleDeleteClass}
              color="error"
              sx={deleteButtonStyle}
              disabled={actionLoading}
            >
              Delete Class
            </Button>
          </Box>
        </ProfileHeader>
        <BoardsFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          additionalFilters={["personal", "group"]}
          onReset={handleResetFilters}
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
      </Box>
      <BoardFormDialog
        open={createBoardDialogOpen}
        title="Create New Board in Class"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        token={token}
        onLogout={handleLogout}
        navigate={navigate}
        initialGateId={classData?.gate_id || null}
        initialClassId={class_id}
        disabled={actionLoading}
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
          initialGateId={classData?.gate_id || null}
          initialClassId={class_id}
          disabled={actionLoading}
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
          token={token}
          gates={gates}
          disabled={actionLoading}
        />
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
        message="Are you sure you want to delete this board?"
        disabled={actionLoading}
      />
    </AppLayout>
  );
};

export default React.memo(ClassPage);