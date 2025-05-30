/**
 * @module Board
 * @description Component for displaying and interacting with a board of tweets.
 */
import React, { useRef, useState, useEffect, useCallback, useMemo, memo, useReducer } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import PropTypes from "prop-types";
import {
  RestartAlt,
  Add,
  ArrowBack,
  Remove,
  ViewList,
  ViewModule,
  Refresh,
  ArrowCircleRight,
  ArrowCircleLeft,
} from "@mui/icons-material";
import BoardStyles from "./BoardStyles";
import { BOARD_SIZE, useBoardInteraction } from "../../../hooks/useBoard";
import { useWebSocket } from "../../../hooks/useWebSocket";
import LoadingSpinner from "../../Layout/LoadingSpinner";
import DraggableTweet from "../Tweet/Tweet";
import TweetContent from "../Tweet/TweetContent";
import TweetPopup from "../Tweet/TweetPopup";
import { useTweets } from "../../../hooks/useTweets";
import { useBoards } from "../../../hooks/useBoards";
import { useNotification } from "../../../context/NotificationContext";
import throttle from "lodash/throttle";
import debounce from "lodash/debounce";

// Constants
const MAX_TWEET_LENGTH = 1000;
const Z_INDEX = {
  BOARD: 10,
  TWEET: 99,
  POPUP: 100,
  MODAL: 110,
  OVERLAY: 109,
};

// Reducer for tweet popup state
const popupReducer = (state, action) => {
  switch (action.type) {
    case "OPEN_POPUP":
      return {
        visible: true,
        x: action.x,
        y: action.y,
        clientX: action.clientX,
        clientY: action.clientY,
        replyTweet: action.replyTweet || null,
      };
    case "CLOSE_POPUP":
      return { visible: false, x: 0, y: 0, clientX: 0, clientY: 0, replyTweet: null };
    default:
      return state;
  }
};

// Reducer for edit modal state
const editModalReducer = (state, action) => {
  switch (action.type) {
    case "SET_EDIT_MODAL":
      return {
        tweet: action.payload,
        newStatus: action.payload?.status || "approved",
        selectedBoardId: action.payload?.board_id || "",
      };
    case "CLEAR_EDIT_MODAL":
      return { tweet: null, newStatus: "", selectedBoardId: "" };
    case "UPDATE_EDIT_CONTENT":
      return {
        ...state,
        tweet: { ...state.tweet, content: { ...state.tweet.content, value: action.value } },
      };
    case "SET_NEW_STATUS":
      return { ...state, newStatus: action.status };
    case "SET_SELECTED_BOARD":
      return { ...state, selectedBoardId: action.boardId };
    default:
      return state;
  }
};

// Custom hook for permission management
const usePermissions = (userRole, currentUser, tweet = null, tweets = null, bypassOwnership = false) => {
  return useMemo(() => {
    const isOwnerOrAdmin = ["owner", "admin"].includes(userRole);
    const isModerator = userRole === "moderator";
    const isViewer = userRole === "viewer";

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

    if (tweets && Array.isArray(tweets)) {
      const permissionsMap = new Map();
      tweets.forEach((t) => {
        if (t.tweet_id) {
          permissionsMap.set(t.tweet_id, computePermissions(t));
        }
      });
      return permissionsMap;
    }

    return computePermissions(tweet);
  }, [userRole, currentUser?.anonymous_id, currentUser?.username, tweet?.tweet_id, tweets?.length, bypassOwnership]);
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
  const [highlightedTweetId, setHighlightedTweetId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const openModals = useRef(new Set());

  const [popupState, dispatchPopup] = useReducer(popupReducer, {
    visible: false,
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    replyTweet: null,
  });

  const [editModalState, dispatchEditModal] = useReducer(editModalReducer, {
    tweet: null,
    newStatus: "",
    selectedBoardId: "",
  });

  const isOverlayOpen = useMemo(() => {
    return popupState.visible || !!editModalState.tweet || openModals.current.size > 0;
  }, [popupState.visible, editModalState.tweet]);

  const handleModalStateChange = useCallback((tweetId, isOpen) => {
    if (isOpen) {
      openModals.current.add(tweetId);
    } else {
      openModals.current.delete(tweetId);
    }
  }, []);

  const {
    tweets,
    tweet,
    setTweet,
    setTweets,
    pagination,
    boardInfo,
    loading: isLoading,
    error,
    fetchTweetsList,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    pinTweet,
    unpinTweet,
    setReminder,
    shareTweet,
    resetState,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const { fetchBoardsList } = useBoards(token, onLogout, navigate);
  const {
    scale,
    offset,
    dragging,
    centerBoard,
    handleZoomButton,
    handleMouseDown: originalHandleMouseDown,
    handleMouseMove: originalHandleMouseMove,
    handleMouseUp: originalHandleMouseUp,
    handleTouchStart: originalHandleTouchStart,
    handleTouchMove: originalHandleTouchMove,
    handleTouchEnd: originalHandleTouchEnd,
  } = useBoardInteraction(boardMainRef);

  const permissions = usePermissions(userRole, currentUser);
  const tweetPermissionsMap = usePermissions(userRole, currentUser, null, tweets);

  const socketRef = useWebSocket(token, boardId, currentUser, setTweets, setOnlineUsers, onLogout, navigate, showNotification);

  // WebSocket event listeners
  useEffect(() => {
    if (!socketRef.current || !boardId || !currentUser?.anonymous_id) return;

    const socket = socketRef.current;

    // Join the board room
    socket.on("connect", () => {
      socket.emit("joinBoard", { board_id: boardId, user_id: currentUser.anonymous_id });
    });

    // Handle online users update
    socket.on("onlineUsersUpdate", (count) => {
      setOnlineUsers(count);
    });

    // Handle new tweet
    socket.on("newTweet", (newTweet) => {
      newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
      setTweets((prev) => {
        if (prev.some((t) => t.tweet_id === newTweet.tweet_id)) {
          return prev; // Avoid duplicates
        }
        return [...prev, newTweet];
      });
    });

    // Handle tweet update
    socket.on("tweetUpdated", (updatedTweet) => {
      updatedTweet.timestamp = updatedTweet.timestamp || new Date().toISOString();
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === updatedTweet.tweet_id ? { ...tweet, ...updatedTweet } : tweet
        )
      );
    });

    // Handle tweet deletion
    socket.on("tweetDeleted", ({ tweet_id }) => {
      setTweets((prev) => prev.filter((t) => t.tweet_id !== tweet_id));
    });

    // Handle tweet like
    socket.on("likeTweet", ({ tweet_id, like_data }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? {
                ...tweet,
                stats: { ...tweet.stats, like_count: (tweet.stats.like_count || 0) + 1 },
                liked_by: [...(tweet.liked_by || []), like_data],
                timestamp: new Date().toISOString(),
              }
            : tweet
        )
      );
    });

    // Handle tweet dislike
    socket.on("dislikeTweet", ({ tweet_id, user_id }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? {
                ...tweet,
                stats: { ...tweet.stats, like_count: Math.max(0, (tweet.stats.like_count || 0) - 1) },
                liked_by: (tweet.liked_by || []).filter((like) => like.anonymous_id !== user_id),
                timestamp: new Date().toISOString(),
              }
            : tweet
        )
      );
    });

    // Handle tweet status update
    socket.on("tweetStatusUpdated", ({ tweet_id, status }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? { ...tweet, status, timestamp: new Date().toISOString() }
            : tweet
        )
      );
    });

    // Handle tweet move
    socket.on("moveTweet", ({ tweet_id, new_board_id }) => {
      if (new_board_id !== boardId) {
        setTweets((prev) => prev.filter((t) => t.tweet_id !== tweet_id));
      } else {
        setTweets((prev) => {
          const movedTweet = prev.find((t) => t.tweet_id === tweet_id);
          if (movedTweet) {
            return prev; // Tweet already in this board
          }
          // Fetch the moved tweet if needed
          fetchTweetsList({ page: 1, limit: 20 });
          return prev;
        });
      }
    });

    // Handle tweet pin
    socket.on("pinTweet", ({ tweet_id }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? { ...tweet, is_pinned: true, timestamp: new Date().toISOString() }
            : tweet
        )
      );
    });

    // Handle tweet unpin
    socket.on("unpinTweet", ({ tweet_id }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? { ...tweet, is_pinned: false, timestamp: new Date().toISOString() }
            : tweet
        )
      );
    });

    // Handle tweet reminder set
    socket.on("setReminder", ({ tweet_id, reminder }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? { ...tweet, reminder, timestamp: new Date().toISOString() }
            : tweet
        )
      );
    });

    // Handle tweet share
    socket.on("tweetShared", ({ tweet_id, share_data }) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet.tweet_id === tweet_id
            ? {
                ...tweet,
                stats: { ...tweet.stats, share_count: (tweet.stats.share_count || 0) + 1 },
                analytics: {
                  ...tweet.analytics,
                  shares: [...(tweet.analytics?.shares || []), share_data],
                },
                timestamp: new Date().toISOString(),
              }
            : tweet
        )
      );
    });

    // Handle board updates
    socket.on("shareTweet", (updatedBoard) => {
      if (updatedBoard.board_id === boardId) {
        showNotification("Board updated", "success");
      }
    });

    // Handle board deletion
    socket.on("boardDeleted", ({ board_id }) => {
      if (board_id === boardId) {
        showNotification("This board has been deleted", "error");
        navigate("/boards");
      }
    });

    // Cleanup listeners on unmount
    return () => {
      // The useWebSocket hook handles socket disconnection
    };
  }, [socketRef, boardId, currentUser?.anonymous_id, setTweets, showNotification, navigate, fetchTweetsList]);

  const debouncedRefresh = useMemo(
    () =>
      debounce(async () => {
        if (isFetching.current) return;
        isFetching.current = true;
        try {
          setTweets([]); // Clear tweets before refresh
          await new Promise((resolve, reject) => {
            fetchTweetsList({ page: 1, limit: 20 }, null, false, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });
          setPage(1);
          centerBoard();
          showNotification("Board refreshed successfully!", "success");
        } catch (err) {
          if (err.name !== "AbortError") {
            showNotification(err.message || "Failed to refresh board", "error");
          }
        } finally {
          isFetching.current = false;
        }
      }, 1000),
    [fetchTweetsList, showNotification, centerBoard, setTweets]
  );

  useEffect(() => {
    if (!token || !boardId) return;

    const controller = new AbortController();
    const fetchData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await new Promise((resolve, reject) => {
          fetchTweetsList({ page: 1, limit: 20 }, controller.signal, false, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        setPage(1);
        centerBoard();
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification(err.message || "Failed to load tweets", "error");
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
  }, [token, boardId, fetchTweetsList, showNotification, centerBoard, debouncedRefresh]);

  useEffect(() => {
    if (!editModalState.tweet || boards.length > 0 || !permissions.canMoveBoard) return;

    const controller = new AbortController();
    const fetchBoards = async () => {
      try {
        const boardsData = await fetchBoardsList({}, controller.signal);
        const validBoards = boardsData?.boards.filter((b) => b.board_id) || [];
        setBoards(validBoards);
      } catch (err) {
        if (err.name !== "AbortError") {
          showNotification("Failed to load boards", "error");
        }
      }
    };

    fetchBoards();
    return () => controller.abort();
  }, [editModalState.tweet, boards, fetchBoardsList, showNotification, permissions.canMoveBoard]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (isOverlayOpen) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isOverlayOpen]);

  const handleOptimisticUpdate = useCallback(
    async (tweet, optimisticUpdateFn, serverUpdateFn, rollbackFn, isNewTweet = false) => {
      const tweetId = tweet.tweet_id;
      try {
        setTweets((prev) => optimisticUpdateFn(tweetId, prev));
        await serverUpdateFn();
      } catch (err) {
        setTweets((prev) => rollbackFn(tweetId, prev));
        showNotification(err.message || (isNewTweet ? "Failed to create tweet" : "Failed to update tweet"), "error");
      }
    },
    [showNotification, setTweets]
  );

  const handleTweetCreation = useCallback(
    async (content, x, y, scheduledAt, files, onProgress) => {
      if (!permissions.canCreate) {
        showNotification("You do not have permission to create tweets", "error");
        return;
      }
      if (!content?.value?.trim() && (!files || files.length === 0)) {
        showNotification("Tweet must have either content or files", "error");
        return;
      }
      if (content?.value?.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, "error");
        return;
      }

      const tempTweetId = `temp-${Date.now()}`;
      const optimisticTweet = {
        tweet_id: tempTweetId,
        content: {
          type: "text",
          value: content?.value || "",
          metadata: { files: files ? files.map((f) => ({ fileKey: f.name, url: URL.createObjectURL(f), contentType: f.type })) : [] },
        },
        position: { x, y },
        parent_tweet_id: popupState.replyTweet?.tweet_id || null,
        status: "approved",
        created_at: new Date().toISOString(),
        anonymous_id: currentUser.anonymous_id,
        username: currentUser.username,
        stats: { like_count: 0, view_count: 0, comment_count: 0, share_count: 0 },
        is_pinned: false,
        board_id: boardId,
        children: [],
      };

      await handleOptimisticUpdate(
        optimisticTweet,
        (tweetId, tweets) => [...tweets, optimisticTweet],
        async () => {
          const newTweet = await createNewTweet(
            content,
            x,
            y,
            popupState.replyTweet?.tweet_id || null,
            false,
            "approved",
            scheduledAt || null,
            null,
            files || [],
            onProgress
          );
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tempTweetId ? newTweet : t))
          );
          // Emit the new tweet via WebSocket
          socketRef.current?.emit("newTweet", newTweet);
        },
        (tweetId, tweets) => tweets.filter((t) => t.tweet_id !== tweetId),
        true
      );

      dispatchPopup({ type: "CLOSE_POPUP" });
    },
    [permissions.canCreate, createNewTweet, popupState.replyTweet, showNotification, currentUser, boardId, handleOptimisticUpdate, setTweets, socketRef]
  );

  const handleReply = useCallback(
    (tweet) => {
      if (!permissions.canReply) {
        showNotification("You do not have permission to reply to tweets", "error");
        return;
      }
      const clientX = tweet.position.x * scale + offset.x;
      const clientY = tweet.position.y * scale + offset.y;
      dispatchPopup({ type: "OPEN_POPUP", x: tweet.position.x, y: tweet.position.y, clientX, clientY, replyTweet: tweet });
    },
    [permissions.canReply, scale, offset, showNotification]
  );

  const throttlePopup = useMemo(
    () =>
      throttle((x, y, clientX, clientY) => {
        if (!permissions.canCreate) {
          showNotification("You do not have permission to create tweets", "error");
          return;
        }
        dispatchPopup({ type: "OPEN_POPUP", x, y, clientX, clientY });
      }, 300),
    [permissions.canCreate, showNotification]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (isOverlayOpen) {
        e.preventDefault();
        return;
      }
      originalHandleMouseDown(e);
    },
    [isOverlayOpen, originalHandleMouseDown]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isOverlayOpen) return;
      originalHandleMouseMove(e);
    },
    [isOverlayOpen, originalHandleMouseMove]
  );

  const handleMouseUpWithPopup = useCallback(
    (e) => {
      if (isOverlayOpen) return;
      if (e.target.closest(".tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root")) {
        originalHandleMouseUp(e);
        return;
      }
      originalHandleMouseUp(e, throttlePopup);
    },
    [isOverlayOpen, originalHandleMouseUp, throttlePopup]
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (isOverlayOpen) {
        return;
      }
      originalHandleTouchStart(e);
    },
    [isOverlayOpen, originalHandleTouchStart]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (isOverlayOpen) {
        e.preventDefault();
        return;
      }
      originalHandleTouchMove(e);
    },
    [isOverlayOpen, originalHandleTouchMove]
  );

  const handleTouchEndWithPopup = useCallback(
    (e) => {
      if (isOverlayOpen) return;
      if (e.target.closest(".tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root")) {
        originalHandleTouchEnd(e);
        return;
      }
      originalHandleTouchEnd(e, throttlePopup);
    },
    [isOverlayOpen, originalHandleTouchEnd, throttlePopup]
  );

  const handleEditTweet = useCallback(
    (tweet) => {
      const tweetPermissions = tweetPermissionsMap.get(tweet.tweet_id);
      if (!tweetPermissions?.canEdit) {
        showNotification("You do not have permission to edit this tweet", "error");
        return;
      }
      dispatchEditModal({ type: "SET_EDIT_MODAL", payload: { ...tweet, availableBoards: boards } });
    },
    [tweetPermissionsMap, boards, showNotification]
  );

  const handlePinToggle = useCallback(
    async (tweet) => {
      if (!permissions.canPin) {
        showNotification("You do not have permission to pin tweets", "error");
        return;
      }
      const isPinning = !tweet.is_pinned;
      await handleOptimisticUpdate(
        tweet,
        (tweetId, tweets) =>
          tweets.map((t) =>
            t.tweet_id === tweetId ? { ...t, is_pinned: isPinning } : t
          ),
        async () => {
          const action = isPinning ? pinTweet : unpinTweet;
          await action(tweet.tweet_id);
          // Emit the pin/unpin event via WebSocket
          socketRef.current?.emit(isPinning ? "pinTweet" : "unpinTweet", { tweet_id: tweet.tweet_id });
        },
        (tweetId, tweets) =>
          tweets.map((t) =>
            t.tweet_id === tweetId ? { ...t, is_pinned: tweet.is_pinned } : t
          ),
        false
      );
      showNotification(`Tweet ${isPinning ? "pinned" : "unpinned"} successfully!`, "success");
    },
    [permissions.canPin, pinTweet, unpinTweet, showNotification, handleOptimisticUpdate, socketRef]
  );

  const handleSaveEditedTweet = useCallback(
    async () => {
      if (!editModalState.tweet) return;
      const tweetPermissions = tweetPermissionsMap.get(editModalState.tweet.tweet_id);
      if (!tweetPermissions?.canEdit) {
        showNotification("You do not have permission to edit this tweet", "error");
        return;
      }
      if (!editModalState.tweet.content?.value?.trim()) {
        showNotification("Tweet content cannot be empty", "error");
        return;
      }
      if (editModalState.tweet.content?.value?.length > MAX_TWEET_LENGTH) {
        showNotification(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`, "error");
        return;
      }

      setIsSaving(true);
      const updatedTweet = {
        ...editModalState.tweet,
        content: {
          type: editModalState.tweet.content?.type || "text",
          value: editModalState.tweet.content?.value || "",
          metadata: editModalState.tweet.content?.metadata || {},
        },
        status: tweetPermissions.canChangeStatus ? editModalState.newStatus : editModalState.tweet.status,
        board_id: tweetPermissions.canMoveBoard ? editModalState.selectedBoardId : editModalState.tweet.board_id,
      };

      await handleOptimisticUpdate(
        updatedTweet,
        (tweetId, tweets) =>
          tweets.map((t) => (t.tweet_id === tweetId ? updatedTweet : t)),
        async () => {
          await updateExistingTweet(editModalState.tweet.tweet_id, {
            content: updatedTweet.content,
            status: tweetPermissions.canChangeStatus ? editModalState.newStatus : editModalState.tweet.status,
            position: editModalState.tweet.position,
          });
          if (tweetPermissions.canMoveBoard && editModalState.tweet.board_id !== editModalState.selectedBoardId) {
            await moveTweet(editModalState.tweet.tweet_id, editModalState.selectedBoardId);
            socketRef.current?.emit("moveTweet", {
              tweet_id: editModalState.tweet.tweet_id,
              new_board_id: editModalState.selectedBoardId,
            });
          }
          // Emit update event via WebSocket
          socketRef.current?.emit("tweetUpdated", updatedTweet);
          if (tweetPermissions.canChangeStatus && editModalState.newStatus !== editModalState.tweet.status) {
            socketRef.current?.emit("tweetStatusUpdated", {
              tweet_id: editModalState.tweet.tweet_id,
              status: editModalState.newStatus,
            });
          }
        },
        (tweetId, tweets) => tweets,
        false
      );

      setIsSaving(false);
      dispatchEditModal({ type: "CLEAR_EDIT_MODAL" });
    },
    [editModalState, updateExistingTweet, moveTweet, showNotification, tweetPermissionsMap, handleOptimisticUpdate, socketRef]
  );

  const handleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!permissions.canLike) {
        showNotification("You do not have permission to like tweets", "error");
        return;
      }
      const likeData = { anonymous_id: currentUser.anonymous_id, username: currentUser.username, liked_at: new Date() };
      await handleOptimisticUpdate(
        { tweet_id: tweetId },
        (tweetId, tweets) =>
          tweets.map((t) =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  stats: {
                    ...t.stats,
                    like_count: isLiked
                      ? Math.max(0, (t.stats.like_count || 0) - 1)
                      : (t.stats.like_count || 0) + 1,
                  },
                  liked_by: isLiked
                    ? (t.liked_by || []).filter((l) => l.anonymous_id !== currentUser.anonymous_id)
                    : [...(t.liked_by || []), likeData],
                }
              : t
          ),
        async () => {
          const updatedTweet = await toggleLikeTweet(tweetId, isLiked);
          // Emit like/dislike event via WebSocket
          socketRef.current?.emit(isLiked ? "dislikeTweet" : "likeTweet", {
            tweet_id: tweetId,
            like_data: isLiked ? null : likeData,
            user_id: isLiked ? currentUser.anonymous_id : null,
          });
        },
        (tweetId, tweets) => tweets,
        false
      );
    },
    [permissions.canLike, toggleLikeTweet, showNotification, currentUser, handleOptimisticUpdate, socketRef]
  );

  const handleDeleteTweet = useCallback(
    async (tweetId) => {
      const tweetPermissions = tweetPermissionsMap.get(tweetId);
      if (!tweetPermissions?.canEdit) {
        showNotification("You do not have permission to delete this tweet", "error");
        return;
      }
      await handleOptimisticUpdate(
        { tweet_id: tweetId },
        (tweetId, tweets) => tweets.filter((t) => t.tweet_id !== tweetId),
        async () => {
          await deleteExistingTweet(tweetId);
          // Emit delete event via WebSocket
          socketRef.current?.emit("tweetDeleted", { tweet_id: tweetId });
        },
        (tweetId, tweets) => tweets,
        false
      );
    },
    [deleteExistingTweet, showNotification, tweetPermissionsMap, handleOptimisticUpdate, socketRef]
  );

  const handleSetReminder = useCallback(
    async (tweetId, reminder) => {
      const tweetPermissions = tweetPermissionsMap.get(tweetId);
      if (!tweetPermissions?.canEdit) {
        showNotification("You do not have permission to set reminders", "error");
        return;
      }
      await handleOptimisticUpdate(
        { tweet_id: tweetId },
        (tweetId, tweets) =>
          tweets.map((t) => (t.tweet_id === tweetId ? { ...t, reminder } : t)),
        async () => {
          await setReminder(tweetId, reminder);
          // Emit reminder event via WebSocket
          socketRef.current?.emit("setReminder", { tweet_id: tweetId, reminder });
        },
        (tweetId, tweets) => tweets,
        false
      );
    },
    [setReminder, showNotification, tweetPermissionsMap, handleOptimisticUpdate, socketRef]
  );

  const handleShareTweet = useCallback(
    async (tweetId, sharedTo) => {
      if (!permissions.canReply) {
        showNotification("You do not have permission to share tweets", "error");
        return;
      }
      const shareData = { user_id: currentUser.anonymous_id, shared_to: sharedTo, shared_at: new Date() };
      await handleOptimisticUpdate(
        { tweet_id: tweetId },
        (tweetId, tweets) =>
          tweets.map((t) =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  stats: { ...t.stats, share_count: (t.stats.share_count || 0) + 1 },
                  analytics: {
                    ...t.analytics,
                    shares: [...(t.analytics?.shares || []), shareData],
                  },
                }
              : t
          ),
        async () => {
          await shareTweet(tweetId, sharedTo);
          // Emit share event via WebSocket
          socketRef.current?.emit("shareTweet", { tweet_id: tweetId, share_data: shareData });
        },
        (tweetId, tweets) => tweets,
        false
      );
    },
    [permissions.canReply, shareTweet, showNotification, currentUser, handleOptimisticUpdate, socketRef]
  );

  const handleLoadMore = useCallback(async () => {
    if (isFetching.current || !pagination.hasMore) return;
    isFetching.current = true;
    try {
      await new Promise((resolve, reject) => {
        fetchTweetsList({ page: page + 1, limit: 20 }, null, true, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      setPage((prev) => prev + 1);
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load more tweets", "error");
      }
    } finally {
      isFetching.current = false;
    }
  }, [fetchTweetsList, page, pagination.hasMore, showNotification]);

  const handlePrevPage = useCallback(async () => {
    if (isFetching.current || page <= 1) return;
    isFetching.current = true;
    try {
      setTweets([]);
      await new Promise((resolve, reject) => {
        fetchTweetsList({ page: page - 1, limit: 20 }, null, false, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      setPage((prev) => prev - 1);
      centerBoard();
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load previous page", "error");
      }
    } finally {
      isFetching.current = false;
    }
  }, [fetchTweetsList, page, showNotification, centerBoard, setTweets]);

  const handleNextPage = useCallback(async () => {
    if (isFetching.current || !pagination.hasMore) return;
    isFetching.current = true;
    try {
      setTweets([]); // Clear tweets before fetching
      await new Promise((resolve, reject) => {
        fetchTweetsList({ page: page + 1, limit: 20 }, null, false, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      setPage((prev) => prev + 1);
      centerBoard();
    } catch (err) {
      if (err.name !== "AbortError") {
        showNotification(err.message || "Failed to load next page", "error");
      }
    } finally {
      isFetching.current = false;
    }
  }, [fetchTweetsList, page, pagination.hasMore, showNotification, centerBoard, setTweets]);

  const getRelatedTweetIds = useCallback(
    (tweetId) => {
      const tweetIds = new Set([tweetId]);
      const tweet = tweets.find((t) => t.tweet_id === tweetId);
      if (tweet) {
        if (tweet.parent_tweet_id) tweetIds.add(tweet.parent_tweet_id);
        tweet.child_tweet_ids?.forEach((id) => tweetIds.add(id));
      }
      return Array.from(tweetIds);
    },
    [tweets]
  );

  const handleViewToggle = useCallback(() => {
    setIsListView((prev) => {
      if (prev) centerBoard();
      return !prev;
    });
  }, [centerBoard]);

  const validTweets = useMemo(() => {
    const seenIds = new Set();
    return tweets
      .filter((tweet) => {
        const isValid =
          tweet &&
          tweet.tweet_id &&
          typeof tweet.tweet_id === "string" &&
          tweet.tweet_id.trim() &&
          !seenIds.has(tweet.tweet_id) &&
          tweet.position &&
          typeof tweet.position.x === "number" &&
          typeof tweet.position.y === "number" &&
          !isNaN(tweet.position.x) &&
          !isNaN(tweet.position.y) &&
          tweet.content &&
          typeof tweet.content === "object" &&
          tweet.content.type &&
          tweet.content.value !== undefined &&
          tweet.content.metadata;
        seenIds.add(tweet.tweet_id);
        return isValid;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [tweets]);

  const tweetProps = useMemo(
    () => ({
      currentUser,
      userRole,
      onLike: handleLikeTweet,
      onDelete: handleDeleteTweet,
      onReply: handleReply,
      onReplyHover: setHighlightedTweetId,
      onEdit: handleEditTweet,
      onPinToggle: handlePinToggle,
      onSetReminder: handleSetReminder,
      onShare: handleShareTweet,
      availableBoards: editModalState.tweet?.availableBoards || boards,
      boardId,
      isListView,
      onModalStateChange: handleModalStateChange,
    }),
    [
      currentUser,
      userRole,
      handleLikeTweet,
      handleDeleteTweet,
      handleReply,
      handleEditTweet,
      handlePinToggle,
      handleSetReminder,
      handleShareTweet,
      editModalState.tweet,
      boards,
      boardId,
      isListView,
      handleModalStateChange,
    ]
  );

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
          parentTweet={
            tweet.parent_tweet_id
              ? tweets.find((t) => t.tweet_id === tweet.parent_tweet_id)?.content?.value || null
              : null
          }
          relatedTweetIds={relatedTweetIds}
        />
      );

      // Animation variants for tweets
      const tweetVariants = {
        initial: {
          opacity: 0,
          x: Math.random() * 50 - 25, // Random slide-in from left/right
          y: Math.random() * 50 - 25, // Random slide-in from top/bottom
        },
        animate: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
        exit: {
          opacity: 0,
          x: Math.random() * 100 - 50, // Random scatter on exit
          y: Math.random() * 100 - 50, // Random scatter on exit
          transition: { duration: 0.3, ease: "easeIn" },
        },
      };

      if (isListView) {
        return (
          <motion.div
            key={`tweet-${tweet.tweet_id}`}
            variants={tweetVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.3 }}
            exit="exit"
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
            if (e.target.closest(".MuiIconButton-root, .MuiTypography-root, .MuiChip-root")) return;
            updateExistingTweet(tweet.tweet_id, { position: { x: data.x, y: data.y } }).then(() => {
              socketRef.current?.emit("tweetUpdated", {
                tweet_id: tweet.tweet_id,
                position: { x: data.x, y: data.y },
                timestamp: new Date().toISOString(),
              });
            });
          }}
          currentUser={currentUser}
          userRole={userRole}
          scale={scale}
        >
          <motion.div variants={tweetVariants} initial="initial" animate="animate" exit="exit">
            {tweetContent}
          </motion.div>
        </DraggableTweet>
      );
    },
    [highlightedTweetId, getRelatedTweetIds, tweets, tweetProps, updateExistingTweet, currentUser, userRole, isListView, scale, socketRef]
  );

  const renderedTweets = useMemo(() => {
    if (!validTweets.length) return null;
    return <AnimatePresence>{validTweets.map((tweet) => renderTweet(tweet))}</AnimatePresence>;
  }, [validTweets, renderTweet]);

  const renderError = useCallback(
    () => (
      <Box sx={BoardStyles.boardErrorContainer}>
        <Typography sx={BoardStyles.boardErrorText}>{error || "An error occurred"}</Typography>
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

  if (isLoading && page === 1) return <LoadingSpinner />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        ...BoardStyles.boardContainer,
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
        position: "relative",
        zIndex: Z_INDEX.BOARD,
      }}
    >
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {isOverlayOpen && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              zIndex: Z_INDEX.OVERLAY,
              pointerEvents: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            aria-hidden="true"
          />
        )}

        <Box sx={BoardStyles.boardBackButtonContainer}>
          <Tooltip title="Go back">
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Previous page"
              sx={BoardStyles.boardBackButton}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 12,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Tooltip title="Online users">
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Online: {onlineUsers}
            </Typography>
          </Tooltip>
        </Box>

        <Box
          ref={boardMainRef}
          sx={{
            ...BoardStyles.boardMain(isListView, dragging),
            touchAction: isOverlayOpen ? "none" : "auto",
            userSelect: "none",
            height: "100%",
            width: "100%",
            overflowY: isListView && !isOverlayOpen ? "auto" : "hidden",
          }}
          onMouseDown={isListView ? undefined : handleMouseDown}
          onMouseMove={isListView ? undefined : handleMouseMove}
          onMouseUp={isListView ? undefined : handleMouseUpWithPopup}
          onTouchStart={isListView ? undefined : handleTouchStart}
          onTouchMove={isListView ? undefined : handleTouchMove}
          onTouchEnd={isListView ? undefined : handleTouchEndWithPopup}
          role="region"
          aria-label={isListView ? "Tweet list view" : "Interactive board canvas"}
          aria-live="polite"
          tabIndex={0}
        >
          {error && renderError()}

          <motion.div
            initial={{ opacity: 0, scale: isListView ? 0.95 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isListView ? 0.95 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
                        sx={{ mt: 2, alignSelf: "center" }}
                        aria-label="Load more tweets"
                        disabled={isLoading || isOverlayOpen}
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
                {popupState.visible && (
                  <TweetPopup
                    x={popupState.x}
                    y={popupState.y}
                    clientX={popupState.clientX}
                    clientY={popupState.clientY}
                    onSubmit={handleTweetCreation}
                    onClose={() => dispatchPopup({ type: "CLOSE_POPUP" })}
                    scale={scale}
                    offset={offset}
                    zIndex={Z_INDEX.POPUP}
                    parentTweet={popupState.replyTweet}
                  />
                )}
              </Box>
            )}
          </motion.div>

          <Box
            sx={{
              ...BoardStyles.boardControlsContainer,
              position: "fixed",
              bottom: { xs: 8, sm: 16 },
              right: { xs: 8, sm: 16 },
              display: "flex",
              flexDirection: "column",
              gap: { xs: 0.5, sm: 1 },
              pointerEvents: isOverlayOpen ? "none" : "auto",
            }}
          >
            <Tooltip title={isListView ? "Switch to board view" : "Switch to list view"}>
              <Button
                variant="contained"
                onClick={handleViewToggle}
                aria-label={isListView ? "Show as board" : "Show as list"}
                sx={{
                  ...BoardStyles.boardViewToggleButton,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "4px 8px", sm: "6px 16px" },
                  pointerEvents: "auto",
                }}
                disabled={isOverlayOpen}
              >
                {isListView ? "Board" : "List"}
              </Button>
            </Tooltip>
            <Tooltip title="Refresh board">
              <IconButton
                onClick={debouncedRefresh}
                size="small"
                aria-label="Refresh board"
                sx={{ ...BoardStyles.boardZoomButton, pointerEvents: "auto" }}
                disabled={isLoading || isOverlayOpen}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Previous page">
              <IconButton
                onClick={handlePrevPage}
                size="small"
                aria-label="Previous page of tweets"
                sx={{
                  ...BoardStyles.boardViewToggleButton,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "4px 8px", sm: "6px 16px" },
                  pointerEvents: "auto",
                }}
                disabled={isLoading || isOverlayOpen || page <= 1}
              >
                <ArrowCircleLeft fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Next page">
              <IconButton
                onClick={handleNextPage}
                size="small"
                aria-label="Next page of tweets"
                sx={{
                  ...BoardStyles.boardViewToggleButton,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  padding: { xs: "4px 8px", sm: "6px 16px" },
                  pointerEvents: "auto",
                }}
                disabled={isLoading || isOverlayOpen || !pagination.hasMore}
              >
                <ArrowCircleRight fontSize="small" />
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
                          onClick={() => handleZoomButton("reset")}
                          size="small"
                          aria-label="Reset board zoom to 100%"
                          sx={{ ...BoardStyles.boardZoomButton, pointerEvents: "auto" }}
                          disabled={isOverlayOpen}
                        >
                          <RestartAlt fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Tooltip title="Zoom out">
                  <IconButton
                    onClick={() => handleZoomButton("out")}
                    size="small"
                    aria-label="Zoom out board"
                    sx={{ ...BoardStyles.boardZoomButton, pointerEvents: "auto" }}
                    disabled={isOverlayOpen}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography
                  sx={{
                    ...BoardStyles.boardZoomText,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {Math.round(scale * 100)}%
                </Typography>
                <Tooltip title="Zoom in">
                  <IconButton
                    onClick={() => handleZoomButton("in")}
                    size="small"
                    aria-label="Zoom in board"
                    sx={{ ...BoardStyles.boardZoomButton, pointerEvents: "auto" }}
                    disabled={isOverlayOpen}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {editModalState.tweet && (
          <Dialog
            open
            onClose={() => dispatchEditModal({ type: "CLEAR_EDIT_MODAL" })}
            maxWidth="sm"
            fullWidth
            sx={{ ...BoardStyles.boardEditDialog, zIndex: Z_INDEX.MODAL }}
            onKeyDown={(e) => e.key === "Escape" && !isSaving && dispatchEditModal({ type: "CLEAR_EDIT_MODAL" })}
            aria-describedby="edit-tweet-description"
            disableEscapeKeyDown={isSaving}
          >
            <DialogTitle sx={BoardStyles.boardEditDialogTitle}>Edit Tweet</DialogTitle>
            <DialogContent sx={BoardStyles.boardEditDialogContent}>
              <Typography id="edit-tweet-description" sx={{ display: "none" }}>
                Edit the content, status, or board of the tweet.
              </Typography>
              <TextField
                multiline
                fullWidth
                label="Tweet Content"
                value={editModalState.tweet.content?.value || ""}
                onChange={(e) => dispatchEditModal({ type: "UPDATE_EDIT_CONTENT", value: e.target.value })}
                minRows={3}
                inputProps={{ maxLength: MAX_TWEET_LENGTH }}
                error={(editModalState.tweet.content?.value?.length || 0) > MAX_TWEET_LENGTH}
                helperText={
                  (editModalState.tweet.content?.value?.length || 0) > MAX_TWEET_LENGTH
                    ? `Tweet exceeds ${MAX_TWEET_LENGTH} characters`
                    : `${editModalState.tweet.content?.value?.length || 0}/${MAX_TWEET_LENGTH}`
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
                    value={editModalState.newStatus}
                    label="Tweet Status"
                    onChange={(e) => dispatchEditModal({ type: "SET_NEW_STATUS", status: e.target.value })}
                    aria-label="Tweet status"
                  >
                    {["pending", "approved", "rejected", "announcement", "reminder", "pinned", "archived"].map(
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
                    value={editModalState.selectedBoardId}
                    label="Move to Board"
                    onChange={(e) => dispatchEditModal({ type: "SET_SELECTED_BOARD", boardId: e.target.value })}
                    aria-label="Move to board"
                  >
                    {boards.map((board) => (
                      <MenuItem key={board.board_id} value={board.board_id}>
                        {board.title || board.name || "Untitled Board"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => dispatchEditModal({ type: "CLEAR_EDIT_MODAL" })}
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
                  !editModalState.tweet.content?.value?.trim() ||
                  (editModalState.tweet.content?.value?.length || 0) > MAX_TWEET_LENGTH
                }
                sx={BoardStyles.boardEditSaveButton}
                aria-label="Save edited tweet"
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
              >
                {isSaving ? "Saving..." : "Save"}
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