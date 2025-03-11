// components/Board/Board.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, IconButton, Typography, Badge } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PeopleIcon from "@mui/icons-material/People";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import LeftDrawer from "../Drawer/LeftDrawer";
import Header from "../Header/Header";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import TweetContent from "../Tweet/TweetContent";
import { useTweets } from "../../hooks/useTweets";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useBoardInteraction } from "../../hooks/useBordIteractions";

const Board = ({ token, boards, currentUser, onLogout }) => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const boardMainRef = useRef(null);
  const initialName = boards.find((b) => b.board_id === boardId)?.name || "";
  const [boardTitle, setBoardTitle] = useState(
    localStorage.getItem(`boardTitle_${boardId}`) || initialName
  );

  useEffect(() => {
    localStorage.setItem(`boardTitle_${boardId}`, boardTitle);
  }, [boardTitle, boardId]);

  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [focusedTweet, setFocusedTweet] = useState(null);

  const {
    tweets,
    setTweets,
    fetchTweets,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
  } = useTweets(token, boardId, currentUser, onLogout, navigate);

  const socketRef = useWebSocket(token, boardId, currentUser, setTweets, onLogout, navigate);

  const handleCreateTweet = useCallback(
    async (text, x, y) => {
      const newTweet = await createTweet(text, x, y);
      if (newTweet && socketRef.current) {
        // Додаємо timestamp, якщо його нема
        newTweet.timestamp = newTweet.timestamp || new Date().toISOString();
        socketRef.current.emit("newTweet", { boardId, ...newTweet });
      }
    },
    [createTweet, socketRef, boardId]
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

  useEffect(() => {
    fetchTweets();
    centerBoard();
  }, [fetchTweets, centerBoard]);

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

  const isTweetVisible = useCallback(
    (tweet) => {
      if (!boardMainRef.current) return true;
      const { clientWidth, clientHeight } = boardMainRef.current;
      const tweetScreenX = tweet.x * scale + offset.x;
      const tweetScreenY = tweet.y * scale + offset.y;
      return (
        tweetScreenX >= 0 &&
        tweetScreenX <= clientWidth &&
        tweetScreenY >= 0 &&
        tweetScreenY <= clientHeight
      );
    },
    [scale, offset]
  );

  const centerFocusedTweet = useCallback(() => {
    if (focusedTweet && boardMainRef.current) {
      const { clientWidth, clientHeight } = boardMainRef.current;
      setOffset({
        x: clientWidth / 2 - focusedTweet.x * scale,
        y: clientHeight / 2 - focusedTweet.y * scale,
      });
    }
  }, [focusedTweet, scale, setOffset]);

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <Header currentUser={currentUser} token={token} />
        <Box
          ref={boardMainRef}
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            cursor: dragging ? "grabbing" : "grab",
            borderRadius: 2.5,
            mb: 3,
            mr: 3,
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
          {/* Фон дошки */}
          <Box
            className="board-inner"
            sx={{
              position: "absolute",
              top: offset.y,
              left: offset.x,
              width: 10000,
              height: 10000,
              backgroundColor: "#fff",
              backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              zIndex: 0,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                zIndex: 1,
                pointerEvents: "none",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#eee",
                  fontSize: "clamp(2rem, 7.5vw, 15rem)",
                  fontWeight: 700,
                }}
              >
                {boardTitle}
              </Typography>
            </Box>
          </Box>
          {/* Шар з твітами */}
          <Box
            sx={{
              position: "absolute",
              top: offset.y,
              left: offset.x,
              width: 10000,
              height: 10000,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              zIndex: 2,
            }}
          >
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
                  onFocus={setFocusedTweet}
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
          {focusedTweet && !isTweetVisible(focusedTweet) && (
            <Box
              className="return-button"
              sx={{ position: "absolute", bottom: 2, right: 2, zIndex: 1000 }}
              onClick={(e) => {
                e.stopPropagation();
                centerFocusedTweet();
              }}
            >
              <Button variant="contained">Повернутись до поста</Button>
            </Box>
          )}
          {/* Контролери зума та верхні кнопки */}
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
              backgroundColor: "rgba(255,255,255,0.8)",
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
              backgroundColor: "rgba(255,255,255,0.8)",
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
