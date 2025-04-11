import { Box, Button, Menu, MenuItem } from "@mui/material";
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import { useNotification } from "../context/NotificationContext";
import { MoreVert } from "@mui/icons-material";

const BoardPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { board_id } = useParams();

  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const { fetchBoard, fetchBoardMembersList, likeExistingBoard, unlikeExistingBoard, updateExistingBoard, inviteUserToBoard, acceptBoardInvite, addBoardMember, removeBoardMember, runBoardAIModeration, error: boardError } = useBoards(token, handleLogout, navigate);
  const { gates } = useGates(token, handleLogout, navigate);
  const { classes } = useClasses(token, handleLogout, navigate);

  const [localBoardData, setLocalBoardData] = useState(null);
  const [localMembers, setLocalMembers] = useState([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const loadBoardData = useCallback(async (signal) => {
    if (!board_id || !token) return;
    setIsFullyLoaded(false);
    try {
      const [board, members] = await Promise.all([
        fetchBoard(board_id, null, null, signal),
        fetchBoardMembersList(board_id, signal),
      ]);
      setLocalBoardData(board || null);
      setLocalMembers(members || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load board data.", "error");
      }
    } finally {
      setIsFullyLoaded(true);
    }
  }, [board_id, token, fetchBoard, fetchBoardMembersList, showNotification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    loadBoardData(controller.signal);
    return () => controller.abort();
  }, [isAuthenticated, loadBoardData]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      const updated = await updateExistingBoard(editingBoard.board_id, null, null, editingBoard);
      setEditingBoard({ ...localBoardData });
      
      setLocalBoardData(updated);
      showNotification("Board updated successfully", "success");
      if (updated.is_public === false && localBoardData.is_public === true) {
        setLocalMembers(updated.members || []);
      }
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, localBoardData, showNotification]);

  const handleLike = useCallback(async () => {
    try {
      const alreadyLiked = localBoardData?.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
      const updated = alreadyLiked ? await unlikeExistingBoard(board_id) : await likeExistingBoard(board_id);
      setLocalBoardData(updated);
    } catch (err) {
      showNotification("Failed to toggle like", "error");
    }
  }, [board_id, localBoardData, authData, likeExistingBoard, unlikeExistingBoard, showNotification]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => {
    setEditingBoard({ ...localBoardData });
    handleMenuClose();
  };

  const handleNavigateToChildBoard = (childBoardId) => {
    navigate(`/board/${childBoardId}`);
    handleMenuClose();
  };

  if (authLoading || !isFullyLoaded) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      <Box sx={{ position: "absolute", top: 10, right: 10 }}>
        <Button
          aria-controls="board-menu"
          aria-haspopup="true"
          onClick={handleMenuOpen}
          startIcon={<MoreVert />}
        >
          Options
        </Button>
        <Menu
          id="board-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>Edit Board</MenuItem>
          {localBoardData?.child_board_ids?.length > 0 && (
            localBoardData.child_board_ids.map(childId => (
              <MenuItem key={childId} onClick={() => handleNavigateToChildBoard(childId)}>
                Go to Child Board {childId.slice(0, 8)}
              </MenuItem>
            ))
          )}
        </Menu>
      </Box>
      <Board
        token={token}
        currentUser={authData}
        onLogout={handleLogout}
        boardId={board_id}
        boardData={localBoardData}
        members={localMembers}
        boardTitle={localBoardData?.name || "Untitled Board"}
        onLike={handleLike}
        onInviteUser={inviteUserToBoard}
        onAcceptInvite={acceptBoardInvite}
        onAddMember={addBoardMember}
        onRemoveMember={removeBoardMember}
        onRunAIModeration={runBoardAIModeration}
        setEditingBoard={setEditingBoard}
      />

      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          token={token}
          onLogout={handleLogout}
          navigate={navigate}
        />
      )}
    </Box>
  );
};

export default BoardPage;