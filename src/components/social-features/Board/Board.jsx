// src/components/social-features/Board/Board.jsx
import React, {
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  useEffect,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Typography,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Popover,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShareIcon from "@mui/icons-material/Share";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import TweetContent from "../Tweet/TweetContent";
import { useTweets } from "../../../hooks/useTweets";
import { useBoards } from "../../../hooks/useBoards";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { BOARD_SIZE, useBoardInteraction } from "../../../hooks/useBoard";
import LoadingSpinner from "../../Layout/LoadingSpinner";
import ErrorMessage from "../../Layout/ErrorMessage";
import ErrorBoundary from "../../Layout/ErrorBoudary";

const ErrorFallback = ({ error }) => (
  <ErrorMessage message={error.message || "Something went wrong in the Board"} />
);

const Board = ({ token, currentUser, onLogout, boardId, boardTitle, onLike, onStatusUpdate }) => {
  const navigate = useNavigate();
  const boardMainRef = useRef(null);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [membersAnchorEl, setMembersAnchorEl] = useState(null);

  const {
    tweets,
    setTweets,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    loading: tweetsLoading,
    error: tweetsError,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const {
    board,
    members,
    fetchBoard,
    fetchMembersForBoard,
    loading: boardsLoading,
    error: boardsError,
  } = useBoards(token, null, null, boardId, onLogout, navigate);

  const socketRef = useWebSocket(
    token,
    boardId,
    currentUser,
    setTweets,
    onLogout,
    navigate,
    setOnlineUsers // Pass setOnlineUsers to update online users via WebSocket
  );

  useEffect(() => {
    if (boardId) {
      const controller = new AbortController();
      const signal = controller.signal;
      const loadData = async () => {
        try {
          await Promise.all([
            fetchTweets({ signal }),
            fetchBoard(boardId, signal),
            fetchMembersForBoard(boardId),
          ]);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error loading board data:", err);
          }
        }
      };
      loadData();
      return () => controller.abort();
    }
  }, [boardId, fetchTweets, fetchBoard, fetchMembersForBoard]);

  useEffect(() => {
    const socket = socketRef.current; // Copy socketRef.current to a variable
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socketRef]);

  const handleCreateTweet = useCallback(
    async (text, x, y) => {
      try {
        const newTweet = await createNewTweet(
          text,
          x,
          y,
          replyTweet ? replyTweet.tweet_id : null
        );
        if (newTweet && socketRef.current) {
          newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
          socketRef.current.emit("newTweet", { boardId, ...newTweet });
        }
        setReplyTweet(null);
      } catch (err) {
        console.error("Error creating tweet:", err);
      }
    },
    [createNewTweet, socketRef, boardId, replyTweet]
  );

  const handleUpdateTweet = useCallback(
    async (id, updates) => {
      try {
        await updateExistingTweet(id, updates);
        if (socketRef.current) {
          socketRef.current.emit("tweetUpdated", {
            boardId,
            tweet_id: id,
            ...updates,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Error updating tweet:", err);
      }
    },
    [updateExistingTweet, socketRef, boardId]
  );

  const handleToggleLikeTweet = useCallback(
    async (id, isLiked) => {
      try {
        const updatedTweet = await toggleLikeTweet(id, isLiked);
        if (updatedTweet && socketRef.current) {
          socketRef.current.emit("tweetUpdated", { boardId, ...updatedTweet });
        }
      } catch (err) {
        console.error("Error toggling like:", err);
      }
    },
    [toggleLikeTweet, socketRef, boardId]
  );

  const handleDeleteTweet = useCallback(
    async (id) => {
      try {
        await deleteExistingTweet(id);
        if (socketRef.current) {
          socketRef.current.emit("tweetDeleted", { boardId, tweet_id: id });
        }
      } catch (err) {
        console.error("Error deleting tweet:", err);
      }
    },
    [deleteExistingTweet, socketRef, boardId]
  );

  const handleReply = useCallback((tweet) => {
    setReplyTweet(tweet);
    setTweetPopup({ visible: true, x: tweet.x, y: tweet.y });
  }, []);

  const handleReplyHover = useCallback((parentTweetId) => {
    setHighlightedParentId(parentTweetId);
  }, []);

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
  } = useBoardInteraction(boardMainRef);

  const renderedTweets = useMemo(() => {
    return tweets.map((tweet) => (
      <DraggableTweet
        key={tweet.tweet_id}
        tweet={tweet}
        currentUser={currentUser}
        onStop={(e, data) =>
          handleUpdateTweet(tweet.tweet_id, { position: { x: data.x, y: data.y } })
        }
      >
        <TweetContent
          tweet={tweet}
          currentUser={currentUser}
          onLike={handleToggleLikeTweet}
          onDelete={handleDeleteTweet}
          onReply={handleReply}
          onReplyHover={handleReplyHover}
          isParentHighlighted={tweet.tweet_id === highlightedParentId}
        />
      </DraggableTweet>
    ));
  }, [
    tweets,
    currentUser,
    handleUpdateTweet,
    handleToggleLikeTweet,
    handleDeleteTweet,
    handleReply,
    handleReplyHover,
    highlightedParentId,
  ]);

  useLayoutEffect(() => {
    if (boardMainRef.current) {
      window.requestAnimationFrame(() => {
        centerBoard();
      });
    }
  }, [centerBoard]);

  useEffect(() => {
    if (boardMainRef.current) {
      const observer = new ResizeObserver(() => {
        centerBoard();
      });
      observer.observe(boardMainRef.current);
      return () => observer.disconnect();
    }
  }, [centerBoard]);

  const handlePopupSubmit = useCallback(
    (text, x, y) => {
      handleCreateTweet(text, x, y);
      setTweetDraft("");
      setTweetPopup((prev) => ({ ...prev, visible: false }));
    },
    [handleCreateTweet]
  );

  const handleMouseUpWithPopup = useCallback(
    (e) =>
      handleMouseUp(e, (x, y) => {
        setTweetPopup({ visible: true, x, y });
      }),
    [handleMouseUp]
  );

  if (tweetsLoading || boardsLoading) {
    return <LoadingSpinner />;
  }

  if (tweetsError || boardsError) {
    return <ErrorMessage message={tweetsError || boardsError} />;
  }

  if (!board) {
    return <ErrorMessage message="Board not found" />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Return Button */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1100,
            }}
          >
            <IconButton
              onClick={() => navigate(-1)}
              className="return-button"
              aria-label="Go back"
            >
              <ArrowBackIcon sx={{ color: "text.primary" }} />
            </IconButton>
          </Box>

          {/* Board Canvas */}
          <Box
            ref={boardMainRef}
            sx={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              cursor: dragging ? "grabbing" : "grab",
              borderRadius: 2.5,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpWithPopup}
            onTouchStart={(e) => {
              if (e.touches?.length === 1) {
                handleMouseDown({
                  clientX: e.touches[0].clientX,
                  clientY: e.touches[0].clientY,
                  target: e.target,
                });
              }
            }}
            onTouchMove={(e) => {
              if (e.touches?.length === 1) {
                handleMouseMove({
                  clientX: e.touches[0].clientX,
                  clientY: e.touches[0].clientY,
                  target: e.target,
                });
                e.preventDefault();
              }
            }}
            onTouchEnd={(e) => {
              if (e.changedTouches?.length === 1) {
                handleMouseUpWithPopup({
                  clientX: e.changedTouches[0].clientX,
                  clientY: e.changedTouches[0].clientY,
                  target: e.target,
                });
              }
            }}
            onWheel={handleWheel}
            role="region"
            aria-label="Interactive board canvas"
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: BOARD_SIZE,
                height: BOARD_SIZE,
                backgroundColor: "background.paper",
                backgroundImage:
                  "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#eee",
                    fontSize: "clamp(2rem, 8vw, 15rem)",
                    fontWeight: 700,
                  }}
                >
                  {boardTitle}
                </Typography>
              </Box>

              {renderedTweets}

              {tweetPopup.visible && (
                <Box onClick={(e) => e.stopPropagation()}>
                  <TweetPopup
                    x={tweetPopup.x}
                    y={tweetPopup.y}
                    draft={tweetDraft}
                    onDraftChange={setTweetDraft}
                    onSubmit={handlePopupSubmit}
                    onClose={() =>
                      setTweetPopup((prev) => ({ ...prev, visible: false }))
                    }
                  />
                </Box>
              )}
            </Box>

            {/* Zoom Controls */}
            <Box
              className="zoom-controls"
              sx={{
                position: "absolute",
                bottom: 16,
                right: 16,
                zIndex: 1100,
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "background.paper",
                borderRadius: 1,
                padding: "4px",
              }}
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomButton("out");
                }}
                size="small"
                aria-label="Zoom out"
              >
                <RemoveIcon sx={{ color: "text.primary" }} />
              </IconButton>
              <Typography variant="body2">
                {Math.round(scale * 100)}%
              </Typography>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomButton("in");
                }}
                size="small"
                aria-label="Zoom in"
              >
                <AddIcon sx={{ color: "text.primary" }} />
              </IconButton>
            </Box>

            {/* Board Controls */}
            <Box
              className="board-top-controls"
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 1100,
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: "background.paper",
                borderRadius: 1,
                padding: "4px",
              }}
            >
              <Tooltip title="Board Visibility">
                <IconButton aria-label="Board visibility">
                  {board?.is_public ? (
                    <PublicIcon sx={{ color: "#3E435D" }} />
                  ) : (
                    <LockIcon sx={{ color: "#990000" }} />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Members">
                <IconButton
                  onClick={(e) => setMembersAnchorEl(e.currentTarget)}
                  aria-label="View members"
                >
                  <Badge badgeContent={onlineUsers} color="primary">
                    <PeopleIcon sx={{ color: "text.primary" }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title={board?.is_liked ? "Unlike Board" : "Like Board"}>
                <IconButton onClick={onLike} aria-label="Like or unlike board">
                  {board?.is_liked ? (
                    <FavoriteIcon sx={{ color: "red" }} />
                  ) : (
                    <FavoriteBorderIcon sx={{ color: "text.primary" }} />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Board">
                <IconButton aria-label="Share board">
                  <ShareIcon sx={{ color: "text.primary" }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Members Popover */}
            <Popover
              open={Boolean(membersAnchorEl)}
              anchorEl={membersAnchorEl}
              onClose={() => setMembersAnchorEl(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <Box sx={{ p: 2, maxHeight: 300, overflowY: "auto" }}>
                <Typography variant="h6" gutterBottom>
                  Members
                </Typography>
                {members.length > 0 ? (
                  <List dense>
                    {members.map((member) => (
                      <ListItem key={member.anonymous_id}>
                        <ListItemText
                          primary={member.username || "Anonymous"}
                          secondary={member.role || "Member"}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No members found.</Typography>
                )}
              </Box>
            </Popover>
          </Box>
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

Board.propTypes = {
  token: PropTypes.string.isRequired,
  currentUser: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  boardId: PropTypes.string.isRequired,
  boardTitle: PropTypes.string.isRequired,
  onLike: PropTypes.func.isRequired,
  onStatusUpdate: PropTypes.func.isRequired,
};

export default Board;