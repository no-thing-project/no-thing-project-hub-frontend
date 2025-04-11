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

  const {
    token,
    authData,
    handleLogout,
    isAuthenticated,
    loading: authLoading,
  } = useAuth(navigate);

  const { board_id } = useParams();

  const {
    fetchBoard,
    fetchBoardMembersList,
    likeExistingBoard,
    unlikeExistingBoard,
    updateExistingBoard,
    inviteUserToBoard,
    acceptBoardInvite,
    addBoardMember,
    removeBoardMember,
    runBoardAIModeration,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);

  const [localBoardData, setLocalBoardData] = useState(null);
  const [localMembers, setLocalMembers] = useState([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [success, setSuccess] = useState("");
  const [editingBoard, setEditingBoard] = useState(null);

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
      setEditingBoard(null);
      setLocalBoardData(updated);
      setSuccess("Board updated");
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, showNotification]);

  const handleLike = useCallback(async () => {
    try {
      const alreadyLiked = localBoardData?.liked_by?.some((l) => l.anonymous_id === authData.anonymous_id);
      const updated = alreadyLiked
        ? await unlikeExistingBoard(board_id)
        : await likeExistingBoard(board_id);
      setLocalBoardData(updated);
    } catch (err) {
      showNotification("Failed to toggle like", "error");
    }
  }, [board_id, localBoardData, authData, likeExistingBoard, unlikeExistingBoard, showNotification]);

  const handleInviteUser = useCallback(async (anonymousId) => {
    try {
      const updated = await inviteUserToBoard(board_id, anonymousId);
      setLocalBoardData(updated);
    } catch (err) {
      showNotification(err.message || "Failed to invite user", "error");
    }
  }, [board_id, inviteUserToBoard, showNotification]);

  const handleAcceptInvite = useCallback(async () => {
    try {
      const updated = await acceptBoardInvite(board_id);
      setLocalBoardData(updated);
    } catch (err) {
      showNotification(err.message || "Failed to accept invite", "error");
    }
  }, [board_id, acceptBoardInvite, showNotification]);

  const handleAddMember = useCallback(async (anonymousId, role) => {
    try {
      const updated = await addBoardMember(board_id, anonymousId, role);
      setLocalBoardData(updated);
      setLocalMembers((prev) => [...prev, { anonymous_id: anonymousId, role }]);
    } catch (err) {
      showNotification(err.message || "Failed to add member", "error");
    }
  }, [board_id, addBoardMember, showNotification]);

  const handleRemoveMember = useCallback(async (anonymousId) => {
    try {
      const updated = await removeBoardMember(board_id, anonymousId);
      setLocalBoardData(updated);
      setLocalMembers((prev) => prev.filter((m) => m.anonymous_id !== anonymousId));
    } catch (err) {
      showNotification(err.message || "Failed to remove member", "error");
    }
  }, [board_id, removeBoardMember, showNotification]);

  const handleRunAIModeration = useCallback(async () => {
    try {
      const updated = await runBoardAIModeration(board_id);
      setLocalBoardData(updated);
    } catch (err) {
      showNotification(err.message || "Failed to run AI moderation", "error");
    }
  }, [board_id, runBoardAIModeration, showNotification]);

  useEffect(() => {
    if (boardError) {
      showNotification(boardError, "error");
    }
  }, [boardError, showNotification]);

  if (authLoading || !isFullyLoaded) return <LoadingSpinner />;
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
        onInviteUser={handleInviteUser}
        onAcceptInvite={handleAcceptInvite}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onRunAIModeration={handleRunAIModeration}
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
          availableGates={[]}
          availableClasses={[]}
        />
      )}
    </Box>
  );
};

export default BoardPage;
