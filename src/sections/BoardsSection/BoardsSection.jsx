import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Stack } from "@mui/material";
import { Add } from "@mui/icons-material";
import UserHeader from "../../components/Basic/Headers/UserHeader";
import CategoryChip from "../../components/Chips/CategoryChip";
import BoardCard from "../../components/Cards/BoardCard";
import {
  containerStyles,
  buttonStyles,
  filtersStyles,
  cardGridStyles,
} from "../../styles/BoardSectionStyles";
import { getBoardCategoryName, getCategoryStyles } from "../../utils/boardUtils";

const BoardsSection = React.memo(({ currentUser, boards, boardClasses }) => {
  const navigate = useNavigate();
  const boardsList = useMemo(() => (Array.isArray(boards) ? boards : []), [boards]);

  const [likedBoards, setLikedBoards] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  // Ініціалізація стану лайків при зміні бордів
  useEffect(() => {
    const newLikedBoards = boardsList.reduce((acc, board) => ({
      ...acc,
      [board.board_id]: board.liked_by?.some((like) => like.user_id === currentUser?.anonymous_id) || false,
    }), {});
    setLikedBoards(newLikedBoards); // Пряме оновлення без порівняння JSON
  }, [boardsList, currentUser]);

  // Отримуємо унікальні категорії
  const derivedCategories = useMemo(() => {
    const cats = boardsList.map((board) => getBoardCategoryName(board, boardClasses));
    return ["All", ...new Set(cats)];
  }, [boardsList, boardClasses]);

  // Фільтруємо борди за активною категорією
  const filteredBoards = useMemo(() => {
    return activeCategory === "All"
      ? boardsList
      : boardsList.filter((board) => getBoardCategoryName(board, boardClasses) === activeCategory);
  }, [boardsList, activeCategory, boardClasses]);

  // Хендлери
  const handleBoardClick = useCallback((boardId) => {
    try {
      navigate(`/board/${boardId}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [navigate]);

  const handleLike = useCallback((e, boardId) => {
    e.stopPropagation();
    if (!boardId) {
      console.error("Invalid board ID for like");
      return;
    }
    setLikedBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  }, []);

  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
  }, []);

  const handleCreateBoard = useCallback(() => {
    try {
      navigate("/create-board");
    } catch (error) {
      console.error("Error creating board:", error);
    }
  }, [navigate]);

  // Умовний рендер
  if (!currentUser) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Error: User data is missing. Please log in.
        </Typography>
      </Box>
    );
  }

  if (!Array.isArray(boards)) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Error: Unable to load boards. Please try again later.
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
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateBoard} sx={buttonStyles}>
            Create Board
          </Button>
        }
      />
      {filteredBoards.length > 0 && (
        <Box sx={filtersStyles}>
          <Stack direction="row" spacing={1}>
            {derivedCategories.map((cat) => {
              const boardWithCat = boardsList.find((board) => getBoardCategoryName(board, boardClasses) === cat);
              const activeColor = boardWithCat ? getCategoryStyles(boardWithCat, boardClasses).backgroundColor : "#3E435D";
              return (
                <CategoryChip
                  key={cat}
                  label={cat}
                  isActive={activeCategory === cat}
                  backgroundColor={activeColor}
                  onClick={() => handleCategoryClick(cat)}
                />
              );
            })}
          </Stack>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1rem" }}>
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
              boardClasses={boardClasses}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
          <Typography variant="h5" sx={{ color: "text.secondary" }}>
            No boards found
          </Typography>
        </Box>
      )}
    </Box>
  );
});

BoardsSection.displayName = "BoardsSection";
export default BoardsSection;