import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardActionArea, CardContent, Typography, Stack, IconButton, Chip } from "@mui/material";
import { FavoriteBorder, Favorite, Lock, Public, Add } from "@mui/icons-material";
import UserHeader from "../../components/Layout/Header/UserHeader";
import CategoryChip from "../../components/Chips/CategoryChip";
import {
  containerStyles,
  buttonStyles,
  filtersStyles,
  cardGridStyles,
  cardStyles,
  cardActionAreaStyles,
  chipStyles,
} from "../../styles/BoardSectionStyles";

const BoardsSection = React.memo(({ currentUser, boards, boardClasses }) => {
  const navigate = useNavigate();
  const boardsList = useMemo(() => Array.isArray(boards) ? boards : [], [boards]);

  const [likedBoards, setLikedBoards] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  // Ініціалізуємо likedBoards при зміні boardsList
  useEffect(() => {
    const newLikedBoards = {};
    boardsList.forEach((board) => {
      newLikedBoards[board.board_id] =
        board.liked_by?.some((like) => like.user_id === currentUser?.anonymous_id) || false;
    });
    setLikedBoards((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(newLikedBoards)) {
        return newLikedBoards;
      }
      return prev;
    });
  }, [boardsList, currentUser]);

  // Функція для отримання назви категорії
  const getBoardCategoryName = (board) =>
    board.category || boardClasses[board.board_id]?.name || "Nothing";

  // Функція для отримання стилів категорії
  const getCategoryStyles = (board) => {
    const color = boardClasses[board.board_id]?.color || "#3E435D";
    return { backgroundColor: color, color: "#fff" };
  };

  // Отримуємо унікальні категорії
  const derivedCategories = useMemo(() => {
    const cats = boardsList.map((board) => getBoardCategoryName(board));
    const uniqueCats = Array.from(new Set(cats));
    return ["All", ...uniqueCats];
  }, [boardsList, boardClasses]);

  // Фільтруємо борди за активною категорією
  const filteredBoards = useMemo(() => {
    return activeCategory === "All"
      ? boardsList
      : boardsList.filter((board) => getBoardCategoryName(board) === activeCategory);
  }, [boardsList, activeCategory, boardClasses]);

  // Функція для відображення іконки видимості
  const renderVisibilityIcon = (visibility) =>
    visibility === "Private" ? (
      <Lock sx={{ fontSize: 16, mr: 0.5, color: "#990000" }} />
    ) : (
      <Public sx={{ fontSize: 16, mr: 0.5, color: "#3E435D" }} />
    );

  // Обробка кліку на борд
  const handleBoardClick = (board_id) => {
    try {
      navigate(`/board/${board_id}`);
    } catch (error) {
      console.error("Навігаційна помилка:", error);
    }
  };

  // Обробка лайка
  const handleLike = (e, boardId) => {
    e.stopPropagation();
    if (!boardId) {
      console.error("Некоректний ідентифікатор борду для лайка");
      return;
    }
    setLikedBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  // Обробка вибору категорії
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
  };

  // Обробка створення нового борду
  const handleCreateBoard = () => {
    try {
      navigate("/create-board");
    } catch (error) {
      console.error("Помилка при створенні борду:", error);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Помилка: Дані користувача відсутні. Будь ласка, увійдіть у систему.
        </Typography>
      </Box>
    );
  }

  if (!Array.isArray(boards)) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Помилка: Неможливо завантажити борди. Будь ласка, спробуйте пізніше.
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
              const boardWithCat = boardsList.find((board) => getBoardCategoryName(board) === cat);
              const activeColor = boardWithCat ? getCategoryStyles(boardWithCat).backgroundColor : "#3E435D";
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
            <Card
              key={board.board_id}
              sx={cardStyles}
              onClick={() => handleBoardClick(board.board_id)}
            >
              <CardActionArea sx={cardActionAreaStyles}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 5, width: "100%" }}>
                  <Chip
                    label={`# ${getBoardCategoryName(board)}`}
                    size="small"
                    sx={chipStyles(getCategoryStyles(board).backgroundColor)}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleLike(e, board.board_id)}
                    sx={{
                      color: likedBoards[board.board_id] ? "#3E435D" : "#999",
                      ":hover": {
                        color: likedBoards[board.board_id] ? "#3E435D" : "#333",
                      },
                    }}
                  >
                    {likedBoards[board.board_id] ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                  </IconButton>
                </Box>
                <Box sx={{ flexGrow: 1, mb: 2, width: "100%" }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                    {board.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
                    Author: {board.creator?.username || board.author || "Someone"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                    {renderVisibilityIcon(board.is_public ? "Public" : "Private")}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.95rem", color: board.is_public ? "#3E435D" : "#990000" }}
                    >
                      {board.is_public ? "Public" : "Private"}
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
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

export default BoardsSection;