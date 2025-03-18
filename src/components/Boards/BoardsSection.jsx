import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
} from "@mui/material";
import { FavoriteBorder, Favorite, Lock, Public, Add } from "@mui/icons-material";
import StatusBadge from "../Profile/StatusBadge";

const BoardsSection = React.memo(({ currentUser, boards, boardClasses }) => {
  const navigate = useNavigate();

  // Ensure boards is always an array
  const boardsList = useMemo(() => Array.isArray(boards) ? boards : [], [boards]);


  const [likedBoards, setLikedBoards] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  // Ініціалізуємо likedBoards лише коли boardsList змінюється
  useEffect(() => {
    const newLikedBoards = {};
    boardsList.forEach((board) => {
      newLikedBoards[board.board_id] =
        board.liked_by?.some((like) => like.user_id === currentUser?.anonymous_id) ||
        false;
    });
    setLikedBoards((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(newLikedBoards)) {
        return newLikedBoards;
      }
      return prev;
    });
  }, [boardsList, currentUser]);

  // Функція для отримання назви категорії: якщо board.category є – використовуємо її,
  // інакше беремо name з API, або "Nothing"
  const getBoardCategoryName = (board) =>
    board.category || boardClasses[board.board_id]?.name || "Nothing";

  // Функція для стилізації: якщо API повернув color, використовуємо його, інакше стандартний "#3E435D"
  const getCategoryStyles = (board) => {
    const color = boardClasses[board.board_id]?.color;
    return { backgroundColor: color ? color : "#3E435D", color: "#fff" };
  };

  // Derive categories for фільтрації
  const derivedCategories = useMemo(() => {
    const cats = boardsList.map((board) => getBoardCategoryName(board));
    const uniqueCats = Array.from(new Set(cats));
    return ["All", ...uniqueCats];
  }, [boardsList, boardClasses]);

  // Filter boards by active category
  const filteredBoards = useMemo(() => {
    return activeCategory === "All"
      ? boardsList
      : boardsList.filter((board) => getBoardCategoryName(board) === activeCategory);
  }, [boardsList, activeCategory, boardClasses]);

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

  const handleBoardClick = (board_id) => {
    try {
      navigate(`/board/${board_id}`);
    } catch (error) {
      console.error("Навігаційна помилка:", error);
    }
  };

  const renderVisibilityIcon = (visibility) =>
    visibility === "Private" ? (
      <Lock sx={{ fontSize: 16, mr: 0.5, color: "#990000" }} />
    ) : (
      <Public sx={{ fontSize: 16, mr: 0.5, color: "#3E435D" }} />
    );

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

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
  };

  const handleCreateBoard = () => {
    try {
      navigate("/create-board");
    } catch (error) {
      console.error("Помилка при створенні борду:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
      <div className="boards-page">
        <div className="boards-page__container">
          <main className="boards-page__main">
            <Card
              sx={{
                borderRadius: 2.5,
                mb: 3,
                backgroundColor: "background.paper",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 1,
                    mb: 1,
                    ml: 3,
                    mr: 3,
                  }}
                >
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 400, color: "text.primary" }}>
                      {currentUser.username}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Class: <StatusBadge level={currentUser.access_level} />
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateBoard}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 0.8,
                      boxShadow: "none",
                      padding: "10px 20px",
                      transition: "all 0.5s ease",
                      backgroundColor: "background.button",
                      color: "background.paper",
                      ":hover": {
                        boxShadow: "none",
                        backgroundColor: "background.default",
                        color: "text.primary",
                        transition: "all 0.5s ease",
                      },
                    }}
                  >
                    Create Board
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {filteredBoards.length > 0 && (
              <Box
                className="boards-page__filters"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                  backgroundColor: "background.paper",
                  borderRadius: 1.5,
                  mb: 3,
                }}
              >
                <Stack direction="row" spacing={1}>
                  {derivedCategories.map((cat) => {
                    // Знайдемо перший борд з цією категорією, щоб отримати API-колір
                    const boardWithCat = boardsList.find(
                      (board) => getBoardCategoryName(board) === cat
                    );
                    const activeColor = boardWithCat
                      ? getCategoryStyles(boardWithCat).backgroundColor
                      : "#3E435D";
                    const chipStyles = {
                      borderRadius: 1,
                      fontSize: 12,
                      height: 24,
                      boxShadow: cat === activeCategory ? "0 4px 8px rgba(0,0,0,0.4)" : "none",
                      backgroundColor: cat === activeCategory ? activeColor : "#eeeeee",
                      color: "#fff",
                      transition: "all 0.3s ease",
                      ":hover": {
                        backgroundColor: cat === activeCategory ? activeColor : "#eeeeee",
                        transition: "all 0.3s ease",
                        opacity: 0.8,
                      },
                    };
                    return (
                      <Chip
                        key={cat}
                        label={`# ${cat}`}
                        onClick={() => handleCategoryClick(cat)}
                        sx={chipStyles}
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
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                }}
              >
                {filteredBoards.map((board) => (
                  <Card
                    key={board.board_id}
                    sx={{
                      borderRadius: 1.5,
                      cursor: "pointer",
                      boxShadow: "none",
                      transition: "all 0.3s ease-in-out",
                      backgroundColor: "background.paper",
                      ":hover": {
                        backgroundColor: "background.hover",
                        transform: "translateY(-2px)",
                        transition: "all 0.3s ease-in-out",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                      },
                    }}
                    onClick={() => handleBoardClick(board.board_id)}
                  >
                    <CardActionArea
                      sx={{
                        p: 2,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 200,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 5,
                          width: "100%",
                        }}
                      >
                        <Chip
                          label={`# ${getBoardCategoryName(board)}`}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontSize: 12,
                            height: 24,
                            ...getCategoryStyles(board),
                          }}
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
                          {likedBoards[board.board_id] ? (
                            <Favorite fontSize="small" />
                          ) : (
                            <FavoriteBorder fontSize="small" />
                          )}
                        </IconButton>
                      </Box>

                      <Box sx={{ flexGrow: 1, mb: 2, width: "100%" }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                          {board.name}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
                          Author: {board.creator?.username || board.author || "Someone"}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
                          {renderVisibilityIcon(board.is_public ? "Public" : "Private")}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: "0.95rem",
                              color: board.is_public ? "#3E435D" : "#990000",
                            }}
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
          </main>
        </div>
      </div>
    </Box>
  );
});

export default BoardsSection;
