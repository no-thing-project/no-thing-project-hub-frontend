import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Edit, Delete, Visibility, Favorite, FavoriteBorder } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import { useBoards } from "../hooks/useBoards";
import useAuth from "../hooks/useAuth";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    likeBoardById,
    unlikeBoardById,
  } = useBoards(token, handleLogout, navigate);

  const [newBoard, setNewBoard] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [editingBoard, setEditingBoard] = useState(null);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBoardsList();
  }, [isAuthenticated, fetchBoardsList]);

  const handleCreateBoard = useCallback(async () => {
    if (!newBoard.name.trim()) {
      setErrorMessage("Board name is required");
      return;
    }
    try {
      const createdBoard = await createNewBoard({
        name: newBoard.name,
        description: newBoard.description,
        is_public: newBoard.visibility === "Public",
      });
      setSuccess("Board created successfully!");
      setNewBoard({ name: "", description: "", visibility: "Public" });
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to create board");
    }
  }, [newBoard, createNewBoard, navigate]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      setErrorMessage("Board name is required");
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
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to update board");
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, null);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(err.response?.data?.errors?.[0] || "Failed to delete board");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [boardToDelete, deleteExistingBoard, fetchBoardsList]);

  const handleLike = useCallback(async (board_id, isLiked) => {
    try {
      if (isLiked) {
        await unlikeBoardById(board_id);
      } else {
        await likeBoardById(board_id);
      }
      setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} board`);
    }
  }, [likeBoardById, unlikeBoardById, fetchBoardsList]);

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || boardsLoading;
  const error = boardsError || errorMessage;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1200, margin: "auto", padding: 3 }}>
        <Typography variant="h4" gutterBottom>
          Boards
        </Typography>

        {/* Create New Board Form */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Create a New Board
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Board Name"
                value={newBoard.name}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, name: e.target.value })
                }
                fullWidth
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Description"
                value={newBoard.description}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, description: e.target.value })
                }
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Select
                value={newBoard.visibility}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, visibility: e.target.value })
                }
                fullWidth
                variant="outlined"
              >
                <MenuItem value="Public">Public</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateBoard}
                fullWidth
                disabled={isLoading}
              >
                Create Board
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* List of Boards */}
        <Typography variant="h6" gutterBottom>
          Your Boards
        </Typography>
        {boards.length === 0 ? (
          <Typography>No boards available. Create one to get started!</Typography>
        ) : (
          <List>
            {boards.map((board) => (
              <ListItem
                key={board.board_id}
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: "background.paper",
                }}
              >
                {editingBoard && editingBoard.board_id === board.board_id ? (
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Board Name"
                        value={editingBoard.name}
                        onChange={(e) =>
                          setEditingBoard({ ...editingBoard, name: e.target.value })
                        }
                        fullWidth
                        variant="outlined"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Description"
                        value={editingBoard.description}
                        onChange={(e) =>
                          setEditingBoard({
                            ...editingBoard,
                            description: e.target.value,
                          })
                        }
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Select
                        value={editingBoard.visibility}
                        onChange={(e) =>
                          setEditingBoard({
                            ...editingBoard,
                            visibility: e.target.value,
                          })
                        }
                        fullWidth
                        variant="outlined"
                      >
                        <MenuItem value="Public">Public</MenuItem>
                        <MenuItem value="Private">Private</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpdateBoard}
                        sx={{ mr: 1 }}
                        disabled={isLoading}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setEditingBoard(null)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <ListItemText
                      primary={board.name}
                      secondary={
                        <>
                          {board.description || "No description"} | Visibility:{" "}
                          {board.is_public ? "Public" : "Private"}
                        </>
                      }
                      onClick={() => navigate(`/board/${board.board_id}`)}
                      sx={{ cursor: "pointer" }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => navigate(`/board/${board.board_id}`)}
                        disabled={isLoading}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() =>
                          setEditingBoard({
                            board_id: board.board_id,
                            name: board.name,
                            description: board.description || "",
                            visibility: board.is_public ? "Public" : "Private",
                          })
                        }
                        disabled={isLoading}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleLike(board.board_id, board.is_liked)}
                        disabled={isLoading}
                      >
                        {board.is_liked ? <Favorite color="error" /> : <FavoriteBorder />}
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setBoardToDelete(board.board_id);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={isLoading}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}

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

export default BoardsPage;