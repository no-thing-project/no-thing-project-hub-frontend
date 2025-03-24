import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import {
  Edit,
  Delete,
  Favorite,
  FavoriteBorder,
  Add,
  Public,
  Lock,
} from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { useBoards } from "../hooks/useBoards";
import useAuth from "../hooks/useAuth";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, inputStylesWhite } from "../styles/BaseStyles";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";

const BoardsPage = () => {
  const navigate = useNavigate();
  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);

  const {
    boards,
    loading: boardsLoading,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    likeBoardById,
    unlikeBoardById,
  } = useBoards(token, handleLogout, navigate);

  const [editingBoard, setEditingBoard] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    visibility: "Public",
  });
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  // Стан для швидких фільтрів
  const [quickFilter, setQuickFilter] = useState("all");
  // Стан для поля пошуку
  const [searchQuery, setSearchQuery] = useState("");
  // Стан для оптимістичних змін лайку
  const [localLikes, setLocalLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBoardsList();
  }, [isAuthenticated, fetchBoardsList]);

  // Фільтруємо дошки за обраним фільтром та рядком пошуку
  const filteredBoards = boards.filter((board) => {
    const matchesSearch = board.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "public") return board.is_public;
    if (quickFilter === "private") return !board.is_public;
    if (quickFilter === "liked") {
      // Використовуємо оптимістичне значення, якщо є, або значення з сервера
      const isLiked =
        localLikes[board.board_id] !== undefined
          ? localLikes[board.board_id]
          : board.is_liked;
      return isLiked;
    }
    return true;
  });

  // Handlers для створення дошки
  const handleOpenCreateBoard = () => {
    setPopupBoard({ name: "", description: "", visibility: "Public" });
    setErrorMessage("");
    setCreateDialogOpen(true);
  };

  const handleCancelCreateBoard = () => {
    setCreateDialogOpen(false);
    setErrorMessage("");
  };

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      setErrorMessage("Board name is required!");
      return;
    }
    try {
      const createdBoard = await createNewBoard({
        name: popupBoard.name,
        description: popupBoard.description,
        is_public: popupBoard.visibility === "Public",
      });
      setSuccess("Board created successfully!");
      setCreateDialogOpen(false);
      setPopupBoard({ name: "", description: "", visibility: "Public" });
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.errors?.[0] || "Failed to create board"
      );
    }
  }, [popupBoard, createNewBoard, navigate]);

  // Handlers для оновлення дошки
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

  // Handler для видалення дошки
  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete, null, null);
      setSuccess("Board deleted successfully!");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      await fetchBoardsList();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.errors?.[0] || "Failed to delete board"
      );
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [boardToDelete, deleteExistingBoard, fetchBoardsList]);

  // Handler для лайку/анлайку з оптимістичним оновленням
  const handleLike = useCallback(
    async (board_id, isLiked) => {
      // Оптимістично оновлюємо стан
      const optimisticLiked = !isLiked;
      setLocalLikes((prev) => ({ ...prev, [board_id]: optimisticLiked }));
      try {
        if (isLiked) {
          await unlikeBoardById(board_id);
        } else {
          await likeBoardById(board_id);
        }
        setSuccess(`Board ${isLiked ? "unliked" : "liked"} successfully!`);
        await fetchBoardsList();
        // Очищаємо оптимістичний стан після отримання актуальних даних
        setLocalLikes({});
      } catch (err) {
        // В разі помилки повертаємо попереднє значення
        setLocalLikes((prev) => ({ ...prev, [board_id]: isLiked }));
        setErrorMessage(`Failed to ${isLiked ? "unlike" : "like"} board`);
      }
    },
    [likeBoardById, unlikeBoardById, fetchBoardsList]
  );

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || boardsLoading;
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout
      currentUser={authData}
      onLogout={handleLogout}
      token={token}
      headerTitle={"Boards"}
    >
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            variant="contained"
            onClick={handleOpenCreateBoard}
            startIcon={<Add />}
            sx={actionButtonStyles}
          >
            Create Board
          </Button>
        </ProfileHeader>
      </Box>

      {/* Швидкі фільтри та поле пошуку */}
      <Box
        sx={{
          maxWidth: 1500,
          margin: "0 auto",
          display: "flex",
          gap: 2,
          mb: 2,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant={quickFilter === "all" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("all")}
            sx={{
              backgroundColor:
                quickFilter === "all" ? "background.button" : "transparent",
              color: quickFilter === "all" ? "background.paper" : "text.primary",
              borderColor:
                quickFilter === "all" ? "background.button" : "text.primary",
            }}
          >
            All
          </Button>
          <Button
            variant={quickFilter === "public" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("public")}
            sx={{
              backgroundColor:
                quickFilter === "public" ? "background.button" : "transparent",
              color:
                quickFilter === "public" ? "background.paper" : "text.primary",
              borderColor:
                quickFilter === "public" ? "background.button" : "text.primary",
            }}
          >
            Public
          </Button>
          <Button
            variant={quickFilter === "private" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("private")}
            sx={{
              backgroundColor:
                quickFilter === "private" ? "background.button" : "transparent",
              color:
                quickFilter === "private" ? "background.paper" : "text.primary",
              borderColor:
                quickFilter === "private" ? "background.button" : "text.primary",
            }}
          >
            Private
          </Button>
          <Button
            variant={quickFilter === "liked" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("liked")}
            sx={{
              backgroundColor:
                quickFilter === "liked" ? "background.button" : "transparent",
              color:
                quickFilter === "liked" ? "background.paper" : "text.primary",
              borderColor:
                quickFilter === "liked" ? "background.button" : "text.primary",
            }}
          >
            Favorite
          </Button>
        </Box>
        {/* Поле пошуку */}
        <TextField
          variant="outlined"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={inputStylesWhite}
        />
      </Box>

      {/*
        Об'єднаний grid-контейнер, який містить:
          - Ліву колонку з заголовком та описом (розташована у першій колонці)
          - Картки бордів, які авто розташовуються й заповнюють вільний простір,
            наприклад, під лівою колонкою, якщо там є вільне місце.
      */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(3, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 4,
          gridAutoFlow: "dense",
          maxWidth: 1500,
          mx: "auto",
          my: 6,
          px: 3,
          color: "text.primary",
        }}
      >
        {/* Ліва колонка (заголовок, опис) */}
        <Box sx={{ gridColumn: { xs: "1", md: "1 / 2" } }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Monetize your content.
          </Typography>
          <Typography variant="h5" sx={{ color: "text.secondary", mb: 4 }}>
            Wherever you create.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            Create boards, share knowledge, and captivate your audience. Keep
            support at the heart of your mission. Wishing you success on your
            journey from nothing.
          </Typography>
        </Box>

        {/* Картки бордів */}
        {filteredBoards.length === 0 ? (
          <Typography sx={{ gridColumn: "0" }}>
            No boards found. Create a new board to get started!
          </Typography>
        ) : (
          filteredBoards.map((board) => {
            // Обчислюємо сумарну довжину контенту (назва + опис)
            const totalLength =
              board.name.length +
              (board.description ? board.description.length : 0);

            // Визначаємо, скільки колонок має займати картка:
            // Якщо текст дуже великий – span 3, якщо середній – span 2, інакше – span 1
            let span = 1;
            if (totalLength > 100) {
              span = 3;
            } else if (totalLength > 40) {
              span = 2;
            }

            // Використовуємо оптимістичне значення лайку, якщо є, або значення з сервера
            const isLiked =
              localLikes[board.board_id] !== undefined
                ? localLikes[board.board_id]
                : board.is_liked;

            return (
              <Box
                key={board.board_id}
                sx={{
                  gridColumn: {
                    xs: "span 1",
                    md: `span ${span}`,
                  },
                  backgroundColor: "background.paper",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minHeight: 200,
                  transition: "all 0.3s ease-in-out",
                  ":hover": {
                    backgroundColor: "background.hover",
                    transform: "scale(1.02)",
                  },
                }}
                onClick={() => navigate(`/board/${board.board_id}`)}
              >
                {/* Верхня частина з кнопками */}
                <Box
                  sx={{
                    alignSelf: "flex-end",
                    display: "flex",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBoard({
                        board_id: board.board_id,
                        name: board.name,
                        description: board.description || "",
                        visibility: board.is_public ? "Public" : "Private",
                      });
                    }}
                    sx={{ p: 1, color: "text.primary" }}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(board.board_id, isLiked);
                    }}
                    sx={{ p: 1, color: "text.primary" }}
                  >
                    {isLiked ? (
                      <Favorite color="text.primary" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setBoardToDelete(board.board_id);
                      setDeleteDialogOpen(true);
                    }}
                    sx={{ p: 1, color: "error.dark" }}
                  >
                    <Delete />
                  </IconButton>
                </Box>

                {/* Середня частина з назвою та описом */}
                <Box sx={{ flexGrow: 1, my: 1, alignContent: "center" }}>
                  <Typography variant="h6" sx={{ mb: 1, textAlign: "center" }}>
                    {board.name}
                  </Typography>
                  {board?.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center" }}
                    >
                      {board.description}
                    </Typography>
                  )}
                </Box>

                {/* Нижня частина з індикатором видимості */}
                <Box
                  sx={{ width: "100%", mt: 1 }}
                  onClick={() => navigate(`/board/${board.board_id}`)}
                >
                  {board.is_public ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        color: "text.primary",
                      }}
                    >
                      <Public sx={{ mr: 1 }} />
                      <Typography variant="caption">Public</Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        color: "error.dark",
                      }}
                    >
                      <Lock sx={{ mr: 1 }} />
                      <Typography variant="caption">Private</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Діалог для створення нової дошки */}
      <BoardFormDialog
        open={createDialogOpen}
        title="Create New Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        errorMessage={errorMessage}
      />

      {/* Діалог для оновлення дошки */}
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

      {/* Діалог для підтвердження видалення */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
      />

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
        open={Boolean(errorMessage)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
          role="alert"
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
};

export default BoardsPage;
