import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Skeleton, Button } from "@mui/material";
import { Add, Public, Lock, People, Forum, Star, Home } from "@mui/icons-material";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import AppLayout from "../components/Layout/AppLayout";
import ProfileHeader from "../components/Headers/ProfileHeader";
import ClassFormDialog from "../components/Dialogs/ClassFormDialog";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import { useClasses } from "../hooks/useClasses";
import { useBoards } from "../hooks/useBoards";
import { useGates } from "../hooks/useGates";
import useAuth from "../hooks/useAuth";
import { useNotification } from "../context/NotificationContext";
import Filters from "../components/Filters/Filters";
import Grids from "../components/Grids/Grids";
import CardMain from "../components/Cards/CardMain";
import { containerStyles, skeletonStyles, gridStyles, actionButtonStyles } from "../styles/BaseStyles";

const DEFAULT_BOARD = {
  name: "",
  description: "",
  is_public: true,
  visibility: "public",
  type: "group",
  gate_id: null,
  class_id: null,
  settings: {
    max_tweets: 100,
    tweet_cost: 10,
    max_members: 50,
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
 * ClassPage component for managing and displaying a specific class and its boards.
 */
const ClassPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { class_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classItem: classData,
    members,
    stats,
    fetchClass,
    classes,
    fetchClassesList,
    fetchClassMembersList,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    toggleFavoriteClass,
    loading: classesLoading,
    error: classError,
  } = useClasses(token, handleLogout, navigate);
  const {
    boards,
    fetchBoardsByClass,
    createNewBoardInClass,
    updateExistingBoard,
    deleteExistingBoard,
    toggleFavoriteBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    loading: boardsLoading,
    error: boardsError,
  } = useBoards(token, handleLogout, navigate);
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(
    token,
    handleLogout,
    navigate
  );

  const [isLoading, setIsLoading] = useState(true);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [boardMemberDialogOpen, setBoardMemberDialogOpen] = useState(false);
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [popupBoard, setPopupBoard] = useState({
    ...DEFAULT_BOARD,
    class_id,
    gate_id: classData?.gate_id || null,
  });

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All Boards" },
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "favorite", label: "Favorite" },
    ],
    []
  );

  const loadData = useCallback(
    async (signal) => {
      if (!class_id || !token || !isAuthenticated) {
        showNotification("Class ID or authentication missing.", "error");
        setIsLoading(false);
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([
          fetchClass(class_id, signal),
          fetchClassMembersList(class_id, signal),
          fetchBoardsByClass(class_id, {}, signal),
          fetchGatesList({ visibility: "public" }, signal),
          fetchClassesList({}, signal),
        ]);
        setRetryCount(0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Load data error:", err);
          const errorMessage = err.message.includes("network")
            ? "Network error. Please check your connection."
            : err.message || "Failed to load class data.";
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
    [
      class_id,
      token,
      isAuthenticated,
      fetchClass,
      fetchClassMembersList,
      fetchBoardsByClass,
      fetchGatesList,
      fetchClassesList,
      showNotification,
      retryCount,
      navigate,
      location.pathname,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (classError) showNotification(classError, "error");
    if (boardsError) showNotification(boardsError, "error");
    if (gatesError) showNotification(gatesError, "error");
  }, [classError, boardsError, gatesError, showNotification]);

  useEffect(() => {
    setPopupBoard((prev) => ({
      ...prev,
      class_id,
      gate_id: classData?.gate_id || null,
    }));
  }, [class_id, classData]);

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
          (board.className || "").toLowerCase().includes(lowerSearchQuery) ||
          (board.tags || []).some((tag) => tag.toLowerCase().includes(lowerSearchQuery));
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
          default:
            return true;
        }
      });
  }, [boards, gates, classes, quickFilter, searchQuery]);

  const handleOpenCreateBoard = useCallback(() => setCreateBoardDialogOpen(true), []);

  const handleCancelCreateBoard = useCallback(() => {
    setCreateBoardDialogOpen(false);
    setPopupBoard({
      ...DEFAULT_BOARD,
      class_id,
      gate_id: classData?.gate_id || null,
    });
  }, [class_id, classData]);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    if (popupBoard.class_id !== class_id) {
      showNotification("Class ID mismatch", "error");
      return;
    }
    setActionLoading(true);
    try {
      const newBoard = await createNewBoardInClass(class_id, popupBoard);
      showNotification("Board created successfully!", "success");
      setCreateBoardDialogOpen(false);
      navigate(`/board/${newBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || "Failed to create board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoardInClass, class_id, navigate, showNotification]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name.trim()) {
      showNotification("Board name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
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
      setDeleteBoardDialogOpen(false);
      setBoardToDelete(null);
      showNotification("Board deleted successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to delete board", "error");
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name.trim()) {
      showNotification("Class name is required!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditClassDialogOpen(false);
      setEditingClass(null);
      showNotification("Class updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification]);

  const handleOpenDeleteClassDialog = useCallback(() => setDeleteClassDialogOpen(true), []);

  const handleDeleteClass = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingClass(class_id);
      setDeleteClassDialogOpen(false);
      showNotification("Class deleted successfully!", "success");
      navigate("/classes");
    } catch (err) {
      showNotification(err.message || "Failed to delete class", "error");
    } finally {
      setActionLoading(false);
    }
  }, [class_id, deleteExistingClass, navigate, showNotification]);

  const handleFavoriteToggle = useCallback(async () => {
    setActionLoading(true);
    try {
      await toggleFavoriteClass(class_id, classData?.is_favorited);
      showNotification(
        classData?.is_favorited ? "Class removed from favorites!" : "Class added to favorites!",
        "success"
      );
    } catch (err) {
      showNotification(err.message || "Failed to toggle favorite", "error");
    } finally {
      setActionLoading(false);
    }
  }, [class_id, classData, toggleFavoriteClass, showNotification]);

  const handleAddClassMember = useCallback(
    async (classId, memberData) => {
      setActionLoading(true);
      try {
        if (members.length >= classData?.settings?.max_members) {
          showNotification("Maximum member limit reached!", "error");
          return;
        }
        await addMemberToClass(classId, memberData);
        showNotification("Member added successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to add member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToClass, showNotification, members, classData]
  );

  const handleRemoveClassMember = useCallback(
    async (classId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromClass(classId, username);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to remove member", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromClass, showNotification]
  );

  const handleUpdateClassMemberRole = useCallback(
    async (classId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateClassMemberRole(classId, username, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateClassMemberRole, showNotification]
  );

  const handleAddBoardMember = useCallback(
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

  const handleRemoveBoardMember = useCallback(
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

  const handleUpdateBoardMemberRole = useCallback(
    async (boardId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(boardId, username, newRole);
        showNotification("Board member role updated successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to update member role", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleOpenClassMemberDialog = useCallback(() => setMemberDialogOpen(true), []);

  const handleSaveClassMembers = useCallback(() => {
    setMemberDialogOpen(false);
    showNotification("Class members updated successfully!", "success");
  }, [showNotification]);

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
  }, []);

  const handleOpenBoardMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setBoardMemberDialogOpen(true);
  }, []);

  const handleSaveBoardMembers = useCallback(() => {
    setBoardMemberDialogOpen(false);
    setSelectedBoardId(null);
    showNotification("Board members updated successfully!", "success");
  }, [showNotification]);

  const handleCancelBoardMemberDialog = useCallback(() => {
    setBoardMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter("all");
    setSearchQuery("");
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  const userRole = members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "none";
  const gate = gates.find((g) => g.gate_id === classData?.gate_id);

  const headerData = useMemo(
    () => ({
      type: "class",
      title: classData?.name || "Untitled Class",
      titleAriaLabel: `Class name: ${classData?.name || "Untitled Class"}`,
      description: classData?.description,
      descriptionAriaLabel: classData?.description
        ? `Class description: ${classData.description}`
        : undefined,
      chips: [
        {
          label: `${gate?.name || "No Gate"}`,
          icon: <Home />,
          color: "secondary",
          ariaLabel: `${gate?.name || "No Gate"}`,
        },
        {
          label: classData?.access?.is_public ? "Public" : "Private",
          icon: classData?.access?.is_public ? <Public /> : <Lock />,
          color: classData?.access?.is_public ? "success" : "default",
          ariaLabel: classData?.access?.is_public ? "Public class" : "Private class",
        },
        {
          label: `Favorites: ${stats?.favorite_count || 0}`,
          icon: <Star />,
          color: "warning",
          ariaLabel: `Favorites: ${stats?.favorite_count || 0}`,
        },
        {
          label: `Members: ${stats?.member_count || members?.length || 0}`,
          icon: <People />,
          color: "primary",
          ariaLabel: `Members: ${stats?.member_count || members?.length || 0}`,
        },
        {
          label: `Boards: ${filteredBoards?.length || 0}`,
          icon: <Forum />,
          color: "info",
          ariaLabel: `Boards: ${filteredBoards?.length || 0}`,
        },
        {
          label: `Owner: ${classData?.creator?.username || "Unknown"}`,
          ariaLabel: `Owner: ${classData?.creator?.username || "Unknown"}`,
        },
      ],
      actions: [
        {
          label: "Create Board",
          icon: <Add />,
          onClick: handleOpenCreateBoard,
          tooltip: "Create a new board within this class",
          disabled: actionLoading || boardsLoading || classesLoading || gatesLoading,
          ariaLabel: "Create a new board",
          isMenuItem: false,
        },
        {
          label: "Edit Class",
          onClick: () =>
            setEditingClass({
              class_id: classData.class_id,
              name: classData.name,
              description: classData.description,
              is_public: classData.access?.is_public,
              visibility: classData.access?.is_public ? "public" : "private",
              settings: classData.settings,
              gate_id: classData.gate_id,
            }),
          tooltip: "Edit class details",
          disabled: actionLoading || !["owner", "admin"].includes(userRole),
          ariaLabel: "Edit class",
          isMenuItem: true,
        },
        {
          label: "Manage Members",
          onClick: handleOpenClassMemberDialog,
          tooltip: "Manage class members",
          disabled: actionLoading || !["owner", "admin"].includes(userRole),
          ariaLabel: "Manage members",
          isMenuItem: true,
        },
        {
          label: "Delete Class",
          onClick: handleOpenDeleteClassDialog,
          tooltip: "Permanently delete this class",
          disabled: actionLoading || userRole !== "owner",
          ariaLabel: "Delete class",
          variant: "delete",
          isMenuItem: true,
        },
      ].filter(
        (action) => action.label !== "Create Board" || classData?.access?.is_public || userRole !== "viewer"
      ),
      isFavorited: classData?.is_favorited,
      onFavoriteToggle: handleFavoriteToggle,
      actionLoading,
    }),
    [
      classData,
      stats,
      members,
      filteredBoards,
      userRole,
      actionLoading,
      handleOpenCreateBoard,
      handleOpenClassMemberDialog,
      handleOpenDeleteClassDialog,
      handleFavoriteToggle,
      gate,
    ]
  );

  if (authLoading || classesLoading || boardsLoading || gatesLoading || isLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <Box sx={{ ...containerStyles, maxWidth: "1500px", mx: "auto" }}>
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.header, height: "150px" }} />
          <Skeleton variant="rectangular" sx={{ ...skeletonStyles.filter, height: "60px" }} />
          <Box sx={{ ...gridStyles.container }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" sx={{ ...skeletonStyles.card, height: "210px" }} />
            ))}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    navigate("/login", { state: { from: location.pathname } });
    return null;
  }

  if (!classData) {
    showNotification("Class not found", "error");
    navigate("/classes");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ ...containerStyles, maxWidth: "1500px", mx: "auto" }}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole}>
          <Button
            onClick={handleOpenCreateBoard}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles }}
            aria-label="Create a new board"
            disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
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
          cardComponent={CardMain}
          itemKey="board_id"
          gridType="boards"
          handleFavorite={toggleFavoriteBoard}
          setEditingItem={(board) => {
            setEditingBoard(board);
          }}
          setItemToDelete={setBoardToDelete}
          setDeleteDialogOpen={setDeleteBoardDialogOpen}
          handleManageMembers={handleOpenBoardMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={handleOpenCreateBoard}
        />
        <BoardFormDialog
          open={createBoardDialogOpen}
          title="Create New Board"
          board={popupBoard}
          setBoard={setPopupBoard}
          onSave={handleCreateBoard}
          onCancel={handleCancelCreateBoard}
          disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
          gates={gates}
          classes={classes}
          currentClass={classData}
          initialClassId={class_id}
          fixedClassId={class_id}
          fixedGateId={classData?.gate_id || null}
          loading={actionLoading}
          aria-labelledby="create-board-dialog"
        />
        {editingBoard && (
          <BoardFormDialog
            open={!!editingBoard}
            title="Edit Board"
            board={editingBoard}
            setBoard={setEditingBoard}
            onSave={handleUpdateBoard}
            onCancel={() => setEditingBoard(null)}
            disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
            gates={gates}
            classes={classes}
            currentClass={classData}
            initialClassId={class_id}
            fixedClassId={class_id}
            fixedGateId={classData?.gate_id || null}
            loading={actionLoading}
            aria-labelledby="edit-board-dialog"
          />
        )}
        {editingClass && (
          <ClassFormDialog
            open={editClassDialogOpen}
            title="Edit Class"
            classItem={editingClass}
            setClass={setEditingClass}
            onSave={handleUpdateClass}
            onCancel={() => {
              setEditClassDialogOpen(false);
              setEditingClass(null);
            }}
            disabled={actionLoading || classesLoading}
            gates={gates}
            loading={actionLoading}
            aria-labelledby="edit-class-dialog"
          />
        )}
        <MemberFormDialog
          open={memberDialogOpen}
          title="Manage Class Members"
          classId={class_id}
          token={token}
          onSave={handleSaveClassMembers}
          onCancel={handleCancelMemberDialog}
          disabled={actionLoading || classesLoading || boardsLoading}
          members={members}
          addMember={handleAddClassMember}
          removeMember={handleRemoveClassMember}
          updateMemberRole={handleUpdateClassMemberRole}
          loading={actionLoading}
          aria-labelledby="manage-class-members-dialog"
        />
        <MemberFormDialog
          open={boardMemberDialogOpen}
          title="Manage Board Members"
          boardId={selectedBoardId}
          token={token}
          onSave={handleSaveBoardMembers}
          onCancel={handleCancelBoardMemberDialog}
          disabled={actionLoading || boardsLoading}
          members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
          addMember={handleAddBoardMember}
          removeMember={handleRemoveBoardMember}
          updateMemberRole={handleUpdateBoardMemberRole}
          loading={actionLoading}
          aria-labelledby="manage-board-members-dialog"
        />
        <DeleteConfirmationDialog
          open={deleteBoardDialogOpen}
          onClose={() => {
            setDeleteBoardDialogOpen(false);
            setBoardToDelete(null);
          }}
          onConfirm={handleDeleteBoard}
          message="Are you sure you want to delete this board? This action cannot be undone."
          disabled={actionLoading || boardsLoading}
          loading={actionLoading}
          aria-labelledby="delete-board-dialog"
        />
        <DeleteConfirmationDialog
          open={deleteClassDialogOpen}
          onClose={() => setDeleteClassDialogOpen(false)}
          onConfirm={handleDeleteClass}
          message="Are you sure you want to delete this class? This action cannot be undone."
          disabled={actionLoading || classesLoading}
          loading={actionLoading}
          aria-labelledby="delete-class-dialog"
        />
      </Box>
    </AppLayout>
  );
};

ClassPage.propTypes = {
  navigate: PropTypes.func,
  token: PropTypes.string,
  authData: PropTypes.object,
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(ClassPage);