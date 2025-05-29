import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
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
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
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
  Delete,
  Toll,
} from '@mui/icons-material';
import { formatDistanceToNow, format, isValid, parseISO, differenceInSeconds } from 'date-fns';
import { debounce } from 'lodash';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import Board from '../components/social-features/Board/Board';
import useAuth from '../hooks/useAuth';
import EntityDialogs from '../components/Common/EntityDialogs';
import { actionButtonStyles, cancelButtonStyle } from '../styles/BaseStyles';
import AnimatedPoints from '../components/AnimatedPoints/AnimatedPoints';
import PointsDeductionAnimation from '../components/PointsDeductionAnimation/PointsDeductionAnimation';
import { useBoards } from '../hooks/useBoards';
import { usePoints } from '../hooks/usePoints';
import { useGates } from '../hooks/useGates';
import { useClasses } from '../hooks/useClasses';
import { useNotification } from '../context/NotificationContext';

// Animation variants for buttons
const buttonVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((error, errorInfo) => {
    console.error('ErrorBoundary caught:', error, errorInfo);
    setHasError(true);
  }, []);

  if (hasError) {
    return <Box>Something went wrong. Please try again later.</Box>;
  }

  return children;
};

const BoardPage = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Detect mobile (<600px)
  const { board_id } = useParams();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth(navigate);
  const pointsRef = useRef(null);
  const [pointsVisible, setPointsVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [pointsSpent, setPointsSpent] = useState(0);
  const [boardTimestamp, setBoardTimestamp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const isMounted = useRef(true);

  // Hooks
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
    fetchPointsData,
    loading: pointsLoading,
    error: pointsError,
  } = usePoints(token, handleLogout, navigate, true); // Skip initial fetch

  const {
    gates,
    loading: gatesLoading,
    fetchGatesList,
    error: gatesError,
  } = useGates(token, handleLogout, navigate, true);

  const {
    classes,
    loading: classesLoading,
    fetchClassesList,
    error: classesError,
  } = useClasses(token, handleLogout, navigate, true);

  // Prevent body scroll on mobile when page is mounted
  useEffect(() => {
    if (isMobile) {
      const originalStyle = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        width: document.body.style.width,
        height: document.body.style.height,
      };

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100vh';

      return () => {
        document.body.style.overflow = originalStyle.overflow;
        document.body.style.position = originalStyle.position;
        document.body.style.width = originalStyle.width;
        document.body.style.height = originalStyle.height;
      };
    }
  }, [isMobile]);

  // Board timestamp update
  useEffect(() => {
    if (!boardData?.created_at) return;

    const createdAt = parseISO(boardData.created_at);
    if (!isValid(createdAt)) return;

    const updateTimestamp = () => {
      const now = new Date();
      const diffInSeconds = (now - createdAt) / 1000;

      if (diffInSeconds < 7 * 24 * 60 * 60) { // Less than 7 days
        setBoardTimestamp(formatDistanceToNow(createdAt, { addSuffix: true }));
      } else {
        setBoardTimestamp(format(createdAt, 'MMM d'));
      }
    };

    updateTimestamp();

    if (differenceInSeconds < 30 * 60) {
      const interval = setInterval(updateTimestamp, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [boardData?.created_at]);

  const fullBoardDate = useMemo(() => {
    if (!boardData?.created_at) return '';
    const createdAt = parseISO(boardData.created_at);
    return isValid(createdAt) ? format(createdAt, 'PPPPpp') : '';
  }, [boardData?.created_at]);

  // Memoized derived state
  const userRole = useMemo(
    () =>
      boardData && authData
        ? boardData.creator_id === authData?.anonymous_id
          ? 'owner'
          : boardData.is_public
          ? 'viewer'
          : members.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'viewer'
        : 'viewer',
    [boardData, authData, members]
  );

  const isFavorited = useMemo(
    () => boardData?.favorited_by?.some((user) => user.anonymous_id === authData?.anonymous_id) ?? false,
    [boardData?.favorited_by, authData?.anonymous_id]
  );

  const boardVisibility = useMemo(
    () => boardData?.visibility ?? (boardData?.is_public ? 'public' : 'private'),
    [boardData?.visibility, boardData?.is_public]
  );

  // Debounced API calls
  const debouncedFetchBoard = useMemo(
    () =>
      debounce(async (id, signal) => {
        if (!isMounted.current) return;
        try {
          await fetchBoard(id, signal);
        } catch (err) {
          if (err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch board', 'error');
          }
        }
      }, 300),
    [fetchBoard, showNotification]
  );

  const debouncedFetchPoints = useMemo(
    () =>
      debounce(async (signal) => {
        if (!isMounted.current) return;
        try {
          await fetchPointsData(signal);
        } catch (err) {
          if (err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch points', 'error');
          }
        }
      }, 300),
    [fetchPointsData, showNotification]
  );

  // Fetch board data
  useEffect(() => {
    if (!token || !board_id || !isAuthenticated) return;

    const controller = new AbortController();
    debouncedFetchBoard(board_id, controller.signal);

    return () => {
      controller.abort();
      debouncedFetchBoard.cancel();
      isMounted.current = false;
    };
  }, [token, board_id, isAuthenticated, debouncedFetchBoard]);

  // Fetch points when visible
  useEffect(() => {
    if (!token || !isAuthenticated || !pointsVisible) return;

    const controller = new AbortController();
    debouncedFetchPoints(controller.signal);

    return () => {
      controller.abort();
      debouncedFetchPoints.cancel();
    };
  }, [token, isAuthenticated, pointsVisible, debouncedFetchPoints]);

  // Points visibility observer
  useEffect(() => {
    if (!pointsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pointsVisible) {
          setPointsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(pointsRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch gates and classes when editing
  useEffect(() => {
    if (!editDialogOpen || !token || !isAuthenticated || (userRole !== 'owner' && userRole !== 'admin')) return;

    const controller = new AbortController();
    Promise.all([
      fetchGatesList({ visibility: 'public' }, controller.signal),
      fetchClassesList({}, controller.signal),
    ]).catch((err) => {
      if (err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to load gates or classes', 'error');
      }
    });

    return () => controller.abort();
  }, [editDialogOpen, token, isAuthenticated, userRole, fetchGatesList, fetchClassesList, showNotification]);

  // Handle errors
  useEffect(() => {
    if (boardError) {
      showNotification(boardError || 'An error occurred', 'error');
      if (boardError?.includes('Board not found')) {
        setTimeout(() => navigate('/boards'), 2000);
      }
    }
    if (pointsError) {
      showNotification(pointsError || 'Failed to load points', 'error');
    }
    if (gatesError) {
      showNotification(gatesError || 'Failed to load gates', 'error');
    }
    if (classesError) {
      showNotification(classesError || 'Failed to load classes', 'error');
    }
  }, [boardError, pointsError, gatesError, classesError, showNotification, navigate]);

  // Track points changes
  useEffect(() => {
    if (!pointsData?.total_points) return;

    const prevPoints = pointsData.prev_points || pointsData.total_points;
    if (pointsData.total_points < prevPoints) {
      setPointsSpent(prevPoints - pointsData.total_points);
      const timeout = setTimeout(() => setPointsSpent(0), 1000);
      return () => clearTimeout(timeout);
    }
  }, [pointsData?.total_points]);

  // Handlers
  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard || (userRole !== 'owner' && userRole !== 'admin')) return;

    const validationError = validateBoardData(editingBoard);
    if (validationError) {
      showNotification(validationError, 'error');
      return;
    }

    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, {
        name: editingBoard.name,
        description: editingBoard.description,
        is_public: editingBoard.visibility === 'public',
        visibility: editingBoard.visibility,
        type: editingBoard.type,
        gate_id: editingBoard.gate_id || null,
        class_id: editingBoard.class_id || null,
        settings: editingBoard.settings,
        tags: editingBoard.tags,
      });
      showNotification('Board updated', 'success');
      setEditDialogOpen(false);
      setEditingBoard(null);
    } catch (err) {
      showNotification(err.message || 'Failed to update board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, userRole, updateExistingBoard, showNotification]);

  const handleFavorite = useCallback(async () => {
    if (!boardData) return;

    setActionLoading(true);
    try {
      await toggleFavoriteBoard(board_id, isFavorited);
      showNotification(`Board ${isFavorited ? 'unfavorited' : 'favorited'}`, 'success');
    } catch (err) {
      showNotification('Failed to toggle favorite', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [boardData, board_id, isFavorited, toggleFavoriteBoard, showNotification]);

  const handleEdit = useCallback(() => {
    if (userRole !== 'owner' && userRole !== 'admin' || !boardData) {
      showNotification('Cannot edit board: insufficient permissions or board data unavailable', 'error');
      return;
    }
    setEditingBoard({
      board_id: boardData.board_id || '',
      name: boardData.name || '',
      description: boardData.description || '',
      is_public: boardData.is_public || false,
      visibility: boardData.visibility || (boardData.is_public ? 'public' : 'private'),
      type: boardData.type || 'personal',
      gate_id: boardData.gate_id || null,
      class_id: boardData.class_id || null,
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
      current_user: { anonymous_id: authData?.anonymous_id || '', role: userRole },
    });
    setEditDialogOpen(true);
  }, [boardData, authData?.anonymous_id, userRole, showNotification]);

  const handleManageMembers = useCallback(() => {
    if (userRole !== 'owner' && userRole !== 'admin') {
      showNotification('Insufficient permissions to manage members', 'error');
      return;
    }
    setMembersDialogOpen(true);
  }, [userRole, showNotification]);

  const handleShare = useCallback(() => {
    setInviteLink(`${window.location.origin}/board/${board_id}`);
    setShareDialogOpen(true);
  }, [board_id]);

  const handleOpenDeleteDialog = useCallback(() => {
    if (userRole !== 'owner') {
      showNotification('Only the owner can delete the board', 'error');
      return;
    }
    setDeleteDialogOpen(true);
  }, [userRole, showNotification]);

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingBoard(board_id);
      showNotification('Board deleted', 'success');
      navigate('/boards');
    } catch (err) {
      showNotification('Failed to delete board', 'error');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  }, [board_id, deleteExistingBoard, navigate, showNotification]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) {
      showNotification('Invalid share link', 'error');
      return;
    }
    try {
      await navigator.clipboard.write(inviteLink);
      showNotification('Link copied', 'success');
    } catch (err) {
      showNotification('Failed to copy link', 'error');
    } finally {
      setShareDialogOpen(false);
    }
  }, [inviteLink, showNotification]);

  const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleAddMember = useCallback(
    async (boardId, memberData) => {
      setActionLoading(true);
      try {
        const board = boardData;
        if (board?.members?.length >= board?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await addMemberToBoard(boardId, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToBoard, boardData, showNotification]
  );

  const handleRemoveMember = useCallback(
    async (boardId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromBoard(boardId, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
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
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification]
  );

  const handleSaveMembers = useCallback(() => {
    debouncedFetchBoard(board_id);
    setMembersDialogOpen(false);
    showNotification('Members updated successfully!', 'success');
  }, [board_id, debouncedFetchBoard, showNotification]);

  const validateBoardData = useCallback(
    (data) => {
      if (!data?.name?.trim()) return 'Board name is required';
      const s = data.settings || {};
      if (s.max_tweets < 1 || s.max_tweets > 10000) return 'Max tweets must be 1-10000';
      if (s.tweet_cost < 0) return 'Tweet cost must be non-negative';
      if (s.favorite_cost < 0) return 'Favorite cost must be non-negative';
      if (s.points_to_creator < 0 || s.points_to_creator > 100) return 'Points to creator must be 0-100';
      if (s.max_members < 1 || s.max_members > 10000) return 'Max members must be 1-10000';
      if (data.visibility === 'public' && !data.gate_id && !data.class_id && gates?.length > 0) {
        return 'Public boards require a gate or class';
      }
      return '';
    },
    [gates]
  );

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

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    navigate('/login', { state: { from: location.pathname } });
    return null;
  }

  return (
    <ErrorBoundary>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          overflow: { xs: 'hidden', sm: 'auto' },
          touchAction: { xs: 'none', sm: 'auto' },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            zIndex: 100,
            '@media (max-width: 600px)': { transform: 'scale(0.8)' },
          }}
        >
          <AnimatePresence>
            {boardLoading ? (
              <Skeleton variant="circular" width={40} height={40} />
            ) : (
              <>
                <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                  <Tooltip title={`Board visibility: ${boardVisibility}`}>
                    <IconButton aria-label={`Board visibility: ${boardVisibility}`}>
                      {boardVisibility === 'public' ? <Public /> : <Lock />}
                    </IconButton>
                  </Tooltip>
                </motion.div>
                <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                  <Tooltip title={isFavorited ? 'Unfavorite Board' : 'Favorite Board'}>
                    <IconButton
                      onClick={handleFavorite}
                      aria-label={isFavorited ? 'Unfavorite board' : 'Favorite board'}
                      disabled={boardLoading || pointsLoading || actionLoading}
                    >
                      {isFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
                    </IconButton>
                  </Tooltip>
                </motion.div>
                <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                  <Tooltip title="Share Board">
                    <IconButton
                      onClick={handleShare}
                      aria-label="Share board"
                      disabled={boardLoading || actionLoading}
                    >
                      <Share />
                    </IconButton>
                  </Tooltip>
                </motion.div>
                {(userRole === 'owner' || userRole === 'admin') && (
                  <>
                    <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                      <Tooltip title="Manage Members">
                        <IconButton
                          onClick={handleManageMembers}
                          aria-label={`Manage members (current count: ${members?.length || 0})`}
                          disabled={boardLoading || actionLoading}
                        >
                          <Badge badgeContent={members?.length || 0} color="default">
                            <People />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                    <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                      <Tooltip title="Edit Board">
                        <IconButton
                          onClick={handleEdit}
                          aria-label="Edit board"
                          disabled={boardLoading || actionLoading}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                  </>
                )}
                {userRole === 'owner' && (
                  <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                    <Tooltip title="Delete Board">
                      <IconButton
                        onClick={handleOpenDeleteDialog}
                        aria-label="Delete board"
                        disabled={boardLoading || actionLoading}
                      >
                        <Delete color="error" />
                      </IconButton>
                    </Tooltip>
                  </motion.div>
                )}
                {boardData?.child_board_ids?.length > 0 && (
                  <motion.div variants={buttonVariants} initial="initial" animate="animate" exit="exit">
                    <Tooltip title="Child Boards">
                      <IconButton
                        aria-controls="board-menu"
                        aria-haspopup="true"
                        onClick={handleMenuOpen}
                        sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                        aria-label="Open child boards menu"
                        disabled={boardLoading || actionLoading}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </motion.div>
                )}
              </>
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
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '@media (max-width: 600px)': { transform: 'scale(0.8)' },
          }}
        >
          <AnimatePresence>
            {pointsVisible && (
              <motion.div
                key="points"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip title="Available points">
                  <IconButton
                    size="small"
                    aria-label={`Available points: ${pointsData?.total_points || 0}`}
                    disabled={pointsLoading || actionLoading}
                  >
                    <Toll />
                  </IconButton>
                </Tooltip>
                <AnimatedPoints points={pointsData?.total_points || 0} />
                {pointsSpent > 0 && <PointsDeductionAnimation pointsSpent={pointsSpent} />}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: { xs: 'auto', sm: 'visible' },
            touchAction: { xs: 'auto', sm: 'auto' },
          }}
        >
          <Board
            boardId={board_id}
            boardTitle={boardData?.name || ''}
            boardCreatedAt={boardData?.created_at}
            boardTimestamp={boardTimestamp}
            fullBoardDate={fullBoardDate}
            token={token}
            currentUser={authData}
            userRole={userRole}
            points={pointsData}
            onLogout={handleLogout}
            availableBoards={[]}
          />
        </Box>

        <EntityDialogs
          type="boards"
          createOpen={false} // No create dialog needed on BoardPage
          editOpen={editDialogOpen}
          deleteOpen={deleteDialogOpen}
          memberOpen={membersDialogOpen}
          item={{}} // No create item needed
          setItem={() => {}} // No create item setter
          editingItem={editingBoard}
          setEditingItem={setEditingBoard}
          itemToDelete={board_id}
          setItemToDelete={() => {}} // No need to update itemToDelete
          onSaveCreate={() => {}} // No create action
          onSaveEdit={handleUpdateBoard}
          onCancelCreate={() => {}} // No create cancel
          onCancelEdit={() => {
            setEditDialogOpen(false);
            setEditingBoard(null);
          }}
          onConfirmDelete={handleDelete}
          onCloseDelete={() => setDeleteDialogOpen(false)}
          selectedId={board_id}
          members={members || []}
          addMember={handleAddMember}
          removeMember={handleRemoveMember}
          updateMemberRole={handleUpdateMemberRole}
          onSaveMembers={handleSaveMembers}
          onCancelMembers={() => setMembersDialogOpen(false)}
          disabled={boardLoading || gatesLoading || classesLoading || actionLoading}
          loading={actionLoading}
          token={token}
          gates={gates || []}
          classes={classes || []}
        />

        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          sx={{ '& .MuiDialog-paper': { borderRadius: theme.shape.borderRadiusMedium } }}
          aria-labelledby="share-dialog-title"
        >
          <DialogTitle id="share-dialog-title">Share Board</DialogTitle>
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
              disabled={boardLoading || actionLoading}
            >
              Close
            </Button>
            <Button
              onClick={handleCopyLink}
              sx={actionButtonStyles}
              startIcon={<Link />}
              aria-label="Copy share link"
              disabled={boardLoading || actionLoading}
            >
              Copy Link
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ErrorBoundary>
  );
});

BoardPage.propTypes = {
  token: PropTypes.string,
  authData: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    avatar: PropTypes.string,
    anonymous_id: PropTypes.string,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default BoardPage;