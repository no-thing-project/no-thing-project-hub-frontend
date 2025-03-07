import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Paper, Button } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import axios from "axios";
import io from "socket.io-client";
import { useParams } from "react-router-dom";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import config from "../../config";

import LeftDrawer from "../Drawer/LeftDrawer";
import TopBar from "../Header/Header";

const BOARD_SIZE = 10000;

const Board = ({ token, currentUser, onLogout }) => {
  const { id: boardId } = useParams();
  const [tweets, setTweets] = useState([]);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [focusedTweet, setFocusedTweet] = useState(null);
  const [scale, setScale] = useState(1);

  const boardMainRef = useRef(null);
  const dragStart = useRef(null);
  const isDragging = useRef(false);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchTweets();
    centerBoardInitially();
    setupWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, boardId]);

  const centerBoardInitially = () => {
    if (boardMainRef.current) {
      const { clientWidth, clientHeight } = boardMainRef.current;
      setBoardOffset({
        x: clientWidth / 2 - BOARD_SIZE / 2,
        y: clientHeight / 2 - BOARD_SIZE / 2,
      });
    }
  };

  const setupWebSocket = () => {
    const socket = io(config.REACT_APP_WS_API_URL, { query: { token } });
    socketRef.current = socket;

    socket.on("tweetCreated", (newTweet) => {
      setTweets((prev) => {
        if (prev.some((tweet) => tweet._id === newTweet._id)) return prev;
        return [...prev, newTweet];
      });
    });

    socket.on("tweetUpdated", (updatedTweet) => {
      setTweets((prev) =>
        prev.map((tweet) =>
          tweet._id === updatedTweet._id ? updatedTweet : tweet
        )
      );
    });

    socket.on("tweetDeleted", ({ _id }) => {
      setTweets((prev) => prev.filter((tweet) => tweet._id !== _id));
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  };

  const fetchTweets = async () => {
    try {
      const res = await axios.get(
        `${config.REACT_APP_HUB_API_URL}/tweets?board_id=${boardId}`
      );
      const tweetsData = res.data.content.map((tweet) => ({
        ...tweet,
        likedUsers: tweet.likedUsers || [],
        likedByUser: (tweet.likedUsers || []).some(
          (u) => u.user_id === currentUser?._id
        ),
        likes:
          tweet.likes !== undefined
            ? tweet.likes
            : (tweet.likedUsers || []).length,
      }));
      setTweets(tweetsData);
    } catch (err) {
      console.error(err);
    }
  };

  const createTweet = async (text, x, y) => {
    try {
      // x, y передаються у "бордових" координатах (без маштабування)
      const payload = {
        text,
        x,
        y,
        board_id: boardId,
        user: {
          id: currentUser?._id,
          username: currentUser?.username,
        },
      };
      const res = await axios.post(
        `${config.REACT_APP_HUB_API_URL}/tweets`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const createdTweet = res.data.content || res.data;
      const tweetWithPosition = {
        ...createdTweet,
        x: createdTweet.x ?? x,
        y: createdTweet.y ?? y,
        likedUsers: createdTweet.likedUsers || [],
        likedByUser: (createdTweet.likedUsers || []).some(
          (u) => u.user_id === currentUser?._id
        ),
        likes:
          createdTweet.likes !== undefined
            ? createdTweet.likes
            : (createdTweet.likedUsers || []).length,
      };
      setTweets((prev) => {
        if (prev.some((t) => t._id === tweetWithPosition._id)) return prev;
        return [...prev, tweetWithPosition];
      });
      setFocusedTweet(tweetWithPosition);
    } catch (err) {
      console.error(err);
    }
  };

  // Функції маштабування: для кнопок масштабування відносно центру екрану
  const handleZoomIn = (cursorX, cursorY) => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.1, 2);
      adjustOffsetForZoom(cursorX, cursorY, prev, newScale);
      return newScale;
    });
  };

  const handleZoomOut = (cursorX, cursorY) => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.1, 0.5);
      adjustOffsetForZoom(cursorX, cursorY, prev, newScale);
      return newScale;
    });
  };

  // При натисканні кнопок масштабування використовуємо центр boardMainRef
  const handleZoomInButton = () => {
    if (!boardMainRef.current) return;
    const rect = boardMainRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    handleZoomIn(centerX, centerY);
  };

  const handleZoomOutButton = () => {
    if (!boardMainRef.current) return;
    const rect = boardMainRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    handleZoomOut(centerX, centerY);
  };

  // Регулює зсув, щоб точка під курсором залишалась незмінною.
  const adjustOffsetForZoom = (cursorX, cursorY, oldScale, newScale) => {
    if (!boardMainRef.current) return;
    const rect = boardMainRef.current.getBoundingClientRect();
    const relativeX = cursorX - rect.left;
    const relativeY = cursorY - rect.top;
    const boardX = (relativeX - boardOffset.x) / oldScale;
    const boardY = (relativeY - boardOffset.y) / oldScale;
    const newOffsetX = relativeX - boardX * newScale;
    const newOffsetY = relativeY - boardY * newScale;
    setBoardOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Плавне маштабування мишкою/тачпадом навколо курсору
  const handleWheel = (e) => {
    e.preventDefault();
    if (!boardMainRef.current) return;
    const sensitivity = 0.001;
    const delta = -e.deltaY * sensitivity;
    const newScale = Math.min(2, Math.max(0.5, scale + delta));
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    adjustOffsetForZoom(cursorX, cursorY, scale, newScale);
    setScale(newScale);
  };

  // Обробка перетягування: тепер розрахунок враховує scale
  const handleMouseDown = (e) => {
    // Не ініціювати драг, якщо клік на елементах, які не мають викликати переміщення
    if (
      e.target.closest(".tweet-card") ||
      e.target.closest(".tweet-popup") ||
      e.target.closest(".return-button") ||
      e.target.closest(".zoom-controls")
    )
      return;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: boardOffset.x,
      offsetY: boardOffset.y,
    };
    isDragging.current = false;
    setDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) / scale;
    const dy = (e.clientY - dragStart.current.y) / scale;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
      setDragging(true);
    }
    if (isDragging.current) {
      setBoardOffset({
        x: dragStart.current.offsetX + dx * scale,
        y: dragStart.current.offsetY + dy * scale,
      });
    }
  };

  const handleMouseUp = (e) => {
    if (e.target.closest(".return-button")) {
      dragStart.current = null;
      isDragging.current = false;
      setDragging(false);
      return;
    }
    // Якщо це не перетягування, відкриваємо попап для створення твіту
    if (!isDragging.current && dragStart.current) {
      const boardRect = boardMainRef.current.getBoundingClientRect();
      const clickX = e.clientX - boardRect.left;
      const clickY = e.clientY - boardRect.top;
      const tweetX = (clickX - boardOffset.x) / scale;
      const tweetY = (clickY - boardOffset.y) / scale;
      setTweetPopup({ visible: true, x: tweetX, y: tweetY });
    }
    dragStart.current = null;
    isDragging.current = false;
    setDragging(false);
  };

  // Обробка touch-подій
  const handleTouchStart = (e) => {
    if (e.touches?.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches?.length === 1) {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      });
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches?.length === 1) {
      const touch = e.changedTouches[0];
      handleMouseUp({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      });
    }
  };

  // Popup для створення твіту
  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  const handlePopupSubmit = (text, x, y) => {
    createTweet(text, x, y);
    setTweetDraft("");
    setTweetPopup({ ...tweetPopup, visible: false });
  };

  const handlePopupClose = () => {
    setTweetPopup({ ...tweetPopup, visible: false });
  };

  // Лайки та видалення
  const isTweetLikedByCurrentUser = (tweet) => {
    return (tweet.likedUsers || []).some(
      (u) => u.user_id === currentUser?._id
    );
  };

  const handleLike = async (id) => {
    try {
      const tweet = tweets.find((t) => t._id === id);
      if (!tweet) return;
      const alreadyLiked = isTweetLikedByCurrentUser(tweet);
      let res;
      if (alreadyLiked) {
        res = await axios.put(
          `${config.REACT_APP_HUB_API_URL}/tweets/${id}/dislike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.put(
          `${config.REACT_APP_HUB_API_URL}/tweets/${id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      const updatedTweet = res.data.content || res.data;
      const updatedLikes =
        updatedTweet.likes !== undefined
          ? updatedTweet.likes
          : (updatedTweet.likedUsers || []).length;
      const updatedLikedUsers = updatedTweet.likedUsers || [];
      setTweets((prevTweets) =>
        prevTweets.map((t) =>
          t._id === id
            ? {
                ...t,
                likes: updatedLikes,
                likedUsers: updatedLikedUsers,
                likedByUser: updatedLikedUsers.some(
                  (u) => u.user_id === currentUser?._id
                ),
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updatePosition = async (id, x, y) => {
    try {
      const res = await axios.put(
        `${config.REACT_APP_WS_API_URL}/tweets/${id}/position`,
        { x, y },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedTweet = res.data.content || res.data;
      setTweets((prevTweets) =>
        prevTweets.map((t) =>
          t._id === id
            ? {
                ...t,
                x: updatedTweet.x !== undefined ? updatedTweet.x : x,
                y: updatedTweet.y !== undefined ? updatedTweet.y : t.y,
              }
            : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${config.REACT_APP_HUB_API_URL}/tweets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTweets((prevTweets) => prevTweets.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const onStopDrag = (e, data, tweet) => {
    updatePosition(tweet._id, data.x, data.y);
  };

  const isTweetVisible = (tweet) => {
    if (!boardMainRef.current) return true;
    const { clientWidth, clientHeight } = boardMainRef.current;
    const tweetScreenX = tweet.x * scale + boardOffset.x;
    const tweetScreenY = tweet.y * scale + boardOffset.y;
    return (
      tweetScreenX >= 0 &&
      tweetScreenX <= clientWidth &&
      tweetScreenY >= 0 &&
      tweetScreenY <= clientHeight
    );
  };

  const centerFocusedTweet = () => {
    if (focusedTweet && boardMainRef.current) {
      const { clientWidth, clientHeight } = boardMainRef.current;
      setBoardOffset({
        x: clientWidth / 2 - focusedTweet.x * scale,
        y: clientHeight / 2 - focusedTweet.y * scale,
      });
    }
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar currentUser={currentUser} />
        <Box
          ref={boardMainRef}
          sx={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            cursor: dragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <Box
            className="board-inner"
            sx={{
              position: "absolute",
              top: boardOffset.y,
              left: boardOffset.x,
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
            {tweets.map((tweet) => {
              const authorUsername = tweet.username || currentUser?.username || "Unknown";
              const tweetContent = (
                <Paper
                  className="tweet-card"
                  elevation={3}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedTweet(tweet);
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
                  <Typography variant="body1" sx={{ marginBottom: "8px", color: "#424242" }}>
                    {tweet.text}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#757575" }}>
                    Автор: {authorUsername}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", marginTop: 1 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(tweet._id);
                      }}
                      color={isTweetLikedByCurrentUser(tweet) ? "primary" : "default"}
                    >
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ marginLeft: 1, transition: "all 0.3s ease" }}>
                      {tweet.likes}
                    </Typography>
                    {tweet.user_id === currentUser?._id && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tweet._id);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              );
              return currentUser?._id === tweet.user_id ? (
                <DraggableTweet key={tweet._id} tweet={tweet} onStop={onStopDrag}>
                  {tweetContent}
                </DraggableTweet>
              ) : (
                <Box
                  key={tweet._id}
                  sx={{ position: "absolute", top: tweet.y, left: tweet.x }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedTweet(tweet);
                  }}
                >
                  {tweetContent}
                </Box>
              );
            })}
            {tweetPopup.visible && (
              <Box onClick={handlePopupClick}>
                <TweetPopup
                  x={tweetPopup.x}
                  y={tweetPopup.y}
                  draft={tweetDraft}
                  onDraftChange={setTweetDraft}
                  onSubmit={handlePopupSubmit}
                  onClose={handlePopupClose}
                />
              </Box>
            )}
          </Box>
          {focusedTweet && !isTweetVisible(focusedTweet) && (
            <Box
              className="return-button"
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                zIndex: 1000,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                centerFocusedTweet();
              }}
            >
              <Button variant="contained">Повернутись до поста</Button>
            </Box>
          )}
          {/* Zoom controls - розташовані у нижньому правому куті */}
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
            onMouseDown={(e) => e.stopPropagation()}
          >
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOutButton();
              }}
              size="small"
            >
              <RemoveIcon />
            </IconButton>
            <Typography variant="body2">{Math.round(scale * 100)}%</Typography>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleZoomInButton();
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
