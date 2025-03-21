// src/sections/ClassSection/ClassSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import UserHeader from "../../components/Headers/UserHeader";
import CategoryChip from "../../components/Chips/CategoryChip";
import BoardCard from "../../components/Cards/BoardCard";
import { useBoards } from "../../hooks/useBoards";

const containerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  p: 3,
  bgcolor: "background.paper",
  minHeight: "calc(100vh - 64px)",
};

const buttonStyles = {
  textTransform: "none",
  borderRadius: 2,
  px: 3,
  py: 1,
  fontSize: "1rem",
};

const filtersStyles = {
  display: "flex",
  flexWrap: "wrap",
  gap: 2,
  alignItems: "center",
  justifyContent: "space-between",
};

const cardGridStyles = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(250px, 1fr))" },
  gap: 2,
};

const ClassSection = ({ currentUser, classData, boards, token, onCreate, onUpdate, onDelete, onStatusUpdate }) => {
  const navigate = useNavigate();
  const { likeBoardById, unlikeBoardById } = useBoards(token, () => {}, navigate);
  const [likedBoards, setLikedBoards] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const newLikedBoards = boards.reduce(
      (acc, board) => ({
        ...acc,
        [board.board_id]: board.liked_by?.includes(currentUser?.anonymous_id) || false,
      }),
      {}
    );
    setLikedBoards(newLikedBoards);
  }, [boards, currentUser]);

  const derivedCategories = useMemo(() => {
    const cats = boards.map((board) => board.category || "Uncategorized");
    return ["All", ...new Set(cats)];
  }, [boards]);

  const filteredBoards = useMemo(() => {
    return activeCategory === "All"
      ? boards
      : boards.filter((board) => (board.category || "Uncategorized") === activeCategory);
  }, [boards, activeCategory]);

  const handleBoardClick = useCallback(
    (board_id) => {
      navigate(`/board/${board_id}`);
    },
    [navigate]
  );

  const handleLikeBoard = useCallback(
    async (board_id, isLiked) => {
      try {
        const updatedBoard = isLiked ? await unlikeBoardById(board_id) : await likeBoardById(board_id);
        if (updatedBoard) {
          setLikedBoards((prev) => ({
            ...prev,
            [board_id]: !isLiked,
          }));
        }
      } catch (err) {
        console.error(`Error ${isLiked ? "unliking" : "liking"} board:`, err);
      }
    },
    [likeBoardById, unlikeBoardById]
  );

  const handleStatusSubmit = () => {
    onStatusUpdate({ isActive: !classData.isActive });
    setStatusDialogOpen(false);
  };

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" startIcon={<Add />} onClick={onCreate} sx={buttonStyles}>
              Create Board
            </Button>
            <Button variant="outlined" startIcon={<Edit />} onClick={onUpdate} sx={buttonStyles}>
              Update Class
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={buttonStyles}
              color="error"
            >
              Delete Class
            </Button>
            <Button
              variant="outlined"
              onClick={() => setStatusDialogOpen(true)}
              sx={buttonStyles}
            >
              Update Status
            </Button>
          </Box>
        }
      />
      <Typography variant="h5">{classData.name}</Typography>
      <Typography variant="body1" color="text.secondary">
        {classData.description || "No description provided."}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Status: {classData.isActive ? "Active" : "Inactive"}
      </Typography>

      <Box sx={filtersStyles}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {derivedCategories.map((category) => (
            <CategoryChip
              key={category}
              category={category}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </Stack>
      </Box>

      {filteredBoards.length > 0 ? (
        <Box sx={cardGridStyles}>
          {filteredBoards.map((board) => (
            <BoardCard
              key={board.board_id}
              board={board}
              onClick={() => handleBoardClick(board.board_id)}
              onLike={() => handleLikeBoard(board.board_id, likedBoards[board.board_id])}
              isLiked={likedBoards[board.board_id]}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
          <Typography variant="h5" sx={{ color: "text.secondary" }}>
            No boards found in this class
          </Typography>
        </Box>
      )}

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Class Status</DialogTitle>
        <DialogContent>
          <Typography>
            Current Status: {classData.isActive ? "Active" : "Inactive"}<br />
            New Status: {classData.isActive ? "Inactive" : "Active"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleStatusSubmit} color="primary" autoFocus>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this class? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={onDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassSection;