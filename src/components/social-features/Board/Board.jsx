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

const MAX_TWEET_LENGTH = 280;

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
  const [preloadParentTweets, setPreloadParentTweets] = useState({});

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

  const isFetching = useRef(false);

  // Fetch tweets and preload parent tweets
  useEffect(() => {
    const controller = new AbortController();
    const preloadParents = async () => {
      const parentIds = [...new Set(tweets.filter(t => t.parent_tweet_id).map(t => t.parent_tweet_id))];
      if (!parentIds.length) return;

      try {
        const parentPromises = parentIds.map(id => fetchTweet(id));
        const parents = await Promise.all(parentPromises);
        const parentMap = parentIds.reduce((acc, id, index) => {
          const parent = parents[index];
          if (parent?.content?.value) {
            acc[id] = parent.content.value;
          }
          return acc;
        }, {});
        setPreloadParentTweets(prev => ({ ...prev, ...parentMap }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification('Failed to preload parent tweets', 'error');
        }
      }
    };

    const loadTweets = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await fetchTweets({}, controller.signal);
        if (tweets.length) {
          await preloadParents();
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          showNotification('Failed to load tweets', 'error');
        }
      } finally {
        isFetching.current = false;
      }
    };

    loadTweets();

    return () => {
      controller.abort();
      isFetching.current = false;
    };
  }, [fetchTweets, fetchTweet, showNotification, boardId]);

  // Center board after loading
  useEffect(() => {
    if (!loading && boardMainRef.current) {
      centerBoard();
    }
  }, [loading, centerBoard]);

  const handlePopupSubmit = useCallback(
    async (content, x, y, scheduledAt, files, onProgress) => {
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
    tweet => {
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
    fn => {
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
    e => handleMouseUp(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleMouseUp, throttlePopup]
  );

  const handleTouchEndWithPopup = useCallback(
    e => handleTouchEnd(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleTouchEnd, throttlePopup]
  );

  const loadAvailableBoards = useCallback(async () => {
    try {
      const data = await fetchBoardsList();
      return data?.boards.filter(b => b.board_id) || [];
    } catch (err) {
      showNotification('Failed to load boards', 'error');
      return [];
    }
  }, [fetchBoardsList, showNotification]);

  const handleEditTweet = useCallback(
    async tweet => {
      const boards = await loadAvailableBoards();
      setSelectedBoardId(tweet.board_id || boardId);
      setNewStatus(tweet.status || 'approved');
      setEditTweetModal({ ...tweet, availableBoards: boards });
    },
    [loadAvailableBoards, boardId]
  );

  const handlePinToggle = useCallback(
    async tweet => {
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
    tweetId => {
      const relatedIds = new Set([tweetId]);
      const tweet = tweets.find(t => t.tweet_id === tweetId);
      if (tweet) {
        if (tweet.parent_tweet_id) relatedIds.add(tweet.parent_tweet_id);
        tweet.child_tweet_ids?.forEach(id => relatedIds.add(id));
      }
      return Array.from(relatedIds);
    },
    [tweets]
  );

  const handleReplyHover = useCallback(tweetId => setHighlightedTweetId(tweetId), []);

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
    return tweets.filter(tweet => {
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
        typeof tweet.position.y !== 'number'
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
    return validTweets.map(tweet => {
      const replyCount = validTweets.filter(t => t.parent_tweet_id === tweet.tweet_id).length;
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
            parentTweetText={tweet.parent_tweet_id ? preloadParentTweets[tweet.parent_tweet_id] || null : null}
            relatedTweetIds={relatedTweetIds}
            availableBoards={editTweetModal?.availableBoards || availableBoards}
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
    preloadParentTweets,
    availableBoards,
    editTweetModal,
    boardId,
  ]);

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => fetchTweets()}
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
                <Box onClick={e => e.stopPropagation()}>
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
                  onChange={e =>
                    setEditTweetModal(prev => ({
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
                      ? `Content exceeds ${MAX_TWEET_LENGTH} characters`
                      : `${editTweetModal.content?.value?.length || 0}/${MAX_TWEET_LENGTH}`
                  }
                />
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Tweet Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="Tweet Status"
                    onChange={e => setNewStatus(e.target.value)}
                    aria-label="Tweet status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="announcement">Announcement</MenuItem>
                    <MenuItem value="reminder">Reminder</MenuItem>
                    <MenuItem value="pinned">Pinned</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
                {(editTweetModal.availableBoards || availableBoards).length > 0 && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Move to Board</InputLabel>
                    <Select
                      value={selectedBoardId}
                      label="Move to Board"
                      onChange={e => setSelectedBoardId(e.target.value)}
                      aria-label="Move to board"
                    >
                      {(editTweetModal.availableBoards || availableBoards).map(b => (
                        <MenuItem key={b.board_id} value={b.board_id}>
                          {b.name}
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
                  aria-label="Save edited tweet"
                  disabled={
                    !editTweetModal.content?.value?.trim() ||
                    (editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                  }
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
      name: PropTypes.string.isRequired,
    })
  ),
};

Board.defaultProps = {
  availableBoards: [],
};

export default memo(Board);