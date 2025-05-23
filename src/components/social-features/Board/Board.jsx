import React, { useRef, useState, useEffect, useCallback, useMemo, useReducer, memo } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { RestartAlt, Add, ArrowBack, Remove, ViewList, ViewModule, Refresh } from '@mui/icons-material';
import BoardStyles from './BoardStyles';
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
import { useDeferredValue } from 'react';

// Constants
const MAX_TWEET_LENGTH = 1000;
const Z_INDEX = {
  BOARD: 10,
  TWEET: 99,
  POPUP: 100,
  MODAL: 110,
};

// Reducer for tweet-related state
const tweetReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_POPUP':
      return {
        ...state,
        tweetPopup: { visible: true, x: action.x, y: action.y, clientX: action.clientX, clientY: action.clientY },
        replyTweet: action.replyTweet || null,
      };
    case 'CLOSE_POPUP':
      return { ...state, tweetPopup: { visible: false, x: 0, y: 0, clientX: 0, clientY: 0 }, replyTweet: null };
    case 'SET_EDIT_MODAL':
      return {
        ...state,
        editTweetModal: action.payload,
        newStatus: action.payload?.status || 'approved',
        selectedBoardId: action.payload?.board_id || '',
      };
    case 'CLEAR_EDIT_MODAL':
      return { ...state, editTweetModal: null, newStatus: '', selectedBoardId: '' };
    case 'UPDATE_EDIT_CONTENT':
      return {
        ...state,
        editTweetModal: { ...state.editTweetModal, content: { ...state.editTweetModal.content, value: action.value } },
      };
    case 'SET_NEW_STATUS':
      return { ...state, newStatus: action.status };
    case 'SET_SELECTED_BOARD':
      return { ...state, selectedBoardId: action.boardId };
    case 'SET_HIGHLIGHTED_TWEET':
      return { ...state, highlightedTweetId: action.tweetId };
    default:
      return state;
  }
};

// Custom hook for permission management
const usePermissions = (userRole, currentUser, tweet = null, tweets = null, bypassOwnership = false) => {
  return useMemo(() => {
    const isOwnerOrAdmin = ['owner', 'admin'].includes(userRole);
    const isModerator = userRole === 'moderator';
    const isViewer = userRole === 'viewer';

    // Compute permissions for a single tweet
    const computePermissions = (t) => {
      const isTweetOwner =
        t &&
        (t.anonymous_id === currentUser?.anonymous_id ||
          t.user_id === currentUser?.anonymous_id ||
          (t.username &&
            currentUser?.username &&
            t.username.toLowerCase() === currentUser.username.toLowerCase()));

      return {
        canEdit: bypassOwnership || isOwnerOrAdmin || isModerator || (isViewer && isTweetOwner),
        canPin: isOwnerOrAdmin,
        canChangeStatus: isOwnerOrAdmin,
        canMoveBoard: isOwnerOrAdmin,
        canCreate: isOwnerOrAdmin || isModerator || isViewer,
        canLike: isOwnerOrAdmin || isModerator || isViewer,
        canReply: isOwnerOrAdmin || isModerator || isViewer,
        canDrag: t && !t.is_pinned && (bypassOwnership || isOwnerOrAdmin || isModerator || isTweetOwner),
      };
    };

    // If tweets array is provided, return a Map of permissions
    if (tweets && Array.isArray(tweets)) {
      const permissionsMap = new Map();
      tweets.forEach((t) => {
        if (t.tweet_id) {
          permissionsMap.set(t.tweet_id, computePermissions(t));
        }
      });
      return permissionsMap;
    }

    // Otherwise, return permissions for a single tweet or general permissions
    return computePermissions(tweet);
  }, [userRole, currentUser, tweet, tweets, bypassOwnership]);
};

const Board = ({
  boardId,
  boardTitle,
  token,
  currentUser,
  userRole,
  onLogout,
  availableBoards = [],
}) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const boardMainRef = useRef(null);
  const isFetching = useRef(false);
  const [isListView, setIsListView] = useState(false);
  const [page, setPage] = useState(1);
  const [boards, setBoards] = useState(availableBoards);
  const [isSaving, setIsSaving] = useState(false);

  // Tweet state management with reducer
  const [tweetState, dispatch] = useReducer(tweetReducer, {
    tweetPopup: { visible: false, x: 0, y: 0, clientX: 0, clientY: 0 },
    replyTweet: null,
    highlightedTweetId: null,
    editTweetModal: null,
    newStatus: '',
    selectedBoardId: '',
  });

  const {
    tweets,
    setTweets,
    loading: isLoading,
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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useBoardInteraction(boardMainRef);

  // Permissions
  const permissions = usePermissions(userRole, currentUser);
  const tweetPermissionsMap = usePermissions(userRole, currentUser, null, tweets);
  const deferredTweets = useDeferredValue(tweets);

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () =>
      debounce(async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
          await fetchTweets({ include_parents: true, page: 1, limit: 20 });
          setPage(1);
          centerBoard();
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
    [fetchTweets, showNotification, navigate, centerBoard]
  );

  // Initial fetch and centering
  useEffect(() => {
    if (!token || !boardId) return;

    const controller = new AbortController();
    const fetchData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await fetchTweets({ include_parents: true, page: 1, limit: 20 }, controller.signal);
        centerBoard();
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
  }, [token, boardId, fetchTweets, showNotification, navigate, centerBoard, debouncedRefresh]);

  // Fetch boards list for edit modal
  useEffect(() => {
    if (!tweetState.editTweetModal || boards.length > 0 || !permissions.canMoveBoard) return;

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
  }, [tweetState.editTweetModal, boards, fetchBoardsList, showNotification, permissions.canMoveBoard]);

  /**
   * Handles optimistic updates for tweets
   * @param {Object} tweet - The tweet to update or create
   * @param {Function} optimisticUpdateFn - The function to apply the optimistic update (receives current tweets)
   * @param {Function} serverUpdateFn - The async function to perform the server update
   * @param {Function} rollbackFn - The rollback function (receives current tweets)
   * @param {boolean} isNewTweet - Whether this is a new tweet creation
   */
  const handleOptimisticUpdate = useCallback(
    async (tweet, optimisticUpdateFn, serverUpdateFn, rollbackFn, isNewTweet = false) => {
      // For existing tweets, find the index; for new tweets, skip index check
      const index = isNewTweet ? -1 : tweets.findIndex((t) => t.tweet_id === tweet.tweet_id);
      if (!isNewTweet && index === -1) {
        console.warn('Tweet not found for update:', tweet.tweet_id);
        return;
      }

      // Store original tweets for rollback
      const originalTweets = [...tweets];

      // Apply optimistic update using setTweets
      setTweets((prevTweets) => {
        const newTweets = [...prevTweets];
        optimisticUpdateFn(newTweets);
        return newTweets;
      });

      try {
        await serverUpdateFn();
        showNotification(isNewTweet ? 'Tweet created successfully!' : 'Tweet updated successfully!', 'success');
      } catch (err) {
        // Rollback using setTweets
        setTweets((prevTweets) => {
          const newTweets = [...prevTweets];
          rollbackFn(newTweets);
          return newTweets;
        });
        showNotification(err.message || (isNewTweet ? 'Failed to create tweet' : 'Failed to update tweet'), 'error');
      }
    },
    [tweets, setTweets, showNotification]
  );

  /**
   * Handles tweet creation with optimistic updates
   * @param {Object} content - Tweet content
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Date} scheduledAt - Scheduled time
   * @param {Array} files - Attached files
   * @param {Function} onProgress - Progress callback
   */
  const handleTweetCreation = useCallback(
    async (content, x, y, scheduledAt, files, onProgress) => {
      console.log('handleTweetCreation called with:', { content, x, y, scheduledAt, files });

      if (!permissions.canCreate) {
        showNotification('You do not have permission to create tweets', 'error');
        console.log('Permission check failed: canCreate is false');
        return;
      }
      if (!content?.value?.trim() && (!files || files.length === 0)) {
        showNotification('Tweet must have either content or files', 'error');
        console.log('Content validation failed: both content and files are empty');
        return;
      }
      if (content?.value?.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, 'error');
        console.log('Content validation failed: exceeds max length');
        return;
      }

      const tempTweetId = `temp-${Date.now()}`;
      const optimisticTweet = {
        tweet_id: tempTweetId,
        content: {
          type: 'text',
          value: content?.value || '',
          metadata: { files: files ? files.map((f) => ({ fileKey: f.name, url: URL.createObjectURL(f), contentType: f.type })) : [] },
        },
        position: { x, y },
        parent_tweet_id: tweetState.replyTweet?.tweet_id || null,
        status: 'approved',
        created_at: new Date().toISOString(),
        anonymous_id: currentUser.anonymous_id,
        username: currentUser.username,
        stats: { like_count: 0 },
        is_pinned: false,
        board_id: boardId,
      };

      console.log('Attempting optimistic update for new tweet:', optimisticTweet);

      await handleOptimisticUpdate(
        optimisticTweet,
        (tweets) => {
          tweets.unshift(optimisticTweet);
        },
        async () => {
          console.log('Calling createNewTweet with:', {
            content,
            x,
            y,
            parentTweetId: tweetState.replyTweet?.tweet_id,
            isPinned: false,
            status: 'approved',
            scheduledAt,
            files,
          });
          const newTweet = await createNewTweet(
            content,
            x,
            y,
            tweetState.replyTweet?.tweet_id || null,
            false,
            'approved',
            scheduledAt || null,
            null,
            files || [],
            onProgress
          );
          console.log('createNewTweet response:', newTweet);
          setTweets((prevTweets) => {
            const idx = prevTweets.findIndex((t) => t.tweet_id === tempTweetId);
            if (idx !== -1) {
              const newTweets = [...prevTweets];
              newTweets[idx] = newTweet;
              return newTweets;
            }
            return prevTweets;
          });
        },
        (tweets) => {
          const idx = tweets.findIndex((t) => t.tweet_id === tempTweetId);
          if (idx !== -1) tweets.splice(idx, 1);
        },
        true // isNewTweet flag
      );

      dispatch({ type: 'CLOSE_POPUP' });
    },
    [permissions.canCreate, createNewTweet, tweetState.replyTweet, showNotification, currentUser, boardId, setTweets, handleOptimisticUpdate]
  );

  /**
   * Handles replying to a tweet
   * @param {Object} tweet - The tweet to reply to
   */
  const handleReply = useCallback(
    (tweet) => {
      if (!permissions.canReply) {
        showNotification('You do not have permission to reply to tweets', 'error');
        return;
      }
      const clientX = tweet.position.x * scale + offset.x;
      const clientY = tweet.position.y * scale + offset.y;
      dispatch({ type: 'OPEN_POPUP', x: tweet.position.x, y: tweet.position.y, clientX, clientY, replyTweet: tweet });
    },
    [permissions.canReply, scale, offset, showNotification]
  );

  // Throttled popup trigger
  const throttlePopup = useMemo(
    () =>
      throttle((x, y, clientX, clientY) => {
        if (!permissions.canCreate) {
          showNotification('You do not have permission to create tweets', 'error');
          return;
        }
        dispatch({ type: 'OPEN_POPUP', x, y, clientX, clientY });
      }, 300),
    [permissions.canCreate, showNotification]
  );

  const handleMouseUpWithPopup = useCallback(
    (e) => {
      if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) {
        handleMouseUp(e);
        return;
      }
      handleMouseUp(e, throttlePopup);
    },
    [handleMouseUp, throttlePopup]
  );

  const handleTouchEndWithPopup = useCallback(
    (e) => {
      if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) {
        handleTouchEnd(e);
        return;
      }
      handleTouchEnd(e, throttlePopup);
    },
    [handleTouchEnd, throttlePopup]
  );

  /**
   * Handles editing a tweet
   * @param {Object} tweet - The tweet to edit
   */
  const handleEditTweet = useCallback(
    (tweet) => {
      const tweetPermissions = tweetPermissionsMap.get(tweet.tweet_id);
      if (!tweetPermissions?.canEdit) {
        showNotification('You do not have permission to edit this tweet', 'error');
        return;
      }
      dispatch({ type: 'SET_EDIT_MODAL', payload: { ...tweet, availableBoards: boards } });
    },
    [tweetPermissionsMap, boards, showNotification]
  );

  /**
   * Handles pinning/unpinning a tweet
   * @param {Object} tweet - The tweet to pin/unpin
   */
  const handlePinToggle = useCallback(
    async (tweet) => {
      if (!permissions.canPin) {
        showNotification('You do not have permission to pin tweets', 'error');
        return;
      }
      await handleOptimisticUpdate(
        tweet,
        (tweets) => {
          const idx = tweets.findIndex((t) => t.tweet_id === tweet.tweet_id);
          if (idx !== -1) {
            tweets[idx] = { ...tweets[idx], is_pinned: !tweet.is_pinned };
          }
        },
        async () => {
          const action = tweet.is_pinned ? unpinTweet : pinTweet;
          await action(tweet.tweet_id);
        },
        (tweets) => {
          const idx = tweets.findIndex((t) => t.tweet_id === tweet.tweet_id);
          if (idx !== -1) {
            tweets[idx] = { ...tweets[idx], is_pinned: tweet.is_pinned };
          }
        },
        false
      );
      showNotification(`Tweet ${tweet.is_pinned ? 'unpinned' : 'pinned'} successfully!`, 'success');
    },
    [permissions.canPin, pinTweet, unpinTweet, showNotification, handleOptimisticUpdate]
  );

  /**
   * Handles saving an edited tweet
   */
  const handleSaveEditedTweet = useCallback(
    async () => {
      if (!tweetState.editTweetModal) return;
      const tweetPermissions = tweetPermissionsMap.get(tweetState.editTweetModal.tweet_id);
      if (!tweetPermissions?.canEdit) {
        showNotification('You do not have permission to edit this tweet', 'error');
        return;
      }
      if (!tweetState.editTweetModal.content?.value?.trim()) {
        showNotification('Tweet content cannot be empty', 'error');
        return;
      }
      if (tweetState.editTweetModal.content.value.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, 'error');
        return;
      }

      setIsSaving(true);
      const updatedTweet = {
        ...tweetState.editTweetModal,
        content: {
          type: tweetState.editTweetModal.content?.type || 'text',
          value: tweetState.editTweetModal.content?.value || '',
          metadata: tweetState.editTweetModal.content?.metadata || {},
        },
        status: tweetPermissions.canChangeStatus ? tweetState.newStatus : tweetState.editTweetModal.status,
        board_id: tweetPermissions.canMoveBoard ? tweetState.selectedBoardId : tweetState.editTweetModal.board_id,
      };

      await handleOptimisticUpdate(
        updatedTweet,
        (tweets) => {
          const idx = tweets.findIndex((t) => t.tweet_id === updatedTweet.tweet_id);
          if (idx !== -1) {
            tweets[idx] = { ...tweets[idx], ...updatedTweet };
          }
        },
        async () => {
          await updateExistingTweet(tweetState.editTweetModal.tweet_id, {
            content: updatedTweet.content,
            status: tweetPermissions.canChangeStatus ? tweetState.newStatus : tweetState.editTweetModal.status,
            position: tweetState.editTweetModal.position,
          });
          if (tweetPermissions.canMoveBoard && tweetState.editTweetModal.board_id !== tweetState.selectedBoardId) {
            await moveTweet(tweetState.editTweetModal.tweet_id, tweetState.selectedBoardId);
          }
        },
        (tweets) => {
          const idx = tweets.findIndex((t) => t.tweet_id === updatedTweet.tweet_id);
          if (idx !== -1) {
            tweets[idx] = { ...tweets[idx], ...tweetState.editTweetModal };
          }
        },
        false
      );

      setIsSaving(false);
      dispatch({ type: 'CLEAR_EDIT_MODAL' });
    },
    [tweetState, updateExistingTweet, moveTweet, showNotification, tweetPermissionsMap, handleOptimisticUpdate]
  );

  /**
   * Loads more tweets for pagination
   */
  const handleLoadMore = useCallback(async () => {
    if (isFetching.current || tweets.length >= pagination.total) return;
    isFetching.current = true;
    try {
      await fetchTweets({ include_parents: true, page: page + 1, limit: 20 });
      setPage((prev) => prev + 1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        showNotification('Failed to load more tweets', 'error');
      }
    } finally {
      isFetching.current = false;
    }
  }, [fetchTweets, page, tweets, pagination, showNotification]);

  /**
   * Gets related tweet IDs for highlighting
   * @param {string} tweetId - The tweet ID
   * @returns {string[]} Array of related tweet IDs
   */
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

  /**
   * Toggles between list and board views
   */
  const handleViewToggle = useCallback(() => {
    setIsListView((prev) => {
      if (prev) centerBoard();
      return !prev;
    });
  }, [centerBoard]);

  // Filter and sort valid tweets
  const validTweets = useMemo(() => {
    if (!Array.isArray(deferredTweets)) {
      console.warn('Tweets is not an array:', deferredTweets);
      return [];
    }
    const seenIds = new Set();
    return deferredTweets
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
  }, [deferredTweets]);

  // Memoized tweet props
  const tweetProps = useMemo(
    () => ({
      currentUser,
      userRole,
      onLike: toggleLikeTweet,
      onDelete: deleteExistingTweet,
      onReply: handleReply,
      onReplyHover: (tweetId) => dispatch({ type: 'SET_HIGHLIGHTED_TWEET', tweetId }),
      onEdit: handleEditTweet,
      onPinToggle: handlePinToggle,
      availableBoards: tweetState.editTweetModal?.availableBoards || boards,
      boardId,
      isListView,
    }),
    [
      currentUser,
      userRole,
      toggleLikeTweet,
      deleteExistingTweet,
      handleReply,
      handleEditTweet,
      handlePinToggle,
      tweetState.editTweetModal,
      boards,
      boardId,
      isListView,
    ]
  );

  /**
   * Renders a single tweet
   * @param {Object} tweet - The tweet to render
   * @returns {JSX.Element} The rendered tweet component
   */
  const renderTweet = useCallback(
    (tweet) => {
      const replyCount = tweet.child_tweet_ids?.length || 0;
      const relatedTweetIds = tweetState.highlightedTweetId ? getRelatedTweetIds(tweetState.highlightedTweetId) : [];
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
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            sx={BoardStyles.boardListViewTweet(tweet.parent_tweet_id)}
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
    [tweetState.highlightedTweetId, getRelatedTweetIds, tweets, tweetProps, updateExistingTweet, currentUser, userRole, isListView]
  );

  // Memoized rendered tweets
  const renderedTweets = useMemo(() => {
    if (!validTweets.length) return null;
    return <AnimatePresence>{validTweets.map((tweet) => renderTweet(tweet))}</AnimatePresence>;
  }, [validTweets, renderTweet]);

  /**
   * Renders the error state
   * @returns {JSX.Element} The error UI
   */
  const renderError = useCallback(
    () => (
      <Box sx={BoardStyles.boardErrorContainer}> 
        <Typography sx={BoardStyles.boardErrorText}>{error || 'An error occurred'}</Typography> 
        <Button
          variant="contained"
          onClick={debouncedRefresh}
          sx={BoardStyles.boardErrorButton} 
          aria-label="Retry fetching tweets"
        >
          Retry
        </Button>
      </Box>
    ),
    [error, debouncedRefresh]
  );

  // Render loading state
  if (isLoading && page === 1) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        ...BoardStyles.boardContainer, 
        overflow: 'hidden',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        zIndex: Z_INDEX.BOARD,
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Back Button */}
        <Box sx={BoardStyles.boardBackButtonContainer}> 
          <Tooltip title="Go back">
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back to previous page"
              sx={BoardStyles.boardBackButton} 
            >
              <ArrowBack fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Board Area */}
        <Box
          ref={boardMainRef}
          sx={{
            ...BoardStyles.boardMain(isListView, dragging), 
            touchAction: 'none',
            userSelect: 'none',
            height: '100%',
            width: '100%',
            overflowY: isListView ? 'auto' : 'hidden',
          }}
          onMouseDown={isListView ? undefined : handleMouseDown}
          onMouseMove={isListView ? undefined : handleMouseMove}
          onMouseUp={isListView ? undefined : handleMouseUpWithPopup}
          onTouchStart={isListView ? undefined : handleTouchStart}
          onTouchMove={isListView ? undefined : handleTouchMove}
          onTouchEnd={isListView ? undefined : handleTouchEndWithPopup}
          role="region"
          aria-label={isListView ? 'Tweet list view' : 'Interactive board canvas'}
          aria-live="polite"
          tabIndex={0}
        >
          {error && renderError()}

          <motion.div
            initial={{ opacity: 0, scale: isListView ? 0.95 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isListView ? 0.95 : 1 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {isListView ? (
              <Box sx={BoardStyles.boardListViewContainer}> 
                {validTweets.length === 0 ? (
                  <Typography sx={BoardStyles.boardEmptyMessage}> 
                    No tweets yet. Create one to get started!
                  </Typography>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderedTweets}
                    {isLoading && <LoadingSpinner />}
                    {tweets.length < pagination.total && (
                      <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        sx={{ mt: 2, alignSelf: 'center' }}
                        aria-label="Load more tweets"
                        disabled={isLoading}
                      >
                        Load More
                      </Button>
                    )}
                  </motion.div>
                )}
              </Box>
            ) : (
              <Box sx={BoardStyles.boardCanvas(scale, offset)}> 
                <Box sx={BoardStyles.boardTitleContainer(scale)}> 
                  <Typography sx={BoardStyles.boardTitle(boardTitle.length)}> 
                    {boardTitle}
                  </Typography>
                </Box>
                {validTweets.length === 0 ? (
                  <Box sx={BoardStyles.boardEmptyMessage}> 
                    <Typography variant="body1" color="text.secondary">
                      No tweets yet. Tap or click anywhere to create one!
                    </Typography>
                  </Box>
                ) : (
                  renderedTweets
                )}
                {tweetState.tweetPopup.visible && (
                  <TweetPopup
                    x={tweetState.tweetPopup.x}
                    y={tweetState.tweetPopup.y}
                    clientX={tweetState.tweetPopup.clientX}
                    clientY={tweetState.tweetPopup.clientY}
                    onSubmit={handleTweetCreation}
                    onClose={() => dispatch({ type: 'CLOSE_POPUP' })}
                    scale={scale}
                    offset={offset}
                    zIndex={Z_INDEX.POPUP}
                  />
                )}
              </Box>
            )}
          </motion.div>

          {/* Controls */}
          <Box
            sx={{
              ...BoardStyles.boardControlsContainer, 
              position: 'fixed',
              bottom: { xs: 8, sm: 16 },
              right: { xs: 8, sm: 16 },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <Tooltip title={isListView ? 'Switch to board view' : 'Switch to list view'}>
              <Button
                variant="contained"
                startIcon={isListView ? <ViewModule /> : <ViewList />}
                onClick={handleViewToggle}
                aria-label={isListView ? 'Show as board' : 'Show as list'}
                sx={{
                  ...BoardStyles.boardViewToggleButton, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  padding: { xs: '4px 8px', sm: '6px 16px' },
                }}
              >
                {isListView ? 'Board' : 'List'}
              </Button>
            </Tooltip>
            <Tooltip title="Refresh board">
              <IconButton
                onClick={debouncedRefresh}
                size="small"
                aria-label="Refresh board"
                sx={BoardStyles.boardZoomButton} 
                disabled={isLoading}
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
                          sx={BoardStyles.boardZoomButton} 
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
                    sx={BoardStyles.boardZoomButton} 
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography
                  sx={{
                    ...BoardStyles.boardZoomText, 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  {Math.round(scale * 100)}%
                </Typography>
                <Tooltip title="Zoom in">
                  <IconButton
                    onClick={() => handleZoomButton('in')}
                    size="small"
                    aria-label="Zoom in board"
                    sx={BoardStyles.boardZoomButton} 
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Edit Tweet Modal */}
        {tweetState.editTweetModal && (
          <Dialog
            open
            onClose={() => dispatch({ type: 'CLEAR_EDIT_MODAL' })}
            maxWidth="sm"
            fullWidth
            sx={{ ...BoardStyles.boardEditDialog, zIndex: Z_INDEX.MODAL }} 
            onKeyDown={(e) => e.key === 'Escape' && dispatch({ type: 'CLEAR_EDIT_MODAL' })}
            aria-describedby="edit-tweet-description"
          >
            <DialogTitle sx={BoardStyles.boardEditDialogTitle}>Edit Tweet</DialogTitle> 
            <DialogContent sx={BoardStyles.boardEditDialogContent}> 
              <Typography id="edit-tweet-description" sx={{ display: 'none' }}>
                Edit the content, status, or board of the tweet.
              </Typography>
              <TextField
                multiline
                fullWidth
                label="Tweet Content"
                value={tweetState.editTweetModal.content?.value || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_EDIT_CONTENT', value: e.target.value })}
                minRows={3}
                inputProps={{ maxLength: MAX_TWEET_LENGTH }}
                error={(tweetState.editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH}
                helperText={
                  (tweetState.editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                    ? `Tweet exceeds ${MAX_TWEET_LENGTH} characters`
                    : `${tweetState.editTweetModal.content?.value?.length || 0}/${MAX_TWEET_LENGTH}`
                }
                sx={BoardStyles.boardEditTextField} 
                aria-label="Tweet content"
                autoFocus
              />
              {permissions.canChangeStatus && (
                <FormControl fullWidth sx={BoardStyles.boardEditFormControl}> 
                  <InputLabel id="status-label">Tweet Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={tweetState.newStatus}
                    label="Tweet Status"
                    onChange={(e) => dispatch({ type: 'SET_NEW_STATUS', status: e.target.value })}
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
              )}
              {permissions.canMoveBoard && boards.length > 0 && (
                <FormControl fullWidth sx={BoardStyles.boardEditFormControl}> 
                  <InputLabel id="board-label">Move to Board</InputLabel>
                  <Select
                    labelId="board-label"
                    value={tweetState.selectedBoardId}
                    label="Move to Board"
                    onChange={(e) => dispatch({ type: 'SET_SELECTED_BOARD', boardId: e.target.value })}
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
                onClick={() => dispatch({ type: 'CLEAR_EDIT_MODAL' })}
                sx={BoardStyles.boardEditCancelButton} 
                aria-label="Cancel edit tweet"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedTweet}
                variant="contained"
                disabled={
                  isSaving ||
                  !tweetState.editTweetModal.content?.value?.trim() ||
                  (tweetState.editTweetModal.content?.value?.length || 0) > MAX_TWEET_LENGTH
                }
                sx={BoardStyles.boardEditSaveButton}
                aria-label="Save edited tweet"
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
              >
                {isSaving ? 'Saving...' : 'Save'}
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

// Custom equality check for memoization
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.boardId === nextProps.boardId &&
    prevProps.boardTitle === nextProps.boardTitle &&
    prevProps.token === nextProps.token &&
    prevProps.currentUser.anonymous_id === nextProps.currentUser.anonymous_id &&
    prevProps.currentUser.username === nextProps.currentUser.username &&
    prevProps.userRole === nextProps.userRole &&
    prevProps.onLogout === nextProps.onLogout &&
    prevProps.availableBoards.length === nextProps.availableBoards.length &&
    prevProps.availableBoards.every(
      (board, i) =>
        board.board_id === nextProps.availableBoards[i]?.board_id &&
        board.title === nextProps.availableBoards[i]?.title &&
        board.name === nextProps.availableBoards[i]?.name
    )
  );
};

export default memo(Board, areEqual);