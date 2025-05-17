import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { RestartAlt, Add, ArrowBack, Remove, ViewList, ViewModule, Refresh } from '@mui/icons-material';
import TweetContentStyles from '../Tweet/tweetContentStyles';
import { BOARD_SIZE, useBoardInteraction } from '../../../hooks/useBoard';
import LoadingSpinner from '../../Layout/LoadingSpinner';
import DraggableTweet from '../Tweet/Tweet';
import TweetContent from '../Tweet/TweetContent';
import TweetPopup from '../Tweet/TweetPopup';
import { useTweets } from '../../../hooks/useTweets';
import { useBoards } from '../../../hooks/useBoards';
import { useNotification } from '../../../context/NotificationContext';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';

const MAX_TWEET_LENGTH = 1000;

const Board = ({
  boardId,
  boardTitle,
  token,
  currentUser,
  userRole,
  onPointsUpdate,
  onLogout,
  availableBoards = [],
}) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const boardMainRef = useRef(null);
  const [tweetPopup, setTweetPopup] = useState({ visible: false });
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedTweetId, setHighlightedTweetId] = useState(null);
  const [editTweetModal, setEditTweetModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [boards, setBoards] = useState(availableBoards);
  const [isListView, setIsListView] = useState(false);
  const [page, setPage] = useState(1);
  const [boardState, setBoardState] = useState(null);
  const isFetching = useRef(false);

  const {
    tweets,
    setTweets, // Assumed to be provided by useTweets
    loading,
    error,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    pinTweet,
    unpinTweet,
    pagination,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const { fetchBoardsList } = useBoards(token, onLogout, navigate);
  const {
    scale,
    offset,
    dragging,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    restoreBoardState,
  } = useBoardInteraction(boardMainRef);

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () =>
      debounce(async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
          await fetchTweets({ include_parents: true, page: 1, limit: 20 * page });
          setPage(1);
          showNotification('Board refreshed successfully!', 'success');
        } catch (err) {
          if (err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to refresh board', 'error');
            if (err.message?.includes('Board not found')) {
              showNotification('Board not found, redirecting to boards list...', 'error');
              setTimeout(() => navigate('/boards'), 2000);
            }
          }
        } finally {
          isFetching.current = false;
        }
      }, 1000),
    [fetchTweets, showNotification, navigate, page]
  );

  // Fetch tweets only on mount
  useEffect(() => {
    if (!token || !boardId) return;

    const controller = new AbortController();
    const fetchData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await fetchTweets({ include_parents: true, page: 1, limit: 20 }, controller.signal);
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification(err.message || 'Failed to load tweets', 'error');
          if (err.message?.includes('Board not found')) {
            showNotification('Board not found, redirecting to boards list...', 'error');
            setTimeout(() => navigate('/boards'), 2000);
          }
        }
      } finally {
        isFetching.current = false;
      }
    };

    fetchData();
    return () => {
      controller.abort();
      debouncedRefresh.cancel();
    };
  }, []); // Empty deps for mount-only fetch

  // Fetch boards list only when editing tweet (cached)
  useEffect(() => {
    if (!editTweetModal || boards.length > 0) return;

    const controller = new AbortController();
    const fetchBoards = async () => {
      try {
        const boardsData = await fetchBoardsList({}, controller.signal);
        const validBoards = boardsData?.boards.filter((b) => b.board_id) || [];
        setBoards(validBoards);
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification('Failed to load boards', 'error');
        }
      }
    };

    fetchBoards();
    return () => controller.abort();
  }, [editTweetModal, boards, fetchBoardsList, showNotification]);

  // Center board after loading
  useEffect(() => {
    if (!loading && boardMainRef.current && !isListView) {
      centerBoard();
    }
  }, [loading, centerBoard, isListView]);

  // Tweet creation with optimistic update
  const handleTweetCreation = useCallback(
    async (content, x, y, scheduledAt, files, onProgress) => {
      if (content.value.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, 'error');
        return;
      }
      try {
        const newTweet = await createNewTweet(
          content,
          x,
          y,
          replyTweet?.tweet_id,
          false,
          'approved',
          scheduledAt,
          null,
          files,
          onProgress
        );
        await onPointsUpdate();
        showNotification('Tweet created successfully!', 'success');
        setTweetPopup({ visible: false });
        setReplyTweet(null);
        return newTweet;
      } catch (err) {
        setTweets((prev) => prev.filter((t) => t.tweet_id));
        showNotification(err.message || 'Failed to create tweet', 'error');
        throw err;
      }
    },
    [createNewTweet, onPointsUpdate, replyTweet, showNotification, boardId, currentUser, setTweets]
  );

  // Handle reply
  const handleReply = useCallback(
    (tweet) => {
      setReplyTweet(tweet);
      setTweetPopup({
        visible: true,
        x: tweet.position.x,
        y: tweet.position.y,
      });
    },
    []
  );

  // Throttle popup
  const throttlePopup = useCallback(
    (fn) => {
      let lastCall = 0;
      return (...args) => {
        const now = Date.now();
        if (now - lastCall >= 300) {
          lastCall = now;
          fn(...args);
        }
      };
    },
    []
  );

  const handleMouseUpWithPopup = useCallback(
    (e) => {
      if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root')) {
        handleMouseUp(e);
        return;
      }
      handleMouseUp(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y })));
    },
    [handleMouseUp, throttlePopup]
  );

  const handleTouchEndWithPopup = useCallback(
    (e) => {
      if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root')) {
        handleTouchEnd(e);
        return;
      }
      handleTouchEnd(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y })));
    },
    [handleTouchEnd, throttlePopup]
  );

  // Edit tweet
  const handleEditTweet = useCallback(
    (tweet) => {
      setSelectedBoardId(tweet.board_id || boardId);
      setNewStatus(tweet.status || 'approved');
      setEditTweetModal({ ...tweet, availableBoards: boards });
    },
    [boards, boardId]
  );

    // Pin toggle
    const handlePinToggle = useCallback(
      async (tweet) => {
        try {
          const action = tweet.is_pinned ? unpinTweet : pinTweet;
          await action(tweet.tweet_id);
          showNotification(`Tweet ${tweet.is_pinned ? 'unpinned' : 'pinned'} successfully!`, 'success');
        } catch (err) {
          showNotification('Failed to toggle pin status', 'error');
        }
      },
      [pinTweet, unpinTweet, showNotification]
    );
  // Save edited tweet with optimistic update
  const handleSaveEditedTweet = useCallback(async () => {
    if (!editTweetModal) return;
    if (!editTweetModal.content?.value?.trim()) {
      showNotification('Tweet content cannot be empty', 'error');
      return;
    }
    if (editTweetModal.content.value.length > MAX_TWEET_LENGTH) {
      showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, 'error');
      return;
    }

    const updatedTweet = {
      ...editTweetModal,
      content: {
        type: editTweetModal.content?.type || 'text',
        value: editTweetModal.content?.value || '',
        metadata: editTweetModal.content?.metadata || {},
      },
      status: newStatus,
      board_id: selectedBoardId,
    };

    try {
      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === editTweetModal.tweet_id ? updatedTweet : t))
      );

      await updateExistingTweet(editTweetModal.tweet_id, {
        content: updatedTweet.content,
        status: newStatus,
        position: editTweetModal.position,
      });

      if (editTweetModal.board_id !== selectedBoardId) {
        await moveTweet(editTweetModal.tweet_id, selectedBoardId);
        setTweets((prev) => prev.filter((t) => t.tweet_id !== editTweetModal.tweet_id));
        debouncedRefresh(); // Refetch only when moving to another board
      }

      setEditTweetModal(null);
      showNotification('Tweet updated successfully!', 'success');
    } catch (err) {
      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === editTweetModal.tweet_id ? editTweetModal : t))
      );
      showNotification('Failed to save tweet', 'error');
    }
  }, [editTweetModal, updateExistingTweet, moveTweet, newStatus, selectedBoardId, showNotification, setTweets, debouncedRefresh]);

  // Toggle like with optimistic update


  // Pin toggle with optimistic update
  // Load more tweets in list view
  const handleLoadMore = useCallback(() => {
    setPage((prev) => prev + 1);
    debouncedRefresh();
  }, [debouncedRefresh]);

  // Get related tweet IDs
  const getRelatedTweetIds = useCallback(
    (tweetId) => {
      const relatedIds = new Set([tweetId]);
      const tweet = tweets.find((t) => t.tweet_id === tweetId);
      if (tweet) {
        if (tweet.parent_tweet_id) relatedIds.add(tweet.parent_tweet_id);
        tweet.child_tweet_ids?.forEach((id) => relatedIds.add(id));
      }
      return Array.from(relatedIds);
    },
    [tweets]
  );

  const handleReplyHover = useCallback((tweetId) => setHighlightedTweetId(tweetId), []);

  // Toggle view
  const handleViewToggle = useCallback(() => {
    setIsListView((prev) => {
      if (!prev) {
        setBoardState({ scale, offset });
      } else {
        if (boardState) {
          restoreBoardState(boardState);
        } else {
          centerBoard();
        }
      }
      return !prev;
    });
    setPage(1);
  }, [scale, offset, boardState, restoreBoardState, centerBoard]);

  // Filter and sort valid tweets
  const validTweets = useMemo(() => {
    if (!Array.isArray(tweets)) {
      console.error('Tweets is not an array:', tweets);
      return [];
    }
    const seenIds = new Set();
    return tweets
      .filter((tweet) => {
        const isValid =
          tweet &&
          tweet.tweet_id &&
          typeof tweet.tweet_id === 'string' &&
          tweet.tweet_id.trim() &&
          !seenIds.has(tweet.tweet_id) &&
          tweet.position &&
          typeof tweet.position.x === 'number' &&
          typeof tweet.position.y === 'number' &&
          !isNaN(tweet.position.x) &&
          !isNaN(tweet.position.y) &&
          tweet.content &&
          typeof tweet.content === 'object' &&
          tweet.content.type &&
          tweet.content.value !== undefined &&
          tweet.content.metadata;
        if (!isValid) console.error('Invalid tweet:', tweet);
        seenIds.add(tweet.tweet_id);
        return isValid;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [tweets]);

  // Memoized tweet props to prevent unnecessary re-renders
  const tweetProps = useMemo(
    () => ({
      currentUser,
      userRole,
      onLike: toggleLikeTweet,
      onDelete: deleteExistingTweet,
      onReply: handleReply,
      onReplyHover: handleReplyHover,
      onEdit: handleEditTweet,
      onPinToggle: handlePinToggle,
      availableBoards: editTweetModal?.availableBoards || boards,
      boardId,
      isListView,
    }),
    [
      currentUser,
      userRole,
      toggleLikeTweet,
      deleteExistingTweet,
      handleReply,
      handleReplyHover,
      handleEditTweet,
      handlePinToggle,
      editTweetModal,
      boards,
      boardId,
      isListView,
    ]
  );

  // Render single tweet
  const renderTweet = useCallback(
    (tweet) => {
      const replyCount = tweet.child_tweet_ids?.length || 0;
      const relatedTweetIds = highlightedTweetId ? getRelatedTweetIds(highlightedTweetId) : [];
      const tweetContent = (
        <TweetContent
          key={`content-${tweet.tweet_id}`}
          tweet={tweet}
          {...tweetProps}
          isParentHighlighted={relatedTweetIds.includes(tweet.tweet_id)}
          replyCount={replyCount}
          parentTweetText={
            tweet.parent_tweet_id
              ? tweets.find((t) => t.tweet_id === tweet.parent_tweet_id)?.content?.value || null
              : null
          }
          relatedTweetIds={relatedTweetIds}
        />
      );

      if (isListView) {
        return (
          <motion.div
            key={`tweet-${tweet.tweet_id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            sx={TweetContentStyles.boardListViewTweet(tweet.parent_tweet_id)}
          >
            {tweetContent}
          </motion.div>
        );
      }

      return (
        <DraggableTweet
          key={`tweet-${tweet.tweet_id}`}
          tweet={tweet}
          onStop={(e, data) => {
            if (e.target.closest('.MuiIconButton-root, .MuiTypography-root, .MuiChip-root')) return;
            updateExistingTweet(tweet.tweet_id, { position: { x: data.x, y: data.y } });
          }}
          currentUser={currentUser}
          userRole={userRole}
        >
          {tweetContent}
        </DraggableTweet>
      );
    },
    [highlightedTweetId, getRelatedTweetIds, tweets, tweetProps, updateExistingTweet]
  );

  // Memoize rendered tweets
  const renderedTweets = useMemo(() => {
    if (!validTweets.length) return null;
    return (
      <AnimatePresence>
        {validTweets.map((tweet) => renderTweet(tweet))}
      </AnimatePresence>
    );
  }, [validTweets, renderTweet]);

  // Render error state
  const renderError = useCallback(
    () => (
      <Box sx={TweetContentStyles.boardErrorContainer}>
        <Typography sx={TweetContentStyles.boardErrorText}>{error}</Typography>
        <Button
          variant="contained"
          onClick={debouncedRefresh}
          sx={TweetContentStyles.boardErrorButton}
          aria-label="Retry fetching tweets"
        >
          Retry
        </Button>
      </Box>
    ),
    [error, debouncedRefresh]
  );

  // Render loading state
  if (loading && page === 1) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={TweetContentStyles.boardContainer}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Back Button */}
        <Box sx={TweetContentStyles.boardBackButtonContainer}>
          <Tooltip title="Go back">
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back to previous page"
              sx={TweetContentStyles.boardBackButton}
            >
              <ArrowBack fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Board Area */}
        <Box
          ref={boardMainRef}
          sx={TweetContentStyles.boardMain(isListView, dragging)}
          onMouseDown={isListView ? undefined : handleMouseDown}
          onMouseMove={isListView ? undefined : handleMouseMove}
          onMouseUp={isListView ? undefined : handleMouseUpWithPopup}
          onWheel={isListView ? undefined : handleWheel}
          onTouchStart={isListView ? undefined : handleTouchStart}
          onTouchMove={isListView ? undefined : handleTouchMove}
          onTouchEnd={isListView ? undefined : handleTouchEndWithPopup}
          role="region"
          aria-label={isListView ? 'Tweet list view' : 'Interactive board canvas'}
          aria-live="polite"
          tabIndex={0}
        >
          {error && renderError()}

          {isListView ? (
            <Box sx={TweetContentStyles.boardListViewContainer}>
              {validTweets.length === 0 ? (
                <Typography sx={TweetContentStyles.boardEmptyMessage}>
                  No tweets yet. Create one to get started!
                </Typography>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderedTweets}
                  {loading && <LoadingSpinner />}
                  {tweets.length < pagination.total && (
                    <Button
                      variant="outlined"
                      onClick={handleLoadMore}
                      sx={{ mt: 2, alignSelf: 'center' }}
                      aria-label="Load more tweets"
                    >
                      Load More
                    </Button>
                  )}
                </motion.div>
              )}
            </Box>
          ) : (
            <Box sx={TweetContentStyles.boardCanvas(scale, offset)}>
              <Box sx={TweetContentStyles.boardTitleContainer(scale)}>
                <Typography sx={TweetContentStyles.boardTitle(boardTitle.length)}>
                  {boardTitle}
                </Typography>
              </Box>
              {validTweets.length === 0 ? (
                <Box sx={TweetContentStyles.boardEmptyMessage}>
                  <Typography variant="body1" color="text.secondary">
                    No tweets yet. Click or tap anywhere to create one!
                  </Typography>
                </Box>
              ) : (
                renderedTweets
              )}
              {tweetPopup.visible && (
                <TweetPopup
                  x={tweetPopup.x}
                  y={tweetPopup.y}
                  onSubmit={handleTweetCreation}
                  onClose={() => {
                    setTweetPopup({ visible: false });
                    setReplyTweet(null);
                  }}
                />
              )}
            </Box>
          )}

          {/* View Toggle, Zoom Controls, and Refresh Button */}
          <Box sx={TweetContentStyles.boardControlsContainer}>
            <Tooltip title={isListView ? 'Switch to board view' : 'Switch to list view'}>
              <Button
                variant="contained"
                startIcon={isListView ? <ViewModule /> : <ViewList />}
                onClick={handleViewToggle}
                aria-label={isListView ? 'Show as board' : 'Show as list'}
                sx={TweetContentStyles.boardViewToggleButton}
              >
                {isListView ? 'Board' : 'List'}
              </Button>
            </Tooltip>
            <Tooltip title="Refresh board">
              <IconButton
                onClick={debouncedRefresh}
                size="small"
                aria-label="Refresh board"
                sx={TweetContentStyles.boardZoomButton}
                disabled={loading}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isListView && (
              <>
                <AnimatePresence>
                  {Math.abs(scale - 1) > 0.01 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Tooltip title="Reset zoom">
                        <IconButton
                          onClick={() => handleZoomButton('reset')}
                          size="small"
                          aria-label="Reset board zoom to 100%"
                          sx={TweetContentStyles.boardZoomButton}
                        >
                          <RestartAlt fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Tooltip title="Zoom out">
                  <IconButton
                    onClick={() => handleZoomButton('out')}
                    size="small"
                    aria-label="Zoom out board"
                    sx={TweetContentStyles.boardZoomButton}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography sx={TweetContentStyles.boardZoomText}>
                  {Math.round(scale * 100)}%
                </Typography>
                <Tooltip title="Zoom in">
                  <IconButton
                    onClick={() => handleZoomButton('in')}
                    size="small"
                    aria-label="Zoom in board"
                    sx={TweetContentStyles.boardZoomButton}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Edit Tweet Modal */}
        {editTweetModal && (
          <Dialog
            open
            onClose={() => setEditTweetModal(null)}
            maxWidth="sm"
            fullWidth
            sx={TweetContentStyles.boardEditDialog}
          >
            <DialogTitle sx={TweetContentStyles.boardEditDialogTitle}>
              Edit Tweet
            </DialogTitle>
            <DialogContent sx={TweetContentStyles.boardEditDialogContent}>
              <TextField
                multiline
                fullWidth
                label="Tweet Content"
                value={editTweetModal.content?.value || ''}
                onChange={(e) =>
                  setEditTweetModal((prev) => ({
                    ...prev,
                    content: { ...prev.content, value: e.target.value },
                  }))
                }
                minRows={3}
                inputProps={{ maxLength: MAX_TWEET_LENGTH }}
                error={(editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH}
                helperText={
                  (editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                    ? `Tweet exceeds ${MAX_TWEET_LENGTH} characters`
                    : `${editTweetModal.content?.value?.length || 0}/${MAX_TWEET_LENGTH}`
                }
                sx={TweetContentStyles.boardEditTextField}
                aria-label="Tweet content"
              />
              <FormControl fullWidth sx={TweetContentStyles.boardEditFormControl}>
                <InputLabel id="status-label">Tweet Status</InputLabel>
                <Select
                  labelId="status-label"
                  value={newStatus}
                  label="Tweet Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                  aria-label="Tweet status"
                >
                  {['pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived'].map(
                    (status) => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
              {boards.length > 0 && (
                <FormControl fullWidth sx={TweetContentStyles.boardEditFormControl}>
                  <InputLabel id="board-label">Move to Board</InputLabel>
                  <Select
                    labelId="board-label"
                    value={selectedBoardId}
                    label="Move to Board"
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    aria-label="Move to board"
                  >
                    {boards.map((board) => (
                      <MenuItem key={board.board_id} value={board.board_id}>
                        {board.title || board.name || 'Untitled Board'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setEditTweetModal(null)}
                sx={TweetContentStyles.boardEditCancelButton}
                aria-label="Cancel edit tweet"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedTweet}
                variant="contained"
                disabled={
                  !editTweetModal.content?.value?.trim() ||
                  (editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                }
                sx={TweetContentStyles.boardEditSaveButton}
                aria-label="Save edited tweet"
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </motion.div>
  );
};

Board.propTypes = {
  boardId: PropTypes.string.isRequired,
  boardTitle: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  userRole: PropTypes.string.isRequired,
  onPointsUpdate: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  availableBoards: PropTypes.arrayOf(
    PropTypes.shape({
      board_id: PropTypes.string.isRequired,
      title: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

Board.defaultProps = {
  availableBoards: [],
};

export default memo(Board);