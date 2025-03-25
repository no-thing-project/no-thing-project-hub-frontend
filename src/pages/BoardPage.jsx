import {
  Alert,
  Box,
  Snackbar
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../components/Layout/ErrorMessage";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";

const ErrorFallback = ({ error }) => (
  <ErrorMessage
    message={error.message || "Something went wrong in BoardPage"}
  />
);

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
    loading: boardLoading,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      />

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BoardPage;
