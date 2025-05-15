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
import { usePoints } from "../hooks/usePoints";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import { useNotification } from "../context/NotificationContext";
import { actionButtonStyles, cancelButtonStyle } from "../styles/BaseStyles";
import AnimatedPoints from "../components/AnimatedPoints/AnimatedPoints";
import PointsDeductionAnimation from "../components/PointsDeductionAnimation/PointsDeductionAnimation";

const BoardPage = memo(() => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const { board_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const {
    boardItem,
    members,
    availableBoards,
    fetchBoard,
    fetchBoardMembersList,
    updateExistingBoard,
    toggleFavoriteBoard,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    loading: boardsLoading,
    error: boardError,
  } = useBoards(token, handleLogout, navigate);
  const { pointsData, fetchPointsData, loading: pointsLoading, error: pointsError } = usePoints(
    token,
    handleLogout,
    navigate
  );
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

  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [prevPoints, setPrevPoints] = useState(pointsData?.total_points || 0);
  const [pointsSpent, setPointsSpent] = useState(0);

  const debounce = useMemo(
    () => (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },
    []
  );

  const userRole = useMemo(() => {
    if (!boardItem || !authData) return "viewer";
    return boardItem.creator_id === authData?.anonymous_id
      ? "owner"
      : boardItem.is_public
      ? "viewer"
      : members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "viewer";
  }, [boardItem, authData, members]);

  const isFavorited = useMemo(
    () => boardItem?.favorited_by?.some((user) => user.anonymous_id === authData?.anonymous_id) ?? false,
    [boardItem?.favorited_by, authData?.anonymous_id]
  );

  const boardVisibility = useMemo(
    () => boardItem?.visibility ?? (boardItem?.is_public ? "public" : "private"),
    [boardItem?.visibility, boardItem?.is_public]
  );

  const loadData = useCallback(
    async (signal) => {
      if (!isAuthenticated || !token) {
        showNotification("Please log in to view boards.", "error");
        setIsFullyLoaded(true);
        return;
      }
      setIsFullyLoaded(false);
      try {
        const boardData = await fetchBoard(board_id, signal);
        if (!boardData) throw new Error("Board not found.");

        await fetchPointsData(signal);

        if (boardData.is_public === false && userRole === "viewer") {
          throw new Error("Access denied to private board.");
        }

        const promises = [];
        if (userRole === "owner" || userRole === "admin") {
          promises.push(fetchGatesList({ visibility: "public" }, signal), fetchClassesList({}, signal));
        }

        await Promise.all(promises);
        setIsFullyLoaded(true);
      } catch (err) {
        if (err.name === "AbortError") return;
        const message = err.message.includes("Access denied")
          ? "You do not have access to this private board."
          : err.message.includes("not found")
          ? "Board not found."
          : `Failed to load board data: ${err.message}`;
        showNotification(message, "error");
        setTimeout(() => navigate("/boards"), 2000);
        setIsFullyLoaded(true);
      }
    },
    [
      isAuthenticated,
      token,
      board_id,
      fetchBoard,
      fetchPointsData,
      fetchGatesList,
      fetchClassesList,
      showNotification,
      userRole,
      navigate,
    ]
  );

  const debouncedLoadData = useMemo(() => debounce(loadData, 300), [debounce, loadData]);

  useEffect(() => {
    const controller = new AbortController();
    debouncedLoadData(controller.signal);
    return () => {
      controller.abort();
      setPointsSpent(0);
    };
  }, [debouncedLoadData]);

  useEffect(() => {
    const errors = [boardError, gatesError, classesError, pointsError].filter(Boolean);
    if (errors.length) {
      errors.forEach((err) => showNotification(err, "error"));
    }
  }, [boardError, gatesError, classesError, pointsError, showNotification]);

  useEffect(() => {
    if (pointsData?.total_points !== undefined && pointsData.total_points < prevPoints) {
      setPointsSpent(prevPoints - pointsData.total_points);
      const timeout = setTimeout(() => setPointsSpent(0), 700);
      return () => clearTimeout(timeout);
    }
    setPrevPoints(pointsData?.total_points ?? 0);
  }, [pointsData?.total_points, prevPoints]);

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

  const handleManageMembers = useCallback(async () => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to manage members.", "error");
      return;
    }
    const controller = new AbortController();
    try {
      await fetchBoardMembersList(board_id, controller.signal);
      setMembersDialogOpen(true);
    } catch (err) {
      if (err.name === "AbortError") return;
      showNotification(`Failed to load members: ${err.message}`, "error");
    }
    return () => controller.abort();
  }, [userRole, board_id, fetchBoardMembersList, showNotification]);

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

  const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const childBoardMenuItems = useMemo(() => {
    const uniqueChildIds = [...new Set(boardItem?.child_board_ids?.filter((id) => id) || [])];
    return uniqueChildIds.map((childId) => (
      <MenuItem
        key={childId}
        onClick={() => {
          navigate(`/board/${childId}`);
          handleMenuClose();
        }}
        aria-label={`Go to child board ${childId.slice(0, 8)}`}
      >
        Go to Child Board {childId.slice(0, 8)}
      </MenuItem>
    ));
  }, [boardItem?.child_board_ids, navigate, handleMenuClose]);

  if (authLoading || boardsLoading || pointsLoading || !isFullyLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh" }}>
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
            <Tooltip title={`Board visibility: ${boardVisibility}`}>
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

          {childBoardMenuItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip title="Child Boards">
                <IconButton
                  aria-controls="board-menu"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  sx={{ bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}
                  aria-label="Open child boards menu"
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
        <Menu
          id="board-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: {
              sx: { borderRadius: theme.shape.borderRadiusMedium },
            },
          }}
        >
          {childBoardMenuItems}
        </Menu>
      </Box>

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

      <Board
        boardId={board_id}
        boardTitle={boardItem?.name}
        token={token}
        currentUser={authData}
        userRole={userRole}
        onPointsUpdate={fetchPointsData}
        onLogout={handleLogout}
        navigate={navigate}
        availableBoards={availableBoards}
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
          token={token}
          userRole={userRole}
        />
      )}

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

      <DeleteConfirmationDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={() => setClearDialogOpen(false)}
        message="Are you sure you want to delete all tweets on this board? This action cannot be undone."
        disabled={boardsLoading}
      />

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