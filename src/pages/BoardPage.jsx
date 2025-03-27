import { Box } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import { useNotification } from "../context/NotificationContext";

const BoardPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Хуки авторизації
  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);

  // Параметр з URL (/board/:board_id)
  const { board_id } = useParams();

  // Хуки для роботи з дошками
  const {
    fetchBoard,
    fetchBoardMembersList,
    likeBoardById,
    unlikeBoardById,
    updateExistingBoard,
    fetchBoardsList,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  // Локальні стани для даних
  const [localBoardData, setLocalBoardData] = useState(null);
  const [localMembers, setLocalMembers] = useState([]);

  // Стейт для індикації, що всі запити завершені
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [success, setSuccess] = useState("");
  const [editingBoard, setEditingBoard] = useState(null);

  // Завантаження даних дошки та учасників
  const loadBoardData = useCallback(
    async (signal) => {
      if (!board_id || !token) {
        showNotification("Board ID or authentication missing.", "error");
        return;
      }
      // Показуємо лоудер, доки не завантажимо всі дані
      setIsFullyLoaded(false);
      try {
        const [fetchedBoard, fetchedMembers] = await Promise.all([
          fetchBoard(board_id, null, null, signal),
          fetchBoardMembersList(board_id, signal),
        ]);

        if (!fetchedBoard) {
          // Якщо з сервера повернулося нічого (404 чи null)
          showNotification("Board not found", "error");
        }
        setLocalBoardData(fetchedBoard || null);
        setLocalMembers(fetchedMembers || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading board data:", err);
          showNotification(err.message || "Failed to load board data.", "error");
        }
      } finally {
        setIsFullyLoaded(true);
      }
    },
    [board_id, token, fetchBoard, fetchBoardMembersList, showNotification]
  );

  // Виклик завантаження при монтуванні
  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    loadBoardData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [isAuthenticated, loadBoardData]);

  // Оновлення дошки
  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
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
      // Після оновлення можна перезавантажити дані
      await loadBoardData();
    } catch (err) {
      showNotification(
        err.response?.data?.errors?.[0] || "Failed to update board",
        "error"
      );
    }
  }, [editingBoard, updateExistingBoard, fetchBoardsList, loadBoardData, showNotification]);

  // Лайк / анлайк дошки
  const handleLike = useCallback(async () => {
    try {
      const updatedBoard = localBoardData?.is_liked
        ? await unlikeBoardById(board_id)
        : await likeBoardById(board_id);
      if (updatedBoard) {
        setSuccess(
          `Board ${localBoardData?.is_liked ? "unliked" : "liked"} successfully!`
        );
        // Перезавантажуємо дані після лайку
        await loadBoardData();
      }
    } catch (err) {
      showNotification(
        `Failed to ${localBoardData?.is_liked ? "unlike" : "like"} board`,
        "error"
      );
    }
  }, [board_id, localBoardData, likeBoardById, unlikeBoardById, loadBoardData, showNotification]);

  // Логіка для відображення помилки
  useEffect(() => {
    if (boardError) {
      showNotification(boardError, "error");
    }
  }, [boardError, showNotification]);

  // Поки або авторизація не завершена або дані не завантажені повністю — показуємо лоудер
  if (authLoading || !isFullyLoaded) {
    return <LoadingSpinner />;
  }

  // Якщо користувач не авторизований — редірект
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Board
        token={token}
        currentUser={authData}
        onLogout={handleLogout}
        boardId={board_id}
        boardData={localBoardData}
        members={localMembers}
        boardTitle={localBoardData?.name || "Untitled Board"}
        onLike={handleLike}
        setEditingBoard={setEditingBoard}
      />

      {editingBoard && (
        <BoardFormDialog
          open={Boolean(editingBoard)}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
        />
      )}
    </Box>
  );
};

export default BoardPage;
