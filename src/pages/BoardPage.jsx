import React, { useState, useEffect, useCallback } from "react";
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
import useAuth from "../hooks/useAuth";

const ErrorFallback = ({ error }) => (
  <ErrorMessage message={error.message || "Something went wrong in BoardPage"} />
);

const BoardPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { board_id } = useParams();

  const {
    boardData,
    members,
    fetchBoard,
    fetchBoardMembersList,
    updateExistingBoard,
    updateBoardStatusById,
    deleteExistingBoard,
    likeBoardById,
    unlikeBoardById,
    loading: boardLoading,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  const [isEditing, setIsEditing] = useState(false);
  const [boardFormData, setBoardFormData] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  useEffect(() => {
    if (boardData) {
      setBoardFormData({
        name: boardData.name || "",
        description: boardData.description || "",
        visibility: boardData.is_public ? "Public" : "Private",
      });
    }
  }, [boardData]);

  const handleUpdateBoard = useCallback(async () => {
    if (!boardFormData.name.trim()) {
      setErrorMessage("Board name is required");
      return;
    }
    try {
      await updateExistingBoard(board_id, null, null, {
        name: boardFormData.name,
        description: boardFormData.description,
        is_public: boardFormData.visibility === "Public",
      });
      setSuccess("Board updated successfully!");
      setIsEditing(false);
      await loadBoardData();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update board");
    }
  }, [board_id, boardFormData, updateExistingBoard, loadBoardData]);

  const handleDeleteBoard = useCallback(async () => {
    try {
      await deleteExistingBoard(board_id, null, null);
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
      await updateBoardStatusById(board_id, null, null, statusData);
      setSuccess("Board status updated successfully!");
      await loadBoardData();
    } catch (err) {
      setErrorMessage("Failed to update board status");
    }
  }, [board_id, updateBoardStatusById, loadBoardData]);

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
      setErrorMessage(`Failed to ${boardData?.is_liked ? "unlike" : "like"} board`);
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
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
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
                  value={boardFormData.name}
                  onChange={(e) =>
                    setBoardFormData({ ...boardFormData, name: e.target.value })
                  }
                  size="small"
                  required
                  disabled={isLoading}
                  inputProps={{ "aria-label": "Board Name" }}
                />
                <TextField
                  label="Description"
                  value={boardFormData.description}
                  onChange={(e) =>
                    setBoardFormData({ ...boardFormData, description: e.target.value })
                  }
                  size="small"
                  disabled={isLoading}
                  inputProps={{ "aria-label": "Board Description" }}
                />
                <Select
                  value={boardFormData.visibility}
                  onChange={(e) =>
                    setBoardFormData({ ...boardFormData, visibility: e.target.value })
                  }
                  size="small"
                  disabled={isLoading}
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
                  disabled={isLoading}
                  aria-label="Save Board Changes"
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  size="small"
                  disabled={isLoading}
                  aria-label="Cancel Editing"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6">
                  {boardData.name || "Untitled Board"}
                </Typography>
                <IconButton
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  aria-label="Edit Board"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isLoading}
                  aria-label="Delete Board"
                >
                  <Delete />
                </IconButton>
              </>
            )}
          </Box>

          <Board
            token={token}
            currentUser={authData}
            onLogout={handleLogout}
            boardId={board_id}
            boardData={boardData}
            members={members}
            boardTitle={boardData.name || "Untitled Board"}
            onLike={handleLike}
            onStatusUpdate={handleStatusUpdate}
          />

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
  );
};

export default BoardPage;