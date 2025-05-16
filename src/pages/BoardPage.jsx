import React, { useState, useCallback, useEffect, useMemo, memo, useRef } from "react";
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
import BoardFormDialog from "../components/Dialogs/BoardFormDialog";
import MemberFormDialog from "../components/Dialogs/MemberFormDialog";
import DeleteConfirmationDialog from "../components/Dialogs/DeleteConfirmationDialog";
import { useNotification } from "../context/NotificationContext";
import { actionButtonStyles, cancelButtonStyle } from "../styles/BaseStyles";
import AnimatedPoints from "../components/AnimatedPoints/AnimatedPoints";
import PointsDeductionAnimation from "../components/PointsDeductionAnimation/PointsDeductionAnimation";
import { useBoards } from "../hooks/useBoards";
import { usePoints } from "../hooks/usePoints";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";

const BoardPage = memo(() => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const { board_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const pointsRef = useRef(null);
  const [pointsVisible, setPointsVisible] = useState(false);

  const [editingBoard, setEditingBoard] = useState(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [inviteLink, setInviteLink] = useState("");
  const [prevPoints, setPrevPoints] = useState(0);
  const [pointsSpent, setPointsSpent] = useState(0);

  // Initialize hooks
  const {
    boardItem: boardData,
    members,
    loading: boardLoading,
    error: boardError,
    fetchBoard,
    updateExistingBoard,
    toggleFavoriteBoard,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
  } = useBoards(token, handleLogout, navigate);

  const {
    pointsData,
    loading: pointsLoading,
    error: pointsError,
    fetchPointsData,
  } = usePoints(token, handleLogout, navigate);

  const {
    gates,
    loading: gatesLoading,
    error: gatesError,
    fetchGatesList,
  } = useGates(token, handleLogout, navigate);

  const {
    classes,
    loading: classesLoading,
    error: classesError,
    fetchClassesList,
  } = useClasses(token, handleLogout, navigate);

  const userRole = useMemo(() => {
    if (!boardData || !authData) return "viewer";
    return boardData.creator_id === authData?.anonymous_id
      ? "owner"
      : boardData.is_public
      ? "viewer"
      : members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || "viewer";
  }, [boardData, authData, members]);

  const isFavorited = useMemo(
    () => boardData?.favorited_by?.some((user) => user.anonymous_id === authData?.anonymous_id) ?? false,
    [boardData?.favorited_by, authData?.anonymous_id]
  );

  const boardVisibility = useMemo(
    () => boardData?.visibility ?? (boardData?.is_public ? "public" : "private"),
    [boardData?.visibility, boardData?.is_public]
  );

  // Intersection observer for points UI visibility
  useEffect(() => {
    if (!pointsRef.current || pointsLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pointsData && !pointsLoading) {
          setPointsVisible(true);
          const controller = new AbortController();
          fetchPointsData(controller.signal).catch((err) => {
            if (err.name !== "AbortError") {
              showNotification(err.message || "Failed to load points", "error");
            }
          });
          return () => controller.abort();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(pointsRef.current);
    return () => observer.disconnect();
  }, [pointsRef, pointsData, pointsLoading, fetchPointsData, showNotification]);

  // Handle board errors
  useEffect(() => {
    if (boardError) {
      showNotification(boardError || "Error loading board", "error");
      if (boardError?.includes("Board not found")) {
        setTimeout(() => navigate("/boards"), 2000);
      }
    }
    if (pointsError) {
      showNotification(pointsError || "Error loading points", "error");
    }
    if (gatesError) {
      showNotification(gatesError || "Error loading gates", "error");
    }
    if (classesError) {
      showNotification(classesError || "Error loading classes", "error");
    }
  }, [boardError, pointsError, gatesError, classesError, showNotification, navigate]);

  // Track points changes for animation
  useEffect(() => {
    if (pointsData?.total_points !== undefined && pointsData.total_points < prevPoints) {
      setPointsSpent(prevPoints - pointsData.total_points);
      const timeout = setTimeout(() => setPointsSpent(0), 700);
      return () => clearTimeout(timeout);
    }
    setPrevPoints(pointsData?.total_points ?? 0);
  }, [pointsData?.total_points, prevPoints]);

  // Fetch board data for specific actions
  const fetchBoardData = useCallback(async () => {
    if (boardData || boardLoading) return;
    const controller = new AbortController();
    try {
      await fetchBoard(board_id, controller.signal);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load board", "error");
      }
    }
    return () => controller.abort();
  }, [boardData, boardLoading, fetchBoard, board_id, showNotification]);

  // Fetch gates and classes when editing board
  useEffect(() => {
    if (!editingBoard || !token || !isAuthenticated || (userRole !== "owner" && userRole !== "admin")) return;

    const controller = new AbortController();
    Promise.all([
      fetchGatesList({ visibility: "public" }, controller.signal),
      fetchClassesList({}, controller.signal),
    ]).catch((err) => {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load gates or classes", "error");
      }
    });

    return () => controller.abort();
  }, [editingBoard, token, isAuthenticated, userRole, fetchGatesList, fetchClassesList, showNotification]);

  const validateBoardData = useCallback(
    (data) => {
      if (!data?.name?.trim()) return "Board name is required";
      const s = data.settings || {};
      if (s.max_tweets < 1 || s.max_tweets > 10000) return "Max tweets must be 1-10000";
      if (s.tweet_cost < 0) return "Tweet cost must be non-negative";
      if (s.favorite_cost < 0) return "Favorite cost must be non-negative";
      if (s.points_to_creator < 0 || s.points_to_creator > 100) return "Points to creator must be 0-100";
      if (s.max_members < 1 || s.max_members > 10000) return "Max members must be 1-10000";
      if (data.visibility === "public" && !data.gate_id && !data.class_id && gates?.length > 0) {
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
      await updateExistingBoard(editingBoard.board_id, {
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
      showNotification("Board updated successfully!", "success");
      setEditingBoard(null);
    } catch (err) {
      showNotification(err.message || "Failed to update board", "error");
    }
  }, [editingBoard, userRole, validateBoardData, updateExistingBoard, showNotification]);

  const handleFavorite = useCallback(async () => {
    if (!boardData) await fetchBoardData();
    if (!boardData) return;
    try {
      await toggleFavoriteBoard(board_id, isFavorited);
      showNotification(`Board ${isFavorited ? "unfavorited" : "favorited"} successfully!`, "success");
    } catch (err) {
      showNotification("Failed to toggle favorite", "error");
    }
  }, [boardData, fetchBoardData, board_id, isFavorited, toggleFavoriteBoard, showNotification]);

  const handleEdit = useCallback(async () => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to edit this board.", "error");
      return;
    }
    if (!boardData) await fetchBoardData();
    if (!boardData) return;
    setEditingBoard({
      board_id: boardData.board_id,
      name: boardData.name || "",
      description: boardData.description || "",
      is_public: boardData.is_public || false,
      visibility: boardData.visibility || (boardData.is_public ? "public" : "private"),
      type: boardData.type || "personal",
      gate_id: boardData.gate_id || "",
      class_id: boardData.class_id || "",
      settings: {
        max_tweets: boardData.settings?.max_tweets || 100,
        tweet_cost: boardData.settings?.tweet_cost || 1,
        max_members: boardData.settings?.max_members || 50,
        favorite_cost: boardData.settings?.favorite_cost || 1,
        points_to_creator: boardData.settings?.points_to_creator || 1,
        allow_invites: boardData.settings?.allow_invites !== false,
        require_approval: boardData.settings?.require_approval || false,
        ai_moderation_enabled: boardData.settings?.ai_moderation_enabled !== false,
        auto_archive_after: boardData.settings?.auto_archive_after || 30,
      },
      tags: boardData.tags || [],
      current_user: { anonymous_id: authData?.anonymous_id, role: userRole },
    });
  }, [boardData, authData?.anonymous_id, userRole, fetchBoardData, showNotification]);

  const handleManageMembers = useCallback(async () => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to manage members.", "error");
      return;
    }
    if (!boardData) await fetchBoardData();
    if (!boardData) return;
    setMembersDialogOpen(true);
  }, [userRole, boardData, fetchBoardData, showNotification]);

  const handleShare = useCallback(async () => {
    if (!boardData) await fetchBoardData();
    if (!boardData) return;
    const boardUrl = `${window.location.origin}/board/${board_id}`;
    setInviteLink(boardUrl);
    setShareDialogOpen(true);
  }, [boardData, fetchBoardData, board_id]);

  const handleOpenDeleteDialog = useCallback(async () => {
    if (userRole !== "owner") {
      showNotification("You do not have permission to delete this board.", "error");
      return;
    }
    if (!boardData) await fetchBoardData();
    if (!boardData) return;
    setDeleteDialogOpen(true);
  }, [userRole, boardData, fetchBoardData, showNotification]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteExistingBoard(board_id);
      showNotification("Board deleted successfully!", "success");
      navigate("/boards");
    } catch (err) {
      showNotification("Failed to delete board", "error");
    }
    setDeleteDialogOpen(false);
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
    const uniqueChildIds = [...new Set(boardData?.child_board_ids?.filter((id) => id) || [])];
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
  }, [boardData?.child_board_ids, navigate, handleMenuClose]);

  const handleChildBoardsMenuOpen = useCallback(
    async (event) => {
      if (!boardData) await fetchBoardData();
      if (!boardData) return;
      setAnchorEl(event.currentTarget);
    },
    [boardData, fetchBoardData]
  );

  const handleClearBoard = useCallback(async () => {
    if (userRole !== "owner" && userRole !== "admin") {
      showNotification("You do not have permission to clear this board.", "error");
      return;
    }
    setClearDialogOpen(false);
    showNotification("Clear board functionality not implemented.", "warning");
  }, [userRole, showNotification]);

  if (authLoading) {
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
          {boardData && (
            <>
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
            </>
          )}

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
                    aria-label={`Manage members (current count: ${members?.length || 0})`}
                  >
                    <Badge badgeContent={members?.length || 0} color="default">
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

          {boardData?.child_board_ids?.length > 0 && (
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
                  onClick={handleChildBoardsMenuOpen}
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
        ref={pointsRef}
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
        {pointsVisible && (
          <>
            <Tooltip title="Available points">
              <IconButton size="small" aria-label="Available points">
                <Toll />
              </IconButton>
            </Tooltip>
            <AnimatedPoints points={pointsData?.total_points || 0} />
            {pointsSpent > 0 && <PointsDeductionAnimation pointsSpent={pointsSpent} />}
          </>
        )}
      </Box>

      <Board
        boardId={board_id}
        boardTitle={boardData?.name || ""}
        token={token}
        currentUser={authData}
        userRole={userRole}
        onPointsUpdate={() => {
          if (!pointsVisible) setPointsVisible(true);
          fetchPointsData();
        }}
        onLogout={handleLogout}
        navigate={navigate}
        availableBoards={[]}
      />

      {editingBoard && (
        <BoardFormDialog
          open={true}
          title="Edit Board"
          board={editingBoard}
          setBoard={setEditingBoard}
          onSave={handleUpdateBoard}
          onCancel={() => setEditingBoard(null)}
          disabled={boardLoading || gatesLoading || classesLoading}
          gates={gates || []}
          classes={classes || []}
          token={token}
          userRole={userRole}
        />
      )}

      {membersDialogOpen && (
        <MemberFormDialog
          open={membersDialogOpen}
          title="Manage Board Members"
          boardId={board_id}
          token={token}
          onSave={() => {
            fetchBoard(board_id);
            setMembersDialogOpen(false);
          }}
          onCancel={() => setMembersDialogOpen(false)}
          disabled={userRole !== "owner" && userRole !== "admin"}
          members={members || []}
          addMember={(boardId, memberData) => addMemberToBoard(boardId, memberData)}
          removeMember={(boardId, username) => removeMemberFromBoard(boardId, username)}
          updateMemberRole={(boardId, username, role) => updateMemberRole(boardId, username, role)}
        />
      )}

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
        onConfirm={handleClearBoard}
        message="Are you sure you want to delete all tweets on this board? This action cannot be undone."
        disabled={boardLoading}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this board? This action cannot be undone."
        disabled={boardLoading}
      />
    </Box>
  );
});

export default BoardPage;