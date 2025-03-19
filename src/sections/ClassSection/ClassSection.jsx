// src/sections/ClassSection/ClassSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import UserHeader from "../../components/Headers/UserHeader";
import CategoryChip from "../../components/Chips/CategoryChip";
import BoardCard from "../../components/Cards/BoardCard";

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

const ClassSection = ({ currentUser, classData, token, onCreate }) => {
  const navigate = useNavigate();
  const boards = useMemo(() => classData?.boards || [], [classData]);

  const [likedBoards, setLikedBoards] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const newLikedBoards = boards.reduce(
      (acc, board) => ({
        ...acc,
        [board.board_id]:
          board.liked_by?.some(
            (like) => like.user_id === currentUser?.anonymous_id
          ) || false,
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
      : boards.filter(
          (board) => (board.category || "Uncategorized") === activeCategory
        );
  }, [boards, activeCategory]);

  const handleBoardClick = useCallback((board_id) => {
    if (board_id) {
      navigate(`/board/${board_id}`);
    } else {
      console.error("Invalid board ID for navigation");
    }
  }, [navigate]);

  const handleLike = useCallback((e, board_id) => {
    e.stopPropagation();
    setLikedBoards((prev) => ({
      ...prev,
      [board_id]: !prev[board_id],
    }));
  }, []);

  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
  }, []);

  if (!currentUser || !classData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Error: User or class data is missing. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreate}
            sx={buttonStyles}
          >
            Create Board
          </Button>
        }
      />
      <Typography variant="h5" sx={{ mb: 2 }}>
        {classData.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {classData.description || "No description provided."}
      </Typography>

      {filteredBoards.length > 0 && (
        <Box sx={filtersStyles}>
          <Stack direction="row" spacing={1}>
            {derivedCategories.map((cat) => (
              <CategoryChip
                key={cat}
                label={cat}
                isActive={activeCategory === cat}
                backgroundColor="#3E435D"
                onClick={() => handleCategoryClick(cat)}
              />
            ))}
          </Stack>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontSize: "1rem" }}
          >
            Found: {filteredBoards.length}
          </Typography>
        </Box>
      )}

      {filteredBoards.length > 0 ? (
        <Box sx={cardGridStyles}>
          {filteredBoards.map((board) => (
            <BoardCard
              key={board.board_id}
              board={board}
              liked={likedBoards[board.board_id] || false}
              onClick={() => handleBoardClick(board.board_id)}
              onLike={(e) => handleLike(e, board.board_id)}
              boardClasses={{}}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "50vh",
          }}
        >
          <Typography variant="h5" sx={{ color: "text.secondary" }}>
            No boards found in this class
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ClassSection;