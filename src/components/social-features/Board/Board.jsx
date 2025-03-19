import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, IconButton, Typography, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import TweetContent from "../Tweet/TweetContent";
import { useBoards } from "../../../hooks/useBoards";
import { useTweets } from "../../../hooks/useTweets";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { BOARD_SIZE, useBoardInteraction } from "../../../hooks/useBoard";
import LoadingSpinner from "../../Layout/LoadingSpinner";
import ErrorMessage from "../../Layout/ErrorMessage";

const Board = ({ token, currentUser, onLogout }) => {
  const { gate_Id, board_id } = useParams(); // Extract gateId and boardId from the URL
  const navigate = useNavigate();
  const boardMainRef = useRef(null);

  // Fetch board data using useBoards hook
  const { board, loading: boardLoading, error: boardError, fetchBoard } = useBoards(
    token,
    gate_Id,
    board_id,
    onLogout,
    navigate
  );

  // Fetch tweets
  const {
    tweets,
    setTweets,
    loading: tweetsLoading,
    error: tweetsError,
    fetchTweets,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
  } = useTweets(token, board_id, currentUser, onLogout, navigate);

  // WebSocket for real-time updates
  const socketRef = useWebSocket(
    token,
    board_id,
    currentUser,
    setTweets,
    onLogout,
    navigate
  );

  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);

  // Fetch board and tweets on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchBoard(board_id); // Fetch the board
        await fetchTweets(); // Fetch the tweets after the board is loaded
      } catch (err) {
        console.error("Failed to load board or tweets:", err);
      }
    };
    loadData();
  }, [board_id, fetchBoard, fetchTweets]);

  // Handle tweet creation
  const handleCreateTweet = useCallback(
    async (board_id, text, x, y) => {
      const newTweet = await createTweet(
        text,
        x,
        y,
        replyTweet ? replyTweet.tweet_id : null
      );
      if (newTweet && socketRef.current) {
        newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
        socketRef.current.emit("newTweet", { board_id, ...newTweet });
      }
      setReplyTweet(null);
    },
    [createTweet, socketRef, board_id, replyTweet]
  );

  // Handle tweet update (including position)
  const handleUpdateTweet = useCallback(
    async (tweet_id, updates) => {
      const { content, position } = updates;
      const payload = {};
      if (content)
        payload.content =
          typeof content === "string" ? { type: "text", value: content } : content;
      if (position && (position.x !== undefined || position.y !== undefined)) {
        payload.position = {
          x:
            position.x !== undefined
              ? position.x
              : tweets.find((t) => t.tweet_id === tweet_id)?.position?.x || 0,
          y:
            position.y !== undefined
              ? position.y
              : tweets.find((t) => t.tweet_id === tweet_id)?.position?.y || 0,
        };
      }
      await updateTweet(tweet_id, payload);
      if (socketRef.current) {
        socketRef.current.emit("tweetUpdated", {
          board_id,
          tweet_id: tweet_id,
          ...payload,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [updateTweet, socketRef, board_id, tweets]
  );

  // Handle like toggle
  const handleToggleLike = useCallback(
    async (tweet_id, isLiked) => {
      const updatedTweet = await toggleLike(tweet_id, isLiked);
      if (updatedTweet && socketRef.current) {
        socketRef.current.emit("tweetUpdated", { board_id, ...updatedTweet });
      }
    },
    [toggleLike, socketRef, board_id]
  );

  // Handle tweet deletion
  const handleDeleteTweet = useCallback(
    async (tweet_id) => {
      await deleteTweet(tweet_id);
      if (socketRef.current) {
        socketRef.current.emit("tweetDeleted", { board_id, tweet_id: tweet_id });
      }
    },
    [deleteTweet, socketRef, board_id]
  );

  // Handle reply action
  const handleReply = useCallback((tweet) => {
    setReplyTweet(tweet);
    setTweetPopup({ visible: true, x: tweet.x, y: tweet.y });
  }, []);

  // Handle reply hover
  const handleReplyHover = useCallback((parentTweetId) => {
    setHighlightedParentId(parentTweetId);
  }, []);

  // Board interaction hooks
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

  const [onlineUsers] = useState(15);

  // Center board on mount
  useLayoutEffect(() => {
    if (boardMainRef.current) {
      window.requestAnimationFrame(() => {
        centerBoard();
      });
    }
  }, [centerBoard]);

  // Handle resize
  useEffect(() => {
    if (boardMainRef.current) {
      const observer = new ResizeObserver(() => {
        centerBoard();
      });
      observer.observe(boardMainRef.current);
      return () => observer.disconnect();
    }
  }, [centerBoard]);

  // Handle popup submission
  const handlePopupSubmit = useCallback(
    (text, x, y) => {
      handleCreateTweet(text, x, y);
      setTweetDraft("");
      setTweetPopup((prev) => ({ ...prev, visible: false }));
    },
    [handleCreateTweet]
  );

  // Handle click to open popup
  const handleMouseUpWithPopup = useCallback(
    (e) =>
      handleMouseUp(e, (x, y) => {
        setTweetPopup({ visible: true, x, y });
      }),
    [handleMouseUp]
  );

  // Loading and error states for both board and tweets
  if (boardLoading || tweetsLoading) return <LoadingSpinner />;
  if (boardError) return <ErrorMessage message={boardError} />;
  if (tweetsError) return <ErrorMessage message={tweetsError} />;
  if (!board) return <ErrorMessage message="Board not found" />;

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Back Button */}
        <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 1100 }}>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon sx={{ color: "text.primary" }} />
          </IconButton>
        </Box>

        {/* Board Container */}
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
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              backgroundColor: "background.paper",
              backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
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
                {board?.name || "Unnamed Board"}
              </Typography>
            </Box>
            {tweets.map((tweet) => (
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
                  onLike={handleToggleLike}
                  onDelete={handleDeleteTweet}
                  onReply={handleReply}
                  onReplyHover={handleReplyHover}
                  isParentHighlighted={tweet.tweet_id === highlightedParentId}
                />
              </DraggableTweet>
            ))}
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
            >
              <RemoveIcon sx={{ color: "text.primary" }} />
            </IconButton>
            <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomButton("in");
              }}
              size="small"
            >
              <AddIcon sx={{ color: "text.primary" }} />
            </IconButton>
          </Box>

          {/* Top Controls */}
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
            <IconButton
              sx={{
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <Badge badgeContent={onlineUsers} color="primary">
                <PeopleIcon sx={{ color: "text.primary" }} />
              </Badge>
            </IconButton>
            <IconButton
              sx={{
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <FavoriteIcon sx={{ color: "text.primary" }} />
            </IconButton>
            <IconButton
              sx={{
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <ShareIcon sx={{ color: "text.primary" }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Board;