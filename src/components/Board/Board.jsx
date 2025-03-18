// components/Board/Board.jsx
import React, {
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
  useEffect,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, IconButton, Typography, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // Імпорт кнопки назад
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import TweetContent from "../Tweet/TweetContent";
import { useTweets } from "../../hooks/useTweets";
import { useWebSocket } from "../../hooks/useWebSocket";
import { BOARD_SIZE, useBoardInteraction } from "../../hooks/useBordIteractions";

const Board = ({ token, boards, currentUser, onLogout }) => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const boardMainRef = useRef(null);
  const initialName = boards.find((b) => b.board_id === boardId)?.name || "";
  const [boardTitle] = useState(
    localStorage.getItem(`boardTitle_${boardId}`) || initialName
  );
  
  useEffect(() => {
    localStorage.setItem(`boardTitle_${boardId}`, boardTitle);
  }, [boardTitle, boardId]);

  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [replyTweet, setReplyTweet] = useState(null);
  const [highlightedParentId, setHighlightedParentId] = useState(null);

  const {
    tweets,
    setTweets,
    fetchTweets,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const socketRef = useWebSocket(
    token,
    boardId,
    currentUser,
    setTweets,
    onLogout,
    navigate
  );

  const handleCreateTweet = useCallback(
    async (text, x, y) => {
      const newTweet = await createTweet(
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
    },
    [createTweet, socketRef, boardId, replyTweet]
  );

  const handleUpdateTweet = useCallback(
    async (id, updates) => {
      await updateTweet(id, updates);
      if (socketRef.current) {
        socketRef.current.emit("tweetUpdated", {
          boardId,
          tweet_id: id,
          ...updates,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [updateTweet, socketRef, boardId]
  );

  const handleToggleLike = useCallback(
    async (id, isLiked) => {
      const updatedTweet = await toggleLike(id, isLiked);
      if (updatedTweet && socketRef.current) {
        socketRef.current.emit("tweetUpdated", { boardId, ...updatedTweet });
      }
    },
    [toggleLike, socketRef, boardId]
  );

  const handleDeleteTweet = useCallback(
    async (id) => {
      await deleteTweet(id);
      if (socketRef.current) {
        socketRef.current.emit("tweetDeleted", { boardId, tweet_id: id });
      }
    },
    [deleteTweet, socketRef, boardId]
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
    setOffset,
    dragging,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useBoardInteraction(boardMainRef);

  const [onlineUsers] = useState(15);

  // Використовуємо useLayoutEffect для центрирування після першого рендеру
  useLayoutEffect(() => {
    if (boardMainRef.current) {
      // Викликаємо центрирування після першої анімаційної рамки
      window.requestAnimationFrame(() => {
        centerBoard();
      });
    }
  }, [centerBoard]);

  // Використовуємо ResizeObserver для перерахунку позиції при зміні розмірів контейнера
  useEffect(() => {
    if (boardMainRef.current) {
      const observer = new ResizeObserver(() => {
        centerBoard();
      });
      observer.observe(boardMainRef.current);
      return () => observer.disconnect();
    }
  }, [centerBoard]);

  // Завантаження твітів після першого рендеру
  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

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

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden"}}>
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative"}}>
        {/* Кнопка "Назад" у верхньому лівому кутку */}
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1100,
          }}
        >
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackIcon sx={{ color: "text.primary" }} />
          </IconButton>
        </Box>
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
                {boardTitle}
              </Typography>
            </Box>
            {tweets.map((tweet) => (
              <DraggableTweet
                key={tweet.tweet_id}
                tweet={tweet}
                currentUser={currentUser}
                onStop={(e, data) =>
                  handleUpdateTweet(tweet.tweet_id, { x: data.x, y: data.y })
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
