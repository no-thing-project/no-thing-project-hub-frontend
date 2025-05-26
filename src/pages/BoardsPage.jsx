import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Skeleton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import AppLayout from "../components/Layout/AppLayout";
import { useBoards } from "../hooks/useBoards";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import { actionButtonStyles, gridStyles, skeletonStyles, containerStyles } from "../styles/BaseStyles";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import BoardsFilters from "../components/Boards/BoardsFilters";
import BoardsGrid from "../components/Boards/BoardsGrid";

const BoardsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    toggleFavoriteBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
  } = useBoards(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(
    token,
    handleLogout,
    navigate
  );
  const { classes, fetchClassesList, loading: classesLoading, error: classesError } = useClasses(
    token,
    handleLogout,
    navigate
  );

  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [popupBoard, setPopupBoard] = useState({
    name: "",
    description: "",
    is_public: false,
    visibility: "private",
    type: "personal",
    gate_id: null,
    class_id: null,
    settings: {
      max_tweets: 100,
      tweet_cost: 1,
      max_members: 50,
      ai_moderation_enabled: true,
    },
    tags: [],
  });
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Authentication required.", "error");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchBoardsList({}, signal),
          fetchGatesList({ visibility: "public" }, signal),
          fetchClassesList({}, signal),
        ]);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load data", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchBoardsList, fetchGatesList, fetchClassesList, showNotification]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (boardsError) showNotification(boardsError, "error");
    if (gatesError) showNotification(gatesError, "error");
    if (classesError) showNotification(classesError, "error");
  }, [boardsError, gatesError, classesError, showNotification]);

  const filteredBoards = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return boards
      .map((board) => {
        const gate = gates.find((g) => g.gate_id === board.gate_id);
        const cls = classes.find((c) => c.class_id === board.class_id);
        return {
          ...board,
          gateName: gate ? gate.name : "No Gate",
          className: cls ? cls.name : "No Class",
        };
      })
      .filter((board) => {
        const matchesSearch =
          board.name?.toLowerCase().includes(lowerSearchQuery) ||
          board.description?.toLowerCase().includes(lowerSearchQuery) ||
          board.gateName.toLowerCase().includes(lowerSearchQuery) ||
          board.className.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        if (quickFilter === "all") return true;
        if (quickFilter === "public") return board.visibility === "public";
        if (quickFilter === "private") return board.visibility === "private";
        if (quickFilter === "favorited") return board.is_favorited;
        if (quickFilter === "personal") return board.type === "personal";
        if (quickFilter === "group") return board.type === "group";
        if (quickFilter === "gate") return !!board.gate_id;
        if (quickFilter === "class") return !!board.class_id;
        return true;
      });
  }, [boards, gates, classes, quickFilter, searchQuery]);

  const handleOpenCreateBoard = useCallback(() => setCreateDialogOpen(true), []);

  const handleCancelCreateBoard = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupBoard({
      name: "",
      description: "",
      is_public: false,
      visibility: "private",
      type: "personal",
      gate_id: null,
      class_id: null,
      settings: {
        max_tweets: 100,
        tweet_cost: 1,
        max_members: 50,
        ai_moderation_enabled: true,
      },
      tags: [],
    });
  }, []);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      const createdBoard = await createNewBoard(popupBoard);
      setCreateDialogOpen(false);
      setPopupBoard({
        name: "",
        description: "",
        is_public: false,
        visibility: "private",
        type: "personal",
        gate_id: null,
        class_id: null,
        settings: {
          max_tweets: 100,
          tweet_cost: 1,
          max_members: 50,
          ai_moderation_enabled: true,
        },
        tags: [],
      });
      showNotification("Board created successfully!", "success");
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    }
  }, [popupBoard, createNewBoard, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditingBoard(null);
      showNotification("Board updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification("Board deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete board", "error");
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification]);

  const handleOpenMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setMemberDialogOpen(true);
  }, []);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleAddMember = useCallback(
    async (boardId, memberData) => {
      try {
        const board = boards.find((b) => b.board_id === boardId);
        if (board?.members?.length >= board?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToBoard(boardId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      }
    },
    [addMemberToBoard, showNotification, boards]
  );

  const handleRemoveMember = useCallback(
    async (boardId, username) => {
      try {
        await removeMemberFromBoard(boardId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      }
    },
    [removeMemberFromBoard, showNotification]
  );

  const handleUpdateMemberRole = useCallback(
    async (boardId, username, newRole) => {
      try {
        await updateMemberRole(boardId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
  }, []);

  const headerData = {
    type: "page",
    title: "Boards",
    titleAriaLabel: "Boards page",
    shortDescription: "Your Spaces for Discussion",
    tooltipDescription:
      "Boards are dedicated spaces for sharing ideas, collaborating, and engaging in discussions. Create a board to connect with your community or explore specific topics.",
  };

  if (authLoading || boardsLoading || gatesLoading || classesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles }}>
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.header }} />
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.filter }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ ...skeletonStyles.card }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData}>
          <Button
            onClick={handleOpenCreateBoard}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles }}
            aria-label="Create a new board"
          >
            Create Board
          </Button>
        </ProfileHeader>
        <BoardsFilters
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          onReset={handleResetFilters}
        />
        <BoardsGrid
          filteredBoards={filteredBoards}
          handleFavorite={toggleFavoriteBoard}
          setEditingBoard={setEditingBoard}
          setBoardToDelete={setBoardToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          openMemberDialog={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
        />
      </Box>
      <BoardFormDialog
        open={createDialogOpen}
        title="Create New Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        disabled={boardsLoading || gatesLoading || classesLoading}
        gates={gates}
        classes={classes}
      />
      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          disabled={boardsLoading || gatesLoading || classesLoading}
          gates={gates}
          classes={classes}
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Board Members"
        boardId={selectedBoardId}
        token={token}
        onSave={() => handleCancelMemberDialog()}
        onCancel={handleCancelMemberDialog}
        disabled={boardsLoading}
        members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteBoard}
        message="Are you sure you want to delete this board? This action cannot be undone."
        disabled={boardsLoading}
      />
    </AppLayout>
  );
};

BoardsPage.propTypes = {
  navigate: PropTypes.func,
  token: PropTypes.string,
  authData: PropTypes.object,
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(BoardsPage);