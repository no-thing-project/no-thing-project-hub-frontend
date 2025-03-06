import React, { useState, useEffect, useRef } from "react";
import { Typography, IconButton, Paper, Button } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import io from "socket.io-client";
import DraggableTweet from "../Tweet/Tweet";
import TweetPopup from "../Tweet/TweetPopup";
import Header from "../Header/Header";

const BOARD_SIZE = 10000; // симулюємо "безкінечну" дошку

const Board = ({ token, currentUser, onLogout }) => {
  const [tweets, setTweets] = useState([]);
  const [tweetPopup, setTweetPopup] = useState({ visible: false, x: 0, y: 0 });
  const [tweetDraft, setTweetDraft] = useState("");
  const [boardOffset, setBoardOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [focusedTweet, setFocusedTweet] = useState(null);
  const boardMainRef = useRef(null);
  const dragStart = useRef(null);
  const isDragging = useRef(false);
  const socketRef = useRef(null);

  // Початкове завантаження твітів та підключення до Socket.IO
  useEffect(() => {
    fetchTweets();
    // Центруємо дошку при першому завантаженні
    if (boardMainRef.current) {
      const { clientWidth, clientHeight } = boardMainRef.current;
      setBoardOffset({
        x: clientWidth / 2 - BOARD_SIZE / 2,
        y: clientHeight / 2 - BOARD_SIZE / 2,
      });
    }
    // Підключення до WebSocket серверу з передачею токена
    const socket = io(process.env.REACT_APP_WS_URL, {
      query: { token }
    });
    socketRef.current = socket;
    socket.on("tweetCreated", (newTweet) => {
      // Якщо твіт уже існує — не додаємо дубль
      setTweets((prev) => {
        if (prev.find(tweet => tweet._id === newTweet._id)) return prev;
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
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const fetchTweets = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_HUB_API_URL}/tweets`
      );
      // Обчислюємо кількість лайків з likedUsers, якщо likes відсутнє
      const tweetsData = res.data.content.map((tweet) => ({
        ...tweet,
        likedUsers: tweet.likedUsers || [],
        likedByUser: (tweet.likedUsers || []).some(
          (u) => u.user_id === currentUser?._id
        ),
        likes: tweet.likes !== undefined ? tweet.likes : (tweet.likedUsers || []).length,
      }));
      setTweets(tweetsData);
    } catch (err) {
      console.error(err);
    }
  };

  const createTweet = async (text, x, y) => {
    try {
      const payload = {
        text,
        x,
        y,
        user: {
          id: currentUser?._id,
          username: currentUser?.username,
        },
      };
      const res = await axios.post(
        `${process.env.REACT_APP_HUB_API_URL}/tweets`,
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
        likes: createdTweet.likes !== undefined ? createdTweet.likes : (createdTweet.likedUsers || []).length,
      };
      // Для оптимістичного оновлення перевіряємо, чи твіт вже є в стані
      setTweets((prev) => {
        if (prev.find(tweet => tweet._id === tweetWithPosition._id)) return prev;
        return [...prev, tweetWithPosition];
      });
      setFocusedTweet(tweetWithPosition);
    } catch (err) {
      console.error(err);
    }
  };

  // Обробка подій для перетягування дошки (для миші)
  const handleMouseDown = (e) => {
    if (
      e.target.closest(".tweet-card") ||
      e.target.closest(".tweet-popup") ||
      e.target.closest(".return-button")
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
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
      setDragging(true);
    }
    if (isDragging.current) {
      setBoardOffset({
        x: dragStart.current.offsetX + dx,
        y: dragStart.current.offsetY + dy,
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
    if (!isDragging.current && dragStart.current) {
      const boardRect = boardMainRef.current.getBoundingClientRect();
      const clickX = e.clientX - boardRect.left;
      const clickY = e.clientY - boardRect.top;
      const tweetX = clickX - boardOffset.x;
      const tweetY = clickY - boardOffset.y;
      setTweetPopup({ visible: true, x: tweetX, y: tweetY });
    }
    dragStart.current = null;
    isDragging.current = false;
    setDragging(false);
  };

  // Аналогічна обробка для touch-подій
  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length === 1) {
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
    if (e.changedTouches && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      handleMouseUp({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      });
    }
  };

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
          `${process.env.REACT_APP_HUB_API_URL}/tweets/${id}/dislike`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.put(
          `${process.env.REACT_APP_HUB_API_URL}/tweets/${id}/like`,
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
        `${process.env.REACT_APP_HUB_API_URL}/tweets/${id}/position`,
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
      await axios.delete(`${process.env.REACT_APP_HUB_API_URL}/tweets/${id}`, {
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
    const tweetScreenX = tweet.x + boardOffset.x;
    const tweetScreenY = tweet.y + boardOffset.y;
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
        x: clientWidth / 2 - focusedTweet.x,
        y: clientHeight / 2 - focusedTweet.y,
      });
    }
  };

  return (
    <div className="board-layout" style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Header onLogout={onLogout} />
      <div
        className="board-main"
        ref={boardMainRef}
        style={{
          marginTop: 64,
          width: "100%",
          height: "calc(100vh - 64px)",
          overflow: "hidden",
          position: "relative",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="board-inner"
          style={{
            position: "absolute",
            top: boardOffset.y,
            left: boardOffset.x,
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            backgroundColor: "#fff",
            backgroundImage: "radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
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
                style={{
                  padding: "16px",
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  minWidth: "180px",
                  maxWidth: "300px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <Typography variant="body1" style={{ marginBottom: "8px", color: "#424242" }}>
                  {tweet.text}
                </Typography>
                <Typography variant="caption" style={{ color: "#757575" }}>
                  Автор: {authorUsername}
                </Typography>
                <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
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
                  <Typography variant="caption" style={{ marginLeft: 4, transition: "all 0.3s ease" }}>
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
                </div>
              </Paper>
            );
            return currentUser?._id === tweet.user_id ? (
              <DraggableTweet key={tweet._id} tweet={tweet} onStop={onStopDrag}>
                {tweetContent}
              </DraggableTweet>
            ) : (
              <div
                key={tweet._id}
                style={{ position: "absolute", top: tweet.y, left: tweet.x }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedTweet(tweet);
                }}
              >
                {tweetContent}
              </div>
            );
          })}
          {tweetPopup.visible && (
            <div onClick={handlePopupClick}>
              <TweetPopup
                x={tweetPopup.x}
                y={tweetPopup.y}
                draft={tweetDraft}
                onDraftChange={setTweetDraft}
                onSubmit={handlePopupSubmit}
                onClose={handlePopupClose}
              />
            </div>
          )}
        </div>
        {focusedTweet && !isTweetVisible(focusedTweet) && (
          <div
            className="return-button"
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
