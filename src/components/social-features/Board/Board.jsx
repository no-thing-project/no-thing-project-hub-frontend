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
  alpha,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { RestartAlt, Add, ArrowBack, Remove, ViewList, ViewModule } from '@mui/icons-material';
import { BOARD_SIZE, useBoardInteraction } from '../../../hooks/useBoard';
import LoadingSpinner from '../../Layout/LoadingSpinner';
import DraggableTweet from '../Tweet/Tweet';
import TweetContent from '../Tweet/TweetContent';
import TweetPopup from '../Tweet/TweetPopup';
import { useTweets } from '../../../hooks/useTweets';
import { useBoards } from '../../../hooks/useBoards';
import { useNotification } from '../../../context/NotificationContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

const MAX_TWEET_LENGTH = 1000;
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
  const [isListView, setIsListView] = useState(false);
  const [page, setPage] = useState(1);
  const isFetching = useRef(false);

  const {
    tweets,
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

  // Fetch data (tweets and boards)
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const cacheKey = `boards:${token}`;

    if (isFetching.current) return;
    isFetching.current = true;

    try {
      await debouncedFetchTweets({ include_parents: true, page, limit: 20 }, controller.signal);
      if (cachedBoards.length === 0 && !apiCache.has(cacheKey)) {
        const boardsData = await fetchBoardsList();
        const validBoards = boardsData?.boards.filter((b) => b.board_id) || [];
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

    return () => controller.abort();
  }, [cachedBoards.length, fetchBoardsList, page, showNotification, token]);

  const debouncedFetchTweets = useMemo(
    () => debounce(fetchTweets, 300),
    [fetchTweets]
  );

  useEffect(() => {
    fetchData();
    return () => debouncedFetchTweets.cancel();
  }, [fetchData, debouncedFetchTweets]);

  // Center board after loading
  useEffect(() => {
    if (!loading && boardMainRef.current) {
      centerBoard();
    }
  }, [loading, centerBoard]);

  // Handle infinite scroll in list view
  const handleScroll = useMemo(
    () =>
      throttle(() => {
        if (!isListView || loading || isFetching.current) return;
        const boardElement = boardMainRef.current;
        if (
          boardElement &&
          boardElement.scrollTop + boardElement.clientHeight >= boardElement.scrollHeight - 100 &&
          tweets.length >= page * 20
        ) {
          setPage((prev) => prev + 1);
        }
      }, 200),
    [isListView, loading, tweets.length, page]
  );

  useEffect(() => {
    const boardElement = boardMainRef.current;
    if (isListView && boardElement) {
      boardElement.addEventListener('scroll', handleScroll);
      return () => boardElement.removeEventListener('scroll', handleScroll);
    }
  }, [isListView, handleScroll]);

  // Tweet creation
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
        showNotification(err.message || 'Failed to create tweet', 'error');
        throw err;
      }
    },
    [createNewTweet, onPointsUpdate, replyTweet, showNotification]
  );

  // Handle reply
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
    (e) => handleMouseUp(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleMouseUp, throttlePopup]
  );

  const handleTouchEndWithPopup = useCallback(
    (e) => handleTouchEnd(e, throttlePopup((x, y) => setTweetPopup({ visible: true, x, y }))),
    [handleTouchEnd, throttlePopup]
  );

  // Edit tweet
  const handleEditTweet = useCallback(
    (tweet) => {
      setSelectedBoardId(tweet.board_id || boardId);
      setNewStatus(tweet.status || 'approved');
      setEditTweetModal({ ...tweet, availableBoards: cachedBoards });
    },
    [cachedBoards, boardId]
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

  // Save edited tweet
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
  }, [editTweetModal, updateExistingTweet, moveTweet, newStatus, selectedBoardId, showNotification]);

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
    setIsListView((prev) => !prev);
    setPage(1);
    if (!isListView) centerBoard();
  }, [isListView, centerBoard]);

  // Calculate title font size
  const titleFontSize = useMemo(
    () => `${Math.min(16, 100 / (boardTitle.length || 1))}vw`,
    [boardTitle]
  );

  // Filter and sort valid tweets
  const validTweets = useMemo(() => {
    if (!Array.isArray(tweets)) {
      console.warn('Tweets is not an array:', tweets);
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
        if (!isValid) console.warn('Invalid tweet:', tweet);
        seenIds.add(tweet.tweet_id);
        return isValid;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [tweets]);

  // Render single tweet
  const renderTweet = useCallback(
    (tweet) => {
      console.log('Rendering tweet:', tweet.tweet_id, 'Position:', tweet.position); // Debug log
      const replyCount = validTweets.filter((t) => t.parent_tweet_id === tweet.tweet_id).length;
      const relatedTweetIds = highlightedTweetId ? getRelatedTweetIds(highlightedTweetId) : [];
      const tweetContent = (
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
      );

      if (isListView) {
        return (
          <motion.div
            key={`tweet-${tweet.tweet_id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            sx={{
              width: '100%',
              maxWidth: { xs: '95vw', sm: '600px' },
              mx: 'auto',
              mb: 2,
              pl: tweet.parent_tweet_id ? 4 : 0,
              borderLeft: tweet.parent_tweet_id
                ? (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
                : 'none',
            }}
          >
            {tweetContent}
          </motion.div>
        );
      }

      return (
        <DraggableTweet
          key={`tweet-${tweet.tweet_id}`}
          tweet={tweet}
          onStop={(e, data) => updateExistingTweet(tweet.tweet_id, { position: { x: data.x, y: data.y } })}
          currentUser={currentUser}
          userRole={userRole}
        >
          {tweetContent}
        </DraggableTweet>
      );
    },
    [
      validTweets,
      highlightedTweetId,
      getRelatedTweetIds,
      tweets,
      isListView,
      currentUser,
      userRole,
      toggleLikeTweet,
      deleteExistingTweet,
      handleReply,
      handleReplyHover,
      handleEditTweet,
      handlePinToggle,
      editTweetModal,
      cachedBoards,
      boardId,
      updateExistingTweet,
    ]
  );

  // Render tweets
  const renderedTweets = useMemo(() => {
    console.log('Valid tweets count:', validTweets.length); // Debug log
    if (!validTweets.length) return null;
    return validTweets.map(renderTweet);
  }, [validTweets, renderTweet]);

  // Render error state
  const renderError = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography color="error" sx={{ mb: 2, fontWeight: 500, fontSize: '1rem' }}>
        {error}
      </Typography>
      <Button
        variant="contained"
        onClick={() => debouncedFetchTweets({ include_parents: true })}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          px: 3,
          py: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'scale(1.03)', bgcolor: 'primary.light' },
        }}
        aria-label="Retry fetching board data"
      >
        Retry
      </Button>
    </Box>
  );

  // Render loading state
  if (loading && page === 1) return <LoadingSpinner />;

  // Render main UI
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Back Button */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1100 }}>
            <Tooltip title="Go back">
              <IconButton
                onClick={() => navigate(-1)}
                aria-label="Go back to previous page"
                sx={{
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': { bgcolor: 'grey.100', transform: 'scale(1.1)' },
                }}
              >
                <ArrowBack fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Main Board Area */}
          <Box
            ref={boardMainRef}
            sx={{
              flex: 1,
              position: 'relative',
              overflow: isListView ? 'auto' : 'hidden',
              cursor: isListView ? 'default' : dragging ? 'grabbing' : 'grab',
              touchAction: isListView ? 'auto' : 'none',
              bgcolor: isListView ? 'grey.50' : 'background.paper',
            }}
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
              <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
                {validTweets.length === 0 ? (
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
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
                  </motion.div>
                )}
              </Box>
            ) : (
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
                      color: 'grey.300',
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
                      onSubmit={handleTweetCreation}
                      onClose={() => {
                        setTweetPopup({ visible: false });
                        setReplyTweet(null);
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* View Toggle and Zoom Controls */}
            <Box
              sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1100,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 0.75,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': { transform: 'scale(1.03)' },
                '@media (max-width: 600px)': { transform: 'scale(0.9)', gap: 1 },
              }}
            >
              <Tooltip title={isListView ? 'Switch to board view' : 'Switch to list view'}>
                <Button
                  variant="contained"
                  startIcon={isListView ? <ViewModule /> : <ViewList />}
                  onClick={handleViewToggle}
                  aria-label={isListView ? 'Show as board' : 'Show as list'}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: { xs: 1.5, sm: 2 },
                    py: 0.5,
                    bgcolor: 'grey.100',
                    color: 'text.primary',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      transform: 'scale(1.03)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                    '@media (max-width: 600px)': { fontSize: '0.75rem', px: 1 },
                  }}
                >
                  {isListView ? 'Board' : 'List'}
                </Button>
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
                            sx={{
                              bgcolor: 'grey.100',
                              '&:hover': { bgcolor: 'grey.200', transform: 'scale(1.1)' },
                            }}
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
                      sx={{
                        bgcolor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.200', transform: 'scale(1.1)' },
                      }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, color: 'text.secondary', fontWeight: 500 }}
                  >
                    {Math.round(scale * 100)}%
                  </Typography>
                  <Tooltip title="Zoom in">
                    <IconButton
                      onClick={() => handleZoomButton('in')}
                      size="small"
                      aria-label="Zoom in board"
                      sx={{
                        bgcolor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.200', transform: 'scale(1.1)' },
                      }}
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
              sx={{ '& .MuiDialog-paper': { borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', p: 2 } }}
            >
              <DialogTitle sx={{ fontWeight: 500, fontSize: { xs: '1.1rem', sm: '1.25rem' }, pb: 1 }}>
                Edit Tweet
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: 'primary.main' },
                      '&.Mui-focused fieldset': {
                        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    },
                  }}
                  aria-label="Tweet content"
                />
                <FormControl fullWidth>
                  <InputLabel id="status-label">Tweet Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={newStatus}
                    label="Tweet Status"
                    onChange={(e) => setNewStatus(e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    }}
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
                  <FormControl fullWidth>
                    <InputLabel id="board-label">Move to Board</InputLabel>
                    <Select
                      labelId="board-label"
                      value={selectedBoardId}
                      label="Move to Board"
                      onChange={(e) => setSelectedBoardId(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                      }}
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
              <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                  onClick={() => setEditTweetModal(null)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'grey.100', transform: 'scale(1.03)' },
                  }}
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
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: 'scale(1.03)',
                      bgcolor: 'primary.light',
                    },
                    '&:disabled': { bgcolor: 'grey.300', color: 'grey.500', boxShadow: 'none' },
                  }}
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