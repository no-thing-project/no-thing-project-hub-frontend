import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Menu, MenuItem, Snackbar, Alert } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import { useNotification } from "../context/NotificationContext";

const BoardPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { board_id } = useParams();

  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    fetchBoard,
    fetchBoardMembersList,
    likeExistingBoard,
    unlikeExistingBoard,
    updateExistingBoard,
    addBoardMember,
    removeBoardMember,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  const [localBoardData, setLocalBoardData] = useState(null);
  const [localMembers, setLocalMembers] = useState([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [success, setSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadBoardData = useCallback(async (signal) => {
    if (!board_id || !token) return;
    setIsFullyLoaded(false);
    try {
      const [boardResponse, members] = await Promise.all([
        fetchBoard(board_id, null, null, signal),
        fetchBoardMembersList(board_id, signal),
      ]);
      const boardData = boardResponse?._doc || boardResponse;
      setLocalBoardData({
        ...boardData,
        visibility: boardData.is_public ? "public" : "private",
      });
      setLocalMembers(members || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load board data.", "error");
      }
    } finally {
      setIsFullyLoaded(true);
    }
  }, [board_id, token, fetchBoard, fetchBoardMembersList, showNotification]);

  const fetchLatestBoardData = useCallback(async () => {
    try {
      const boardResponse = await fetchBoard(board_id, null, null);
      const boardData = boardResponse?._doc || boardResponse;
      const updatedBoard = {
        ...boardData,
        visibility: boardData.is_public ? "public" : "private",
      };
      setLocalBoardData(updatedBoard);
      return updatedBoard;
    } catch (err) {
      showNotification(err.message || "Failed to fetch latest board data.", "error");
      return null;
    }
  }, [board_id, fetchBoard, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    loadBoardData(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, loadBoardData]);

  const validateBoardData = useCallback((data) => {
    if (!data.name?.trim()) return "Board name is required";
    if (data.type === "group" && data.visibility === "public" && !data.gate_id && !data.class_id) {
      return "Public group board must have a gate or class";
    }
    const s = data.settings || {};
    if (s.tweet_cost < 0 || s.tweet_cost > 100) return "Tweet cost must be 0-100";
    if (s.like_cost < 0 || s.like_cost > 100) return "Like cost must be 0-100";
    if (s.points_to_creator < 0 || s.points_to_creator > 100) return "Points to creator must be 0-100";
    if (s.max_members < 1) return "Max members must be at least 1";
    if (s.tweets_limit_trigger < 11) return "Tweet limit trigger must be at least 11";
    return "";
  }, []);

  const handleUpdateBoard = useCallback(async () => {
    const validationError = validateBoardData(editingBoard);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    try {
      const updatedMembers = editingBoard.members.filter(
        (m) => !localBoardData?.members.some((om) => om.anonymous_id === m.anonymous_id)
      );
      for (const member of updatedMembers) {
        await addBoardMember(editingBoard.board_id, member.anonymous_id, member.role);
      }
      const removedMembers = localBoardData?.members.filter(
        (om) => !editingBoard.members.some((m) => m.anonymous_id === om.anonymous_id)
      );
      for (const member of removedMembers || []) {
        await removeBoardMember(editingBoard.board_id, member.anonymous_id);
      }
      const updatedBoard = await updateExistingBoard(editingBoard.board_id, null, null, editingBoard);
      setLocalBoardData({
        ...updatedBoard,
        visibility: updatedBoard.is_public ? "public" : "private",
      });
      setLocalMembers(updatedBoard.members || []);
      setEditingBoard(null);
      setSuccess("Board updated successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to update board");
    }
  }, [editingBoard, updateExistingBoard, localBoardData, addBoardMember, removeBoardMember]);

  const handleLike = useCallback(async () => {
    try {
      const alreadyLiked = localBoardData?.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
      const updated = alreadyLiked ? await unlikeExistingBoard(board_id) : await likeExistingBoard(board_id);
      setLocalBoardData({
        ...updated,
        visibility: updated.is_public ? "public" : "private",
      });
      setSuccess(`Board ${alreadyLiked ? "unliked" : "liked"} successfully!`);
    } catch (err) {
      showNotification("Failed to toggle like", "error");
    }
  }, [board_id, localBoardData, authData, likeExistingBoard, unlikeExistingBoard, showNotification]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = useCallback(async () => {
    const latestBoard = await fetchLatestBoardData();
    if (latestBoard) {
      setEditingBoard({
        ...latestBoard,
        current_user: {
          anonymous_id: authData.anonymous_id,
          role: latestBoard.creator_id === authData.anonymous_id
            ? "owner"
            : latestBoard.members?.find((m) => m.anonymous_id === authData.anonymous_id)?.role || "viewer",
        },
      });
    }
    handleMenuClose();
  }, [fetchLatestBoardData, authData]);

  const userRole = localBoardData?.creator_id === authData?.anonymous_id
    ? "owner"
    : localBoardData?.members?.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "viewer";

  if (authLoading || !isFullyLoaded) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (!localBoardData) {
    showNotification("Board not found", "error");
    return null;
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Box sx={{ position: "absolute", top: 10, right: 10 }}>
        <Button aria-controls="board-menu" aria-haspopup="true" onClick={handleMenuOpen} startIcon={<MoreVert />}>
          Options
        </Button>
        <Menu id="board-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          {userRole === "owner" || userRole === "editor" ? (
            <MenuItem onClick={handleEdit}>Edit Board</MenuItem>
          ) : (
            <MenuItem disabled>Edit Board</MenuItem>
          )}
          {localBoardData.child_board_ids?.length > 0 &&
            localBoardData.child_board_ids.map((childId) => (
              <MenuItem key={childId} onClick={() => navigate(`/board/${childId}`)}>
                Go to Child Board {childId.slice(0, 8)}
              </MenuItem>
            ))}
        </Menu>
      </Box>
      <Board
        token={token}
        currentUser={authData}
        onLogout={handleLogout}
        boardId={board_id}
        boardData={localBoardData}
        members={localMembers}
        boardTitle={localBoardData.name}
        onLike={handleLike}
        setEditingBoard={setEditingBoard}
        fetchLatestBoardData={fetchLatestBoardData}
        userRole={userRole}
        errorMessage={errorMessage}
      />
      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          errorMessage={errorMessage}
          token={token}
          onLogout={handleLogout}
          navigate={navigate}
          userRole={userRole}
        />
      )}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!errorMessage || !!boardError} autoHideDuration={3000} onClose={() => setErrorMessage("")}>
        <Alert severity="error">{errorMessage || boardError}</Alert>
      </Snackbar>
    </Box>
  );
};

export default BoardPage;

