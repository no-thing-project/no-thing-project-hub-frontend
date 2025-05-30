/**
 * @module useWebSocket
 * @description Custom hook to manage WebSocket connection for real-time updates on a board.
 */
import { useEffect, useRef } from "react";
import io from "socket.io-client";
import config from "../config";

export const useWebSocket = (
  token,
  boardId,
  currentUser,
  setTweets,
  setOnlineUsers,
  onLogout,
  navigate,
  showNotification
) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !boardId || !currentUser?.anonymous_id) return;

    // Initialize WebSocket connection to the 'tweets' namespace
    const socket = io(`${config.REACT_APP_WS_URL}/tweets`, {
      query: { token, boardId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    // Handle connection errors
    socket.on("connect_error", (err) => {
      if (err.message.includes("Authentication")) {
        showNotification("Session expired. Please log in again.", "error");
        onLogout();
        navigate("/login");
      } else {
        showNotification("Failed to connect to real-time updates.", "error");
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [token, boardId, currentUser?.anonymous_id, onLogout, navigate, showNotification]);

  return socketRef;
};