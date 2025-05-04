import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Button,
  Badge,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVert,
  Edit,
  Share,
  Favorite,
  FavoriteBorder,
  Link,
  People,
  Public,
  Lock,
  Toll,
  Brush,
  Delete,
} from "@mui/icons-material";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import Board from "../components/social-features/Board/Board";
import useAuth from "../hooks/useAuth";
import { useBoards } from "../hooks/useBoards";
import { useTweets } from "../hooks/useTweets";
import usePoints from "../hooks/usePoints";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import { useNotification } from "../context/NotificationContext";
import { ProfileAvatar } from "../utils/avatarUtils";
import { actionButtonStyles, cancelButtonStyle } from "../styles/BaseStyles";
import AnimatedPoints from "../components/AnimatedPoints/AnimatedPoints";
import PointsDeductionAnimation from "../components/PointsDeductionAnimation/PointsDeductionAnimation";

// Simple debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const BoardPage = memo(() => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const { board_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    boardItem,
    members,
    fetchBoard,
    fetchBoardMembersList,
    fetchBoardsList,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    updateExistingBoard,
    toggleFavoriteBoard,
    deleteExistingBoard,
    loading: boardsLoading,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);
  const {
    tweets,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    error: tweetsError,
    loading: tweetsLoading,
  } = useTweets(token, board_id, authData, handleLogout, navigate);
  const { pointsData, getPoints } = usePoints(token, handleLogout, navigate);
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

  // State
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [onlineMembersDialogOpen, setOnlineMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [editTweetModal, setEditTweetModal] = useState(null);
  const [availableBoards, setAvailableBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [prevPoints, setPrevPoints] = useState(pointsData?.total_points || 0);
  const [pointsSpent, setPointsSpent] = useState(0);

  // Derived state
  const userRole = useMemo(() => {
    if (!isAuthenticated || !boardItem) return "viewer";
    if (boardItem.creator_id === authData?.anonymous_id) return "owner";
    if (boardItem.is_public) return "viewer";
    return members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "viewer";
  }, [isAuthenticated, authData?.anonymous_id, boardItem, members]);

  const isFavorited = useMemo(() => {
    return boardItem?.favorited_by?.some((user) => user.anonymous_id === authData?.anonymous_id) ?? false;
  }, [boardItem?.favorited_by, authData?.anonymous_id]);

  const boardVisibility = useMemo(() => {
    return boardItem?.visibility ?? (boardItem?.is_public ? "public" : "private");
  }, [boardItem?.visibility, boardItem?.is_public]);

  // Data loading with debouncing and sequential fetching
  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Please log in to view boards.", "error");
        setIsFullyLoaded(true);
        return;
      }
      setIsFullyLoaded(false);
      try {
        // Step 1: Fetch board first to stabilize userRole
        const boardData = await fetchBoard(board_id, signal);
        if (!boardData) throw new Error("Board not found.");

        // Step 2: Fetch other data in parallel
        await Promise.all([
          fetchTweets({ signal }),
          getPoints(signal),
        ]);

        if (boardData.is_public === false && userRole === "viewer") {
          throw new Error("Access denied to private board.");
        }

        // Step 3: Fetch conditional data
        const promises = [];
        if (userRole !== "viewer") {
          promises.push(fetchBoardMembersList(board_id, signal));
        }
        if (userRole === "owner" || userRole === "admin") {
          promises.push(
            fetchGatesList({ visibility: "public" }, signal),
            fetchClassesList({}, signal)
          );
        }

        await Promise.all(promises);
        setIsFullyLoaded(true);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("API request aborted:", err.message); // Log for debugging
          return;
        }
        const message = err.message.includes("Access denied")
          ? "You do not have access to this private board."
          : err.message.includes("not found")
          ? "Board not found."
          : `Failed to load board data: ${err.message}`;
        showNotification(message, "error");
        setIsFullyLoaded(true);
      }
    },
    [
      isAuthenticated,
      token,
      board_id,
      fetchBoard,
      fetchBoardMembersList,
      fetchTweets,
      getPoints,
      fetchGatesList,
      fetchClassesList,
      showNotification,
      userRole, // Stable after sequential fetch
    ]
  );

  // Debounced loadData to prevent rapid re-renders
  const debouncedLoadData = useMemo(() => debounce(loadData, 300), [loadData]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => setIsFullyLoaded(true), 10000);
    debouncedLoadData(controller.signal);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [debouncedLoadData]);

  useEffect(() => {
    if (boardError) showNotification(boardError, "error");
    if (tweetsError) showNotification(tweetsError, "error");
    if (gatesError) showNotification(gatesError, "error");
    if (classesError) showNotification(classesError, "error");
  }, [boardError, tweetsError, gatesError, classesError, showNotification]);

  useEffect(() => {
    if (pointsData?.total_points !== undefined && pointsData.total_points < prevPoints) {
      setPointsSpent(prevPoints - pointsData.total_points);
      setTimeout(() => setPointsSpent(0), 700);
    }
    setPrevPoints(pointsData?.total_points ?? 0);
  }, [pointsData?.total_points, prevPoints]);

  // Handlers
  const validateBoardData = useCallback(
    (data) => {
      if (!data?.name?.trim()) return "Board name is required";
      const s = data.settings || {};
      if (s.max_tweets < 1 || s.max_tweets > 10000) return "Max tweets must be 1-10000";
      if (s.tweet_cost < 0) return "Tweet cost must be non-negative";
      if (s.favorite_cost < 0) return "Favorite cost must be non-negative";
      if (s.points_to_creator < 0 || s.points_to_creator > 100) return "Points to creator must be 0-100";
      if (s.max_members < 1 || s.max_members > 10000) return "Max members must be 1-10000";
      if (data.visibility === "public" && !data.gate_id && !data.class_id && gates.length > 0) {
        return "Public boards require a gate or class";
      }
      return "";
    },
    [gates]
  );

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard) return;
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to edit this board.", "error");
      return;
    }
    const validationError = validateBoardData(editingBoard);
    if (validationError) {
      showNotification(validationError, "error");
      return;
    }
    try {
      const updatedBoard = await updateExistingBoard(editingBoard.board_id, {
        name: editingBoard.name,
        description: editingBoard.description,
        is_public: editingBoard.visibility === "public",
        visibility: editingBoard.visibility,
        type: editingBoard.type,
        gate_id: editingBoard.gate_id || null,
        class_id: editingBoard.class_id || null,
        settings: editingBoard.settings,
        tags: editingBoard.tags,
      });
      if (!updatedBoard) throw new Error("Failed to update board");
      setEditingBoard(null);
      showNotification("Board updated successfully!", "success");
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, updateExistingBoard, showNotification, validateBoardData, userRole]);

  const handleFavorite = useCallback(async () => {
    try {
      await toggleFavoriteBoard(board_id, isFavorited);
      showNotification(`Board ${isFavorited ? "unfavorited" : "favorited"} successfully!`, "success");
    } catch (err) {
      showNotification("Failed to toggle favorite", "error");
    }
  }, [board_id, isFavorited, toggleFavoriteBoard, showNotification]);

  const handleEdit = useCallback(() => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to edit this board.", "error");
      return;
    }
    if (boardItem) {
      setEditingBoard({
        board_id: boardItem.board_id,
        name: boardItem.name || "",
        description: boardItem.description || "",
        is_public: boardItem.is_public || false,
        visibility: boardItem.visibility || (boardItem.is_public ? "public" : "private"),
        type: boardItem.type || "personal",
        gate_id: boardItem.gate_id || "",
        class_id: boardItem.class_id || "",
        settings: {
          max_tweets: boardItem.settings?.max_tweets || 100,
          tweet_cost: boardItem.settings?.tweet_cost || 1,
          max_members: boardItem.settings?.max_members || 50,
          favorite_cost: boardItem.settings?.favorite_cost || 1,
          points_to_creator: boardItem.settings?.points_to_creator || 1,
          allow_invites: boardItem.settings?.allow_invites !== false,
          require_approval: boardItem.settings?.require_approval || false,
          ai_moderation_enabled: boardItem.settings?.ai_moderation_enabled !== false,
          auto_archive_after: boardItem.settings?.auto_archive_after || 30,
        },
        tags: boardItem.tags || [],
        current_user: { anonymous_id: authData?.anonymous_id, role: userRole },
      });
    }
  }, [boardItem, authData?.anonymous_id, userRole]);

  const handleManageMembers = useCallback(() => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to manage members.", "error");
      return;
    }
    setMembersDialogOpen(true);
  }, [userRole]);

  const handleViewOnlineMembers = useCallback(() => {
    setOnlineMembersDialogOpen(true);
  }, []);

  const handleShare = useCallback(() => {
    const boardUrl = `${window.location.origin}/board/${board_id}`;
    setInviteLink(boardUrl);
    setShareDialogOpen(true);
  }, [board_id]);

  const handleOpenDeleteDialog = useCallback(() => {
    if (userRole !== "owner") {
      showNotification("You do not have permission to delete this board.", "error");
      return;
    }
    setDeleteDialogOpen(true);
  }, [userRole]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteExistingBoard(board_id);
      setDeleteDialogOpen(false);
      showNotification("Board deleted successfully!", "success");
      navigate("/boards");
    } catch (err) {
      showNotification("Failed to delete board", "error");
      setDeleteDialogOpen(false);
    }
  }, [board_id, deleteExistingBoard, navigate, showNotification]);

  const loadAvailableBoards = useCallback(async () => {
    try {
      const data = await fetchBoardsList();
      setAvailableBoards(data?.boards.filter(b => b.board_id) || []);
    } catch (err) {
      showNotification("Failed to load boards", "error");
    }
  }, [fetchBoardsList, showNotification]);

  const handleCreateTweet = useCallback(
    async (text, x, y, parentTweetId) => {
      try {
        await createNewTweet(text, x, y, parentTweetId);
        await Promise.all([getPoints(), fetchTweets()]);
        showNotification("Tweet created successfully!", "success");
      } catch (err) {
        showNotification(err.message || "Failed to create tweet", "error");
      }
    },
    [createNewTweet, getPoints, fetchTweets, showNotification]
  );

  const handleUpdateTweet = useCallback(
    async (id, updates) => {
      try {
        await updateExistingTweet(id, updates);
        await getPoints();
        showNotification("Tweet updated successfully!", "success");
      } catch (err) {
        showNotification("Failed to update tweet", "error");
      }
    },
    [updateExistingTweet, getPoints, showNotification]
  );

  const handleToggleLikeTweet = useCallback(
    async (id, isLiked) => {
      try {
        await toggleLikeTweet(id, isLiked);
        await getPoints();
        showNotification(`Tweet ${isLiked ? "unliked" : "liked"} successfully!`, "success");
      } catch (err) {
        showNotification("Failed to toggle like", "error");
      }
    },
    [toggleLikeTweet, getPoints, showNotification]
  );

  const handleDeleteTweet = useCallback(
    async (id) => {
      try {
        await deleteExistingTweet(id);
        await getPoints();
        showNotification("Tweet deleted successfully!", "success");
      } catch (err) {
        showNotification("Failed to delete tweet", "error");
      }
    },
    [deleteExistingTweet, getPoints, showNotification]
  );

  const handleClearBoard = useCallback(async () => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to clear this board.", "error");
      return;
    }
    try {
      const deletePromises = tweets.map((tweet) => deleteExistingTweet(tweet.tweet_id));
      await Promise.all(deletePromises);
      await fetchTweets();
      setClearDialogOpen(false);
      showNotification("Board cleared successfully!", "success");
    } catch (err) {
      showNotification("Failed to clear board", "error");
    }
  }, [tweets, deleteExistingTweet, fetchTweets, showNotification, userRole]);

  const handleEditTweet = useCallback(
    async (tweet) => {
      await loadAvailableBoards();
      setSelectedBoardId(tweet.board_id || board_id);
      setNewStatus(tweet.status || "approved");
      setEditTweetModal({ ...tweet });
    },
    [loadAvailableBoards, board_id]
  );

  const handleSaveEditedTweet = useCallback(
    async () => {
      if (!editTweetModal) return;
      try {
        await updateExistingTweet(editTweetModal.tweet_id, {
          content: editTweetModal.content,
          status: newStatus,
          position: editTweetModal.position,
        });
        if (editTweetModal.board_id !== selectedBoardId) {
          await moveTweet(editTweetModal.tweet_id, selectedBoardId);
        }
        setEditTweetModal(null);
        await fetchTweets();
        showNotification("Tweet updated successfully!", "success");
      } catch (err) {
        showNotification("Failed to save tweet", "error");
      }
    },
    [editTweetModal, updateExistingTweet, moveTweet, fetchTweets, newStatus, selectedBoardId, showNotification]
  );

  const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) {
      showNotification("Invalid share link", "error");
      setShareDialogOpen(false);
      return;
    }
    try {
      await navigator.clipboard.write(inviteLink);
      showNotification("Link copied to clipboard!", "success");
      setShareDialogOpen(false);
    } catch (err) {
      showNotification("Failed to copy link", "error");
    }
  }, [inviteLink, showNotification]);

  // Render
  if (authLoading || boardsLoading || !isFullyLoaded) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    showNotification("Please log in to view boards.", "error");
    navigate("/login");
    return null;
  }

  if (!boardItem || (boardItem.is_public === false && userRole === "viewer")) {
    showNotification(
      boardItem ? "You do not have access to this private board." : "Board not found.",
      "error"
    );
    navigate("/boards");
    return null;
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* Action Buttons */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          zIndex: 1200,
          "@media (max-width: 600px)": { transform: "scale(0.8)" },
        }}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip title="Board Visibility">
              <IconButton aria-label={`Board visibility: ${boardVisibility}`}>
                {boardVisibility === "public" ? <Public /> : <Lock />}
              </IconButton>
            </Tooltip>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip title={isFavorited ? "Unfavorite Board" : "Favorite Board"}>
              <IconButton
                onClick={handleFavorite}
                aria-label={isFavorited ? "Unfavorite board" : "Favorite board"}
              >
                {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Tooltip title="Share Board">
              <IconButton onClick={handleShare} aria-label="Share board">
                <Share />
              </IconButton>
            </Tooltip>
          </motion.div>

          {(userRole === "owner" || userRole === "admin") && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip title="Manage Members">
                  <IconButton
                    onClick={handleManageMembers}
                    aria-label={`Manage members (current count: ${members.length})`}
                  >
                    <Badge badgeContent={members.length} color="default">
                      <People />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip title="Edit Board">
                  <IconButton onClick={handleEdit} aria-label="Edit board">
                    <Edit />
                  </IconButton>
                </Tooltip>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip title="Clear Board Tweets">
                  <IconButton onClick={() => setClearDialogOpen(true)} aria-label="Clear board tweets">
                    <Brush color="error" />
                  </IconButton>
                </Tooltip>
              </motion.div>
            </>
          )}

          {userRole === "owner" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip title="Delete Board">
                <IconButton onClick={handleOpenDeleteDialog} aria-label="Delete board">
                  <Delete color="error" />
                </IconButton>
              </Tooltip>
            </motion.div>
          )}

          {boardItem.child_board_ids?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <IconButton
                aria-controls="board-menu"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                sx={{ bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}
                aria-label="Open child boards menu"
              >
                <MoreVert />
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>
        <Menu
          id="board-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ "& .MuiMenu-paper": { borderRadius: theme.shape.borderRadiusMedium } }}
        >
          {boardItem.child_board_ids?.filter(childId => childId).map((childId) => (
            <MenuItem
              key={childId}
              onClick={() => {
                navigate(`/board/${childId}`);
                handleMenuClose();
              }}
            >
              Go to Child Board {childId.slice(0, 8)}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Points Display */}
      <Box
        sx={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          gap: 1,
          "@media (max-width: 600px)": { transform: "scale(0.8)" },
        }}
      >
        <Tooltip title="Available points">
          <IconButton size="small" aria-label="Available points">
            <Toll />
          </IconButton>
        </Tooltip>
        <AnimatedPoints points={pointsData?.total_points || 0} />
        {pointsSpent > 0 && <PointsDeductionAnimation pointsSpent={pointsSpent} />}
      </Box>

      {/* Board Content */}
      <Board
        tweets={tweets}
        boardTitle={boardItem.name}
        onCreateTweet={handleCreateTweet}
        onUpdateTweet={handleUpdateTweet}
        onDeleteTweet={handleDeleteTweet}
        onLikeTweet={handleToggleLikeTweet}
        onReplyTweet={handleEditTweet}
        onEditTweet={handleEditTweet}
        onMoveTweet={(tweet) => {
          setSelectedBoardId(tweet.board_id || board_id);
          setEditTweetModal({ ...tweet });
        }}
        onChangeTweetType={(tweet) => {
          setNewStatus(tweet.status || "approved");
          setEditTweetModal({ ...tweet });
        }}
        currentUser={authData}
        loading={tweetsLoading}
        error={tweetsError}
        onRetryFetch={() => fetchTweets()}
        userRole={userRole}
      />

      {/* Edit Board Dialog */}
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
          token={token}
          userRole={userRole}
        />
      )}

      {/* Manage Members Dialog */}
      <MemberFormDialog
        open={membersDialogOpen}
        title="Manage Board Members"
        boardId={board_id}
        token={token}
        onSave={() => {
          fetchBoardMembersList(board_id);
          setMembersDialogOpen(false);
        }}
        onCancel={() => setMembersDialogOpen(false)}
        disabled={userRole !== "owner" && userRole !== "admin"}
        members={members}
        addMember={addMemberToBoard}
        removeMember={removeMemberFromBoard}
        updateMemberRole={updateMemberRole}
      />

      {/* Share Board Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: theme.shape.borderRadiusMedium } }}
      >
        <DialogTitle>Share Board</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Copy the link below to share this board:
          </Typography>
          <TextField
            fullWidth
            value={inviteLink}
            InputProps={{ readOnly: true }}
            aria-label="Board share link"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShareDialogOpen(false)}
            sx={cancelButtonStyle}
            aria-label="Close share dialog"
          >
            Close
          </Button>
          <Button
            onClick={handleCopyLink}
            sx={actionButtonStyles}
            startIcon={<Link />}
            aria-label="Copy share link"
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Tweet Dialog */}
      {editTweetModal && (
        <Dialog open onClose={() => setEditTweetModal(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Tweet</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              fullWidth
              label="Tweet Content"
              value={editTweetModal.content?.value || ""}
              onChange={(e) =>
                setEditTweetModal((prev) => ({
                  ...prev,
                  content: { ...prev.content, value: e.target.value },
                }))
              }
              sx={{ mt: 2 }}
              aria-label="Tweet content"
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Tweet Type</InputLabel>
              <Select
                value={newStatus}
                label="Tweet Type"
                onChange={(e) => setNewStatus(e.target.value)}
                aria-label="Tweet type"
              >
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pinned">Pinned</MenuItem>
                <MenuItem value="reminder">Reminder</MenuItem>
                <MenuItem value="announcement">Announcement</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Move to Board</InputLabel>
              <Select
                value={selectedBoardId}
                label="Move to Board"
                onChange={(e) => setSelectedBoardId(e.target.value)}
                aria-label="Move to board"
              >
                {availableBoards.filter(b => b.board_id).map((b) => (
                  <MenuItem key={b.board_id} value={b.board_id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTweetModal(null)} aria-label="Cancel edit tweet">
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedTweet}
              variant="contained"
              aria-label="Save edited tweet"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Clear Board Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearBoard}
        message="Are you sure you want to delete all tweets on this board? This action cannot be undone."
        disabled={tweetsLoading}
      />

      {/* Delete Board Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this board? This action cannot be undone."
        disabled={boardsLoading}
      />
    </Box>
  );
});

export default BoardPage;