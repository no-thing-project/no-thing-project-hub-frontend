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
import { RestartAlt, Add, ArrowBack, Remove } from '@mui/icons-material';
import { BOARD_SIZE, useBoardInteraction } from '../../../hooks/useBoard';
import LoadingSpinner from '../../Layout/LoadingSpinner';
import DraggableTweet from '../Tweet/Tweet';
import TweetContent from '../Tweet/TweetContent';
import TweetPopup from '../Tweet/TweetPopup';
import { useTweets } from '../../../hooks/useTweets';
import { useBoards } from '../../../hooks/useBoards';
import { useNotification } from '../../../context/NotificationContext';

const MAX_TWEET_LENGTH = 1000;

// Simple in-memory cache for API requests
const apiCache = new Map();

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
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedTweetId, setHighlightedTweetId] = useState(null);
  const [editTweetModal, setEditTweetModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [cachedBoards, setCachedBoards] = useState(availableBoards);
  const isFetching = useRef(false);

  const {
    tweets,
    loading,
    error,
    pinnedTweets,
    fetchTweets,
    fetchTweet,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    pinTweet,
    unpinTweet,
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
  } = useBoardInteraction(boardMainRef);

  // Fetch tweets and boards once
  useEffect(() => {
    const controller = new AbortController();
    const cacheKey = `boards:${token}`;

    const loadData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        // Fetch tweets with include_parents option (assuming backend supports it)
        await fetchTweets({ include_parents: true }, controller.signal);

        // Fetch boards only if not in cache or prop
        if (cachedBoards.length === 0 && !apiCache.has(cacheKey)) {
          const boardsData = await fetchBoardsList();
          const validBoards = boardsData?.boards.filter(b => b.board_id) || [];
          setCachedBoards(validBoards);
          apiCache.set(cacheKey, validBoards);
        } else if (apiCache.has(cacheKey)) {
          setCachedBoards(apiCache.get(cacheKey));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification('Failed to load data', 'error');
        }
      } finally {
        isFetching.current = false;
      }
    };

    loadData();

    return () => {
      controller.abort();
      isFetching.current = false;
    };
  }, [fetchTweets, fetchBoardsList, showNotification, boardId, token, cachedBoards.length]);

  // Center board after loading
  useEffect(() => {
    if (!loading && boardMainRef.current) {
      centerBoard();
    }
  }, [loading, centerBoard]);

  const handlePopupSubmit = useCallback(
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
        showNotification(err.message || 'Failed to create tweet', 'error');
        throw err;
      }
    },
    [createNewTweet, onPointsUpdate, replyTweet, showNotification]
  );

  const handleReply = useCallback(
    (tweet) => {
      const tweetElement = document.getElementById(`tweet-${tweet.tweet_id}`);
      const parentTweetHeight = tweetElement ? tweetElement.getBoundingClientRect().height : 150;
      setReplyTweet(tweet);
      setTweetPopup({
        visible: true,
        x: tweet.position.x,
        y: tweet.position.y + (parentTweetHeight + 10) / scale,
      });
    },
    [scale]
  );

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
    (e) => handleMouseUp(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleMouseUp, throttlePopup]
  );

  const handleTouchEndWithPopup = useCallback(
    (e) => handleTouchEnd(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleTouchEnd, throttlePopup]
  );

  const handleEditTweet = useCallback(
    (tweet) => {
      setSelectedBoardId(tweet.board_id || boardId);
      setNewStatus(tweet.status || 'approved');
      setEditTweetModal({ ...tweet, availableBoards: cachedBoards });
    },
    [cachedBoards, boardId]
  );

  const handlePinToggle = useCallback(
    async (tweet) => {
      try {
        if (tweet.is_pinned) {
          await unpinTweet(tweet.tweet_id);
          showNotification('Tweet unpinned successfully!', 'success');
        } else {
          await pinTweet(tweet.tweet_id);
          showNotification('Tweet pinned successfully!', 'success');
        }
      } catch (err) {
        showNotification('Failed to toggle pin status', 'error');
      }
    },
    [pinTweet, unpinTweet, showNotification]
  );

  const handleSaveEditedTweet = useCallback(
    async () => {
      if (!editTweetModal) return;
      if (!editTweetModal.content?.value?.trim()) {
        showNotification('Tweet content cannot be empty', 'error');
        return;
      }
      if (editTweetModal.content.value.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, 'error');
        return;
      }
      try {
        await updateExistingTweet(editTweetModal.tweet_id, {
          content: {
            type: editTweetModal.content?.type || 'text',
            value: editTweetModal.content?.value || '',
            metadata: editTweetModal.content?.metadata || {},
          },
          status: newStatus,
          position: editTweetModal.position,
        });
        if (editTweetModal.board_id !== selectedBoardId) {
          await moveTweet(editTweetModal.tweet_id, selectedBoardId);
        }
        setEditTweetModal(null);
        showNotification('Tweet updated successfully!', 'success');
      } catch (err) {
        showNotification('Failed to save tweet', 'error');
      }
    },
    [editTweetModal, updateExistingTweet, moveTweet, newStatus, selectedBoardId, showNotification]
  );

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

  const titleFontSize = useMemo(() => {
    const baseSize = Math.min(16, 100 / (boardTitle.length || 1));
    return `${baseSize}vw`;
  }, [boardTitle]);

  // Filter valid tweets with strict validation
  const validTweets = useMemo(() => {
    if (!Array.isArray(tweets)) {
      console.warn('Tweets is not an array:', tweets);
      return [];
    }
    const seenIds = new Set();
    return tweets.filter((tweet) => {
      if (
        !tweet ||
        !tweet.tweet_id ||
        typeof tweet.tweet_id !== 'string' ||
        tweet.tweet_id.trim() === '' ||
        seenIds.has(tweet.tweet_id)
      ) {
        console.warn('Invalid or duplicate tweet:', tweet);
        return false;
      }
      if (
        !tweet.position ||
        typeof tweet.position.x !== 'number' ||
        typeof tweet.position.y !== 'number' ||
        isNaN(tweet.position.x) ||
        isNaN(tweet.position.y)
      ) {
        console.warn('Invalid tweet position:', tweet);
        return false;
      }
      if (
        !tweet.content ||
        typeof tweet.content !== 'object' ||
        !tweet.content.type ||
        tweet.content.value === undefined ||
        !tweet.content.metadata
      ) {
        console.warn('Invalid tweet content:', tweet);
        return false;
      }
      seenIds.add(tweet.tweet_id);
      return true;
    });
  }, [tweets]);

  const renderedTweets = useMemo(() => {
    if (!validTweets.length) return null;
    return validTweets.map((tweet) => {
      const replyCount = validTweets.filter((t) => t.parent_tweet_id === tweet.tweet_id).length;
      const relatedTweetIds = highlightedTweetId ? getRelatedTweetIds(highlightedTweetId) : [];
      return (
        <DraggableTweet
          key={tweet.tweet_id}
          tweet={tweet}
          onStop={(e, data) => updateExistingTweet(tweet.tweet_id, { position: { x: data.x, y: data.y } })}
          currentUser={currentUser}
          userRole={userRole}
        >
          <TweetContent
            tweet={tweet}
            currentUser={currentUser}
            userRole={userRole}
            onLike={toggleLikeTweet}
            onDelete={deleteExistingTweet}
            onReply={handleReply}
            onReplyHover={handleReplyHover}
            onEdit={handleEditTweet}
            onPinToggle={handlePinToggle}
            isParentHighlighted={relatedTweetIds.includes(tweet.tweet_id)}
            replyCount={replyCount}
            parentTweetText={
              tweet.parent_tweet_id
                ? tweets.find((t) => t.tweet_id === tweet.parent_tweet_id)?.content?.value || null
                : null
            }
            relatedTweetIds={relatedTweetIds}
            availableBoards={editTweetModal?.availableBoards || cachedBoards}
            boardId={boardId}
          />
        </DraggableTweet>
      );
    });
  }, [
    validTweets,
    currentUser,
    userRole,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    handleReply,
    handleReplyHover,
    handleEditTweet,
    handlePinToggle,
    highlightedTweetId,
    getRelatedTweetIds,
    cachedBoards,
    editTweetModal,
    boardId,
    tweets,
  ]);

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => fetchTweets({ include_parents: true })}
          aria-label="Retry fetching board data"
        >
          Retry
        </Button>
      </Box>
    );
  }
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '@media (max-width: 600px)': { fontSize: '0.8rem' },
          }}
        >
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1100 }}>
            <Tooltip title="Go back">
              <IconButton
                onClick={() => navigate(-1)}
                aria-label="Go back to previous page"
                sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}
              >
                <ArrowBack fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            ref={boardMainRef}
            sx={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpWithPopup}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEndWithPopup}
            role="region"
            aria-label="Interactive board canvas for creating and viewing tweets"
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: BOARD_SIZE,
                height: BOARD_SIZE,
                backgroundColor: 'background.paper',
                backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) scale(${1 / scale})`,
                  pointerEvents: 'none',
                  maxWidth: '80vw',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    color: '#eee',
                    fontSize: titleFontSize,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    '@media (max-width: 600px)': { fontSize: `calc(${titleFontSize} * 0.8)` },
                  }}
                >
                  {boardTitle}
                </Typography>
              </Box>
              {validTweets.length === 0 ? (
                <Box sx={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Typography variant="body1" color="text.secondary">
                    No tweets yet. Click or tap anywhere to create one!
                  </Typography>
                </Box>
              ) : (
                renderedTweets
              )}
              {tweetPopup.visible && (
                <Box onClick={(e) => e.stopPropagation()}>
                  <TweetPopup
                    x={tweetPopup.x}
                    y={tweetPopup.y}
                    onSubmit={handlePopupSubmit}
                    onClose={() => {
                      setTweetPopup({ visible: false });
                      setReplyTweet(null);
                    }}
                  />
                </Box>
              )}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '@media (max-width: 600px)': { transform: 'scale(0.8)' },
              }}
            >
              <AnimatePresence>
                {Math.abs(scale - 1) > 0.01 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Tooltip title="Reset zoom">
                      <IconButton
                        onClick={() => handleZoomButton('reset')}
                        size="small"
                        aria-label="Reset board zoom to 100%"
                      >
                        <RestartAlt />
                      </IconButton>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
              <Tooltip title="Zoom out">
                <IconButton onClick={() => handleZoomButton('out')} size="small" aria-label="Zoom out board">
                  <Remove />
                </IconButton>
              </Tooltip>
              <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
              <Tooltip title="Zoom in">
                <IconButton onClick={() => handleZoomButton('in')} size="small" aria-label="Zoom in board">
                  <Add />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {editTweetModal && (
            <Dialog open onClose={() => setEditTweetModal(null)} maxWidth="sm" fullWidth>
              <DialogTitle>Edit Tweet</DialogTitle>
              <DialogContent>
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
                  sx={{ mt: 2 }}
                  aria-label="Tweet content"
                  minRows={3}
                  inputProps={{ maxLength: MAX_TWEET_LENGTH }}
                  error={(editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH}
                  helperText={
                    (editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                      ? `Tweet exceeds ${MAX_TWEET_LENGTH} characters`
                      : `${editTweetModal.content?.value?.length || 0}/${MAX_TWEET_LENGTH}`
                  }
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
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
                {cachedBoards.length > 0 && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="board-label">Move to Board</InputLabel>
                    <Select
                      labelId="board-label"
                      value={selectedBoardId}
                      label="Move to Board"
                      onChange={(e) => setSelectedBoardId(e.target.value)}
                      aria-label="Move to board"
                    >
                      {cachedBoards.map((board) => (
                        <MenuItem key={board.board_id} value={board.board_id}>
                          {board.title || board.name || 'Untitled Board'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditTweetModal(null)} aria-label="Cancel edit tweet">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditedTweet}
                  variant="contained"
                  disabled={
                    !editTweetModal.content?.value?.trim() ||
                    (editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                  }
                  aria-label="Save edited tweet"
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
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