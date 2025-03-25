import { Box } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import { useNotification } from "../context/NotificationContext";

const BoardPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);
  const { board_id } = useParams();

  const {
    boardData,
    members,
    fetchBoard,
    fetchBoardMembersList,
    likeBoardById,
    unlikeBoardById,
    updateExistingBoard,
    fetchBoardsList,
    loading: boardLoading,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  const [success, setSuccess] = useState("");
  const [editingBoard, setEditingBoard] = useState(null);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
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
      showNotification(err.response?.data?.errors?.[0] || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList, showNotification]);

  const loadBoardData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!board_id || !token) {
      showNotification("Board ID or authentication missing.", "error");
      return;
    }

    try {
      const [boardResult, membersResult] = await Promise.all([
        fetchBoard(board_id, null, null, signal),
        fetchBoardMembersList(board_id, signal),
      ]);
      console.log("BoardPage - Board data:", boardResult);
      console.log("BoardPage - Members:", membersResult);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading board data:", err);
        showNotification(err.message || "Failed to load board data.", "error");
      }
    }

    return () => controller.abort();
  }, [board_id, token, fetchBoard, fetchBoardMembersList, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadBoardData();
  }, [loadBoardData, isAuthenticated]);

  const handleLike = useCallback(async () => {
    try {
      const updatedBoard = boardData?.is_liked
        ? await unlikeBoardById(board_id)
        : await likeBoardById(board_id);
      if (updatedBoard) {
        setSuccess(`Board ${boardData.is_liked ? "unliked" : "liked"} successfully!`);
        await loadBoardData();
      }
    } catch (err) {
      showNotification(`Failed to ${boardData?.is_liked ? "unlike" : "like"} board`, "error");
    }
  }, [board_id, boardData, likeBoardById, unlikeBoardById, loadBoardData, showNotification]);

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || boardLoading;
  const error = boardError;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) showNotification(error, "error");
  if (!boardData) showNotification("Board not found", "error");

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Board
        token={token}
        currentUser={authData}
        onLogout={handleLogout}
        boardId={board_id}
        boardData={boardData}
        members={members}
        boardTitle={boardData.name || "Untitled Board"}
        onLike={handleLike}
        setEditingBoard={setEditingBoard}
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
    </Box>
  );
};

export default BoardPage;