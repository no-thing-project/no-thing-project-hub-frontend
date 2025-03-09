import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Box, Typography, IconButton, Paper, Button } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import config from "../../config";
import LeftDrawer from "../Drawer/LeftDrawer";
import TopBar from "../Header/Header";

// Константи
const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const ZOOM_SENSITIVITY = 0.001;

// Кастомний хук для роботи з твітами
const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("Auth error:", err.response?.status);
        onLogout();
        navigate("/login");
      }
    },
    [onLogout, navigate]
  );

  const fetchTweets = useCallback(async () => {
    try {
      console.log("Fetching tweets for board:", boardId);
      const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/tweets?board_id=${boardId}`, {
        headers: authHeaders,
      });
      const tweetsData = res.data.content.map((tweet) => ({
        ...tweet,
        content: tweet.content || { type: "text", value: tweet.text || "" },
        likedUsers: tweet.likedUsers || [],
        likedByUser: (tweet.likedUsers || []).some((u) => u.user_id === currentUser?.user_id),
        likes: tweet.likes ?? (tweet.likedUsers || []).length,
        x: tweet.x || 0,
        y: tweet.y || 0,
      }));
      console.log("Tweets fetched:", tweetsData);
      setTweets(tweetsData);
    } catch (err) {
      console.error("Error fetching tweets:", err);
      handleAuthError(err);
    }
  }, [boardId, authHeaders, currentUser?.user_id, handleAuthError]);

  const createTweet = useCallback(
    async (content, x, y) => {
      try {
        const payload = {
          content: typeof content === "string" ? { type: "text", value: content } : content,
          x,
          y,
          board_id: boardId,
        };
        console.log("Creating tweet:", payload);
        const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/tweets`, payload, {
          headers: authHeaders,
        });
        const createdTweet = res.data.content || res.data;
        const tweetWithPosition = {
          content: createdTweet.content || { type: "text", value: createdTweet.text || "" },
          x: createdTweet.x ?? x,
          y: createdTweet.y ?? y,
          likedUsers: createdTweet.likedUsers || [],
          likedByUser: (createdTweet.likedUsers || []).some((u) => u.user_id === currentUser?.user_id),
          likes: createdTweet.likes ?? (createdTweet.likedUsers || []).length,
        };
        console.log("Tweet created:", tweetWithPosition);
        return tweetWithPosition;
      } catch (err) {
        console.error("Error creating tweet:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, currentUser?.user_id, handleAuthError]
  );

  const updateTweet = useCallback(
    async (id, updates) => {
      try {
        console.log("Updating tweet position:", { id, updates });
        await axios.put(`${config.REACT_APP_HUB_API_URL}/tweets/${id}/position`, updates, {
          headers: authHeaders,
        });
        // Не оновлюємо локально, WebSocket зробить це
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError]
  );

  const toggleLike = useCallback(
    async (id, isLiked) => {
      try {
        const endpoint = isLiked ? "dislike" : "like";
        console.log(`Toggling like for ${id}: ${endpoint}`);
        await axios.put(`${config.REACT_APP_HUB_API_URL}/tweets/${id}/${endpoint}`, {}, {
          headers: authHeaders,
        });
        // Не оновлюємо локально, WebSocket зробить це
      } catch (err) {
        console.error("Error toggling like:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError]
  );

  const deleteTweet = useCallback(
    async (id) => {
      try {
        console.log("Deleting tweet:", id);
        await axios.delete(`${config.REACT_APP_HUB_API_URL}/tweets/${id}`, { headers: authHeaders });
        console.log("Tweet deleted from server:", id);
        // Не оновлюємо локально, WebSocket зробить це
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError]
  );

  return { tweets, setTweets, fetchTweets, createTweet, updateTweet, toggleLike, deleteTweet };
};

// Кастомний хук для WebSocket
const useWebSocket = (token, boardId, currentUser, setTweets, onLogout, navigate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(config.REACT_APP_WS_URL, { query: { token, boardId } });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected, joining board:", boardId);
      socket.emit("joinBoard", boardId);
    });

    socket.on("tweetCreated", (newTweet) => {
      console.log("WebSocket: Tweet created:", newTweet);
      setTweets((prev) => {
        if (prev.some((t) => t._id === newTweet._id)) return prev;
        return [...prev, newTweet];
      });
    });

    socket.on("tweetUpdated", (updatedTweet) => {
      console.log("WebSocket: Tweet updated:", updatedTweet);
      setTweets((prev) =>
        prev.map((t) =>
          t._id === updatedTweet._id
            ? {
                ...t,
                x: updatedTweet.x ?? t.x,
                y: updatedTweet.y ?? t.y,
                likedUsers: updatedTweet.likedUsers ?? t.likedUsers,
                likes: updatedTweet.likedUsers?.length ?? t.likes,
                likedByUser: updatedTweet.likedUsers?.some((u) => u.user_id === currentUser?.user_id) ?? t.likedByUser,
              }
            : t
        )
      );
    });

    socket.on("tweetDeleted", ({ _id }) => {
      console.log("WebSocket: Tweet deleted:", _id);
      setTweets((prev) => prev.filter((t) => t._id !== _id));
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      if (err.message.includes("Authentication")) {
        onLogout();
        navigate("/login");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, boardId, currentUser, setTweets, onLogout, navigate]);

  return socketRef;
};

// Кастомний хук для масштабування та перетягування
const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const isDragging = useRef(false);

  const centerBoard = useCallback(() => {
    if (boardRef.current) {
      const { clientWidth, clientHeight } = boardRef.current;
      setOffset({ x: clientWidth / 2 - BOARD_SIZE / 2, y: clientHeight / 2 - BOARD_SIZE / 2 });
    }
  }, [boardRef]);

  const adjustOffsetForZoom = useCallback(
    (cursorX, cursorY, oldScale, newScale) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const relativeX = cursorX - rect.left;
      const relativeY = cursorY - rect.top;
      const boardX = (relativeX - offset.x) / oldScale;
      const boardY = (relativeY - offset.y) / oldScale;
      setOffset({ x: relativeX - boardX * newScale, y: relativeY - boardY * newScale });
    },
    [offset, boardRef]
  );

  const handleZoom = useCallback(
    (cursorX, cursorY, delta) => {
      setScale((prev) => {
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
        adjustOffsetForZoom(cursorX, cursorY, prev, newScale);
        return newScale;
      });
    },
    [adjustOffsetForZoom]
  );

  const handleZoomButton = useCallback(
    (direction) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      handleZoom(centerX, centerY, direction === "in" ? ZOOM_STEP : -ZOOM_STEP);
    },
    [boardRef, handleZoom]
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (!boardRef.current) return;
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(e.clientX, e.clientY, delta);
    },
    [boardRef, handleZoom]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest(".tweet-card, .tweet-popup, .return-button, .zoom-controls")) return;
      dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
      isDragging.current = false;
      setDragging(false);
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging.current = true;
        setDragging(true);
      }
      if (isDragging.current) {
        setOffset({ x: dragStart.current.offsetX + dx * scale, y: dragStart.current.offsetY + dy * scale });
      }
    },
    [scale]
  );

  const handleMouseUp = useCallback(
    (e, onClick) => {
      if (e.target.closest(".return-button")) {
        dragStart.current = null;
        isDragging.current = false;
        setDragging(false);
        return;
      }
      if (!isDragging.current && dragStart.current && onClick) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const clickX = e.clientX - boardRect.left;
        const clickY = e.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;
        onClick(tweetX, tweetY);
      }
      dragStart.current = null;
      isDragging.current = false;
      setDragging(false);
    },
    [boardRef, offset, scale]
  );

  return { scale, offset, setOffset, dragging, centerBoard, handleZoomButton, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp };
};

// Компонент для рендерингу вмісту твіта
const TweetContent = React.memo(({ tweet, currentUser, onLike, onDelete, onFocus }) => {
  const isLiked = tweet.likedUsers?.some((u) => u.user_id === currentUser?.user_id);

  const renderContent = (content) => {
    switch (content.type) {
      case "text":
        return <Typography variant="body1" sx={{ marginBottom: "8px", color: "#424242" }}>{content.value}</Typography>;
      case "image":
        return <img src={content.url} alt="Tweet media" style={{ maxWidth: "100%", borderRadius: "8px" }} />;
      default:
        return null;
    }
  };

  return (
    <Paper
      className="tweet-card"
      elevation={3}
      onClick={(e) => {
        e.stopPropagation();
        onFocus(tweet);
      }}
      sx={{
        padding: "16px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        minWidth: "180px",
        maxWidth: "300px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {renderContent(tweet.content)}
      <Typography variant="caption" sx={{ color: "#757575" }}>
        Автор: {tweet.username || currentUser?.username || "Unknown"}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", marginTop: 1 }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onLike(tweet._id, isLiked);
          }}
          color={isLiked ? "primary" : "default"}
        >
          <ThumbUpIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ marginLeft: 1, transition: "all 0.3s ease" }}>
          {tweet.likes}
        </Typography>
        {tweet.user_id === currentUser?.user_id && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tweet._id);
            }}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
});

// Головний компонент
const Board = ({ token, currentUser, onLogout }) => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const boardMainRef = useRef(null);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [focusedTweet, setFocusedTweet] = useState(null);

  const { tweets, setTweets, fetchTweets, createTweet, updateTweet, toggleLike, deleteTweet } = useTweets(
    token,
    boardId,
    currentUser,
    onLogout,
    navigate
  );
  useWebSocket(token, boardId, currentUser, setTweets, onLogout, navigate);

  const { scale, offset, setOffset, dragging, centerBoard, handleZoomButton, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } =
    useBoardInteraction(boardMainRef);

  useEffect(() => {
    console.log("Board mounted, currentUser:", currentUser);
    fetchTweets();
    centerBoard();
  }, [fetchTweets, centerBoard, currentUser]);

  const handlePopupSubmit = useCallback(
    (text, x, y) => {
      createTweet(text, x, y).then((newTweet) => {
        if (newTweet) setFocusedTweet(newTweet);
      });
      setTweetDraft("");
      setTweetPopup((prev) => ({ ...prev, visible: false }));
    },
    [createTweet]
  );

  const handleMouseUpWithPopup = useCallback(
    (e) => handleMouseUp(e, (x, y) => setTweetPopup({ visible: true, x, y })),
    [handleMouseUp]
  );

  const isTweetVisible = useCallback(
    (tweet) => {
      if (!boardMainRef.current) return true;
      const { clientWidth, clientHeight } = boardMainRef.current;
      const tweetScreenX = tweet.x * scale + offset.x;
      const tweetScreenY = tweet.y * scale + offset.y;
      return tweetScreenX >= 0 && tweetScreenX <= clientWidth && tweetScreenY >= 0 && tweetScreenY <= clientHeight;
    },
    [scale, offset]
  );

  const centerFocusedTweet = useCallback(() => {
    if (focusedTweet && boardMainRef.current) {
      const { clientWidth, clientHeight } = boardMainRef.current;
      setOffset({ x: clientWidth / 2 - focusedTweet.x * scale, y: clientHeight / 2 - focusedTweet.y * scale });
    }
  }, [focusedTweet, scale, setOffset]);

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar currentUser={currentUser} />
        <Box
          ref={boardMainRef}
          sx={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpWithPopup}
          onTouchStart={(e) =>
            e.touches?.length === 1 &&
            handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target })
          }
          onTouchMove={(e) =>
            e.touches?.length === 1 &&
            handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }) &&
            e.preventDefault()
          }
          onTouchEnd={(e) =>
            e.changedTouches?.length === 1 &&
            handleMouseUpWithPopup({
              clientX: e.changedTouches[0].clientX,
              clientY: e.changedTouches[0].clientY,
              target: e.target,
            })
          }
          onWheel={handleWheel}
        >
          <Box
            className="board-inner"
            sx={{
              position: "absolute",
              top: offset.y,
              left: offset.x,
              width: BOARD_SIZE,
              height: BOARD_SIZE,
              backgroundColor: "#fff",
              backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {tweets.map((tweet) => (
              <DraggableTweet
                key={tweet._id}
                tweet={tweet}
                currentUser={currentUser}
                onStop={(e, data) => updateTweet(tweet._id, { x: data.x, y: data.y })}
              >
                <TweetContent
                  tweet={tweet}
                  currentUser={currentUser}
                  onLike={toggleLike}
                  onDelete={deleteTweet}
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
                  onClose={() => setTweetPopup((prev) => ({ ...prev, visible: false }))}
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
              <RemoveIcon />
            </IconButton>
            <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomButton("in");
              }}
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Board;