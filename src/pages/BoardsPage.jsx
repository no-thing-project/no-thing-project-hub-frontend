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
import Filters from "../components/Filters/Filters";
import Grids from "../components/Grids/Grids";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import Card from "../components/Cards/CardMain";
import { actionButtonStyles, gridStyles, skeletonStyles, containerStyles } from "../styles/BaseStyles";

const DEFAULT_BOARD = {
  name: "",
  description: "",
  is_public: false,
  visibility: "private",
  type: "personal",
  gate_id: null,
  class_id: null,
  settings: {
    max_tweets: 100,
    max_members: 50,
    tweet_cost: 1,
    favorite_cost: 1,
    points_to_creator: 1,
    allow_invites: true,
    require_approval: false,
    ai_moderation_enabled: true,
    auto_archive_after: 30,
  },
  tags: [],
};

/**
 * BoardsPage component for managing and displaying user boards.
 */
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [popupBoard, setPopupBoard] = useState(DEFAULT_BOARD);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All Boards" },
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "favorited", label: "Favorited" },
    ],
    []
  );

  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Authentication required!", "error");
        setIsLoading(false);
        navigate("/login", { state: { from: "/boards" } });
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchBoardsList({}, signal),
          fetchGatesList({visibility: "public" }, signal),
          fetchClassesList({visibility: "public" }, signal),
        ]);
        setRetryCount(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Load data error:", err);
          const errorMessage = err.message || "Failed to load data. Please try again.";
          showNotification(errorMessage, "error");
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => setRetryCount((prev) => prev + 1), delay);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, token, fetchBoardsList, fetchGatesList, fetchClassesList, showNotification, retryCount, navigate]
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
          (board.name || "").toLowerCase().includes(lowerSearchQuery) ||
          (board.description || "").toLowerCase().includes(lowerSearchQuery) ||
          (board.gateName || "").toLowerCase().includes(lowerSearchQuery) ||
          (board.className || "").toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;
        switch (quickFilter) {
          case "public":
            return board.visibility === "public";
          case "private":
            return board.visibility === "private";
          case "favorited":
            return board.is_favorited;
          case "personal":
            return board.type === "personal";
          case "group":
            return board.type === "group";
          case "gates":
            return !!board.gate_id;
          case "classes":
            return !!board.class_id;
          default:
            return true;
        }
      });
  }, [boards, gates, classes, quickFilter, searchQuery]);

  const handleOpenCreateBoard = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCancelCreateBoard = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupBoard(DEFAULT_BOARD);
  }, []);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      const createdBoard = await createNewBoard(popupBoard);
      setCreateDialogOpen(false);
      setPopupBoard(DEFAULT_BOARD);
      showNotification("Board created successfully!", "success");
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoard, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditDialogOpen(false);
      setEditingBoard(null);
      showNotification("Board updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, updateExistingBoard, showNotification]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification("Board deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification]);

  const handleOpenMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setMemberDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
    showNotification("Members updated successfully!", "success");
  }, [showNotification]);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleAddMember = useCallback(
    async (boardId, memberData) => {
      setActionLoading(true);
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
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToBoard, showNotification, boards]
  );

  const handleRemoveMember = useCallback(
    async (boardId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromBoard(boardId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromBoard, showNotification]
  );

  const handleUpdateMemberRole = useCallback(
    async (boardId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(boardId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  const headerData = useMemo(
    () => ({
      type: "page",
      title: "Boards",
      titleAriaLabel: "Boards page",
      shortDescription: "Your Spaces for Discussion",
      tooltipDescription:
        "Boards are dedicated spaces for sharing ideas, collaborating, and engaging in discussions. Create a board to connect with your community or explore specific topics.",
    }),
    []
  );

  if (authLoading || boardsLoading || gatesLoading || classesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles}}>
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
    navigate("/login", { state: { from: "/boards" } });
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
            disabled={boardsLoading || gatesLoading || classesLoading || actionLoading}
          >
            Create Board
          </Button>
        </ProfileHeader>
        <Filters
          type="boards"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />
        <Grids
          items={filteredBoards}
          cardComponent={Card}
          itemKey="board_id"
          gridType="boards"
          handleFavorite={toggleFavoriteBoard}
          setEditingItem={(board) => {
            setEditingBoard(board);
            setEditDialogOpen(true);
          }}
          setItemToDelete={setBoardToDelete}
          setDeleteDialogOpen={setDeleteDialogOpen}
          handleManageMembers={handleOpenMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreateBoard}
        />
      </Box>
      <BoardFormDialog
        open={createDialogOpen}
        title="Create New Board"
        board={popupBoard}
        setBoard={setPopupBoard}
        onSave={handleCreateBoard}
        onCancel={handleCancelCreateBoard}
        disabled={boardsLoading || gatesLoading || classesLoading || actionLoading}
        gates={gates}
        classes={classes}
        loading={actionLoading}
        aria-labelledby="create-board-dialog"
      />
      {editingBoard && (
        <BoardFormDialog
          open={editDialogOpen}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => {
            setEditDialogOpen(false);
            setEditingBoard(null);
          }}
          disabled={boardsLoading || gatesLoading || classesLoading || actionLoading}
          gates={gates}
          classes={classes}
          loading={actionLoading}
          aria-labelledby="edit-board-dialog"
        />
      )}
      <MemberFormDialog
        open={memberDialogOpen}
        title="Manage Board Members"
        boardId={selectedBoardId}
        token={token}
        onSave={handleSaveMembers}
        onCancel={handleCancelMemberDialog}
        disabled={boardsLoading || actionLoading}
        members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
        loading={actionLoading}
        aria-labelledby="manage-members-dialog"
      />
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setBoardToDelete(null);
        }}
        onConfirm={handleDeleteBoard}
        message="Are you sure you want to delete this board? This action cannot be undone."
        disabled={boardsLoading || actionLoading}
        loading={actionLoading}
        aria-labelledby="delete-board-dialog"
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