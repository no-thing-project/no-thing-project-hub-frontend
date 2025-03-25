import { Alert, Box, Snackbar } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../components/Layout/ErrorMessage";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";

const BoardPage = () => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState("");
  const [editingBoard, setEditingBoard] = useState(null);

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
      setErrorMessage(
        err.response?.data?.errors?.[0] || "Failed to update board"
      );
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList]);

  const loadBoardData = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!board_id || !token) {
      setErrorMessage("Board ID or authentication missing.");
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
        setErrorMessage(err.message || "Failed to load board data.");
      }
    }

    return () => controller.abort();
  }, [board_id, token, fetchBoard, fetchBoardMembersList]);

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
        setSuccess(
          `Board ${boardData.is_liked ? "unliked" : "liked"} successfully!`
        );
        await loadBoardData();
      }
    } catch (err) {
      setErrorMessage(
        `Failed to ${boardData?.is_liked ? "unlike" : "like"} board`
      );
    }
  }, [board_id, boardData, likeBoardById, unlikeBoardById, loadBoardData]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || boardLoading;
  const error = boardError || errorMessage;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;
  if (!boardData) return <ErrorMessage message="Board not found" />;

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
    </Box>
  );
};

export default BoardPage;
