// src/pages/BoardPage.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import Board from "../components/social-features/Board/Board";
import { useBoards } from "../hooks/useBoards";
import ErrorBoundary from "../components/Layout/ErrorBoudary";

const ErrorFallback = ({ error }) => (
  <ErrorMessage message={error.message || "Something went wrong in BoardPage"} />
);

const BoardPage = ({ currentUser, onLogout, token }) => {
  const { board_id } = useParams();
  const navigate = useNavigate();
  const {
    board,
    updateExistingBoard,
    updateBoardStatus,
    deleteExistingBoard,
    likeBoard,
    unlikeBoard,
    fetchMembersForBoard,
    loading,
    error,
  } = useBoards(token, null, null, board_id, onLogout, navigate);

  const [isEditing, setIsEditing] = useState(false);
  const [boardData, setBoardData] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (board) {
      setBoardData({
        name: board.name || "",
        description: board.description || "",
        visibility: board.is_public ? "Public" : "Private",
      });
      fetchMembersForBoard(board_id);
    }
  }, [board, board_id, fetchMembersForBoard]);

  const handleUpdateBoard = useCallback(async () => {
    if (!boardData.name.trim()) {
      setErrorMessage("Board name is required");
      return;
    }
    try {
      await updateExistingBoard(board_id, {
        name: boardData.name,
        description: boardData.description,
        is_public: boardData.visibility === "Public",
      });
      setSuccess("Board updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to update board");
    }
  }, [board_id, boardData, updateExistingBoard]);

  const handleDeleteBoard = useCallback(async () => {
    try {
      await deleteExistingBoard(board_id);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      navigate("/boards");
    } catch (err) {
      setErrorMessage("Failed to delete board");
      setDeleteDialogOpen(false);
    }
  }, [board_id, deleteExistingBoard, navigate]);

  const handleStatusUpdate = useCallback(async (statusData) => {
    try {
      await updateBoardStatus(board_id, statusData);
      setSuccess("Board status updated successfully!");
    } catch (err) {
      setErrorMessage("Failed to update board status");
    }
  }, [board_id, updateBoardStatus]);

  const handleLike = useCallback(async () => {
    try {
      if (board.is_liked) {
        await unlikeBoard(board_id);
      } else {
        await likeBoard(board_id);
      }
      setSuccess(`Board ${board.is_liked ? "unliked" : "liked"} successfully!`);
    } catch (err) {
      setErrorMessage(`Failed to ${board.is_liked ? "unlike" : "like"} board`);
    }
  }, [board, board_id, likeBoard, unlikeBoard]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!board) return <ErrorMessage message="Board not found" />;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
        <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
          {/* Board Header with Edit Option */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 80,
              zIndex: 1200,
              display: "flex",
              alignItems: "center",
              gap: 2,
              backgroundColor: "background.paper",
              borderRadius: 1,
              padding: 1,
              boxShadow: 1,
            }}
          >
            {isEditing ? (
              <>
                <TextField
                  label="Board Name"
                  value={boardData.name}
                  onChange={(e) =>
                    setBoardData({ ...boardData, name: e.target.value })
                  }
                  size="small"
                  required
                  disabled={loading}
                  inputProps={{ "aria-label": "Board Name" }}
                />
                <TextField
                  label="Description"
                  value={boardData.description}
                  onChange={(e) =>
                    setBoardData({ ...boardData, description: e.target.value })
                  }
                  size="small"
                  disabled={loading}
                  inputProps={{ "aria-label": "Board Description" }}
                />
                <Select
                  value={boardData.visibility}
                  onChange={(e) =>
                    setBoardData({ ...boardData, visibility: e.target.value })
                  }
                  size="small"
                  disabled={loading}
                  inputProps={{ "aria-label": "Board Visibility" }}
                >
                  <MenuItem value="Public">Public</MenuItem>
                  <MenuItem value="Private">Private</MenuItem>
                </Select>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateBoard}
                  size="small"
                  disabled={loading}
                  aria-label="Save Board Changes"
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  size="small"
                  disabled={loading}
                  aria-label="Cancel Editing"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6">
                  {board.name || "Untitled Board"}
                </Typography>
                <IconButton
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  aria-label="Edit Board"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading}
                  aria-label="Delete Board"
                >
                  <Delete />
                </IconButton>
              </>
            )}
          </Box>

          {/* Board Component */}
          <Board
            token={token}
            currentUser={currentUser}
            onLogout={onLogout}
            boardId={board_id}
            boardTitle={board.name || "Untitled Board"}
            onLike={handleLike}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this board? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
                Cancel
              </Button>
              <Button onClick={handleDeleteBoard} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for Success/Error Messages */}
          <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
              {success}
            </Alert>
          </Snackbar>
          <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
              {errorMessage}
            </Alert>
          </Snackbar>
        </Box>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default BoardPage;