import { useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";
import {
  sendMessage,
  fetchMessages,
  markMessageAsRead,
  deleteMessage,
} from "../api/messagesApi";
import config from "../config";

export const useMessages = (token, userId, onLogout, navigate) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred.");
    },
    [onLogout, navigate]
  );

  useEffect(() => {
    if (!token || !userId) return;

    const newSocket = io(`${config.REACT_APP_HUB_API_URL}/messages`, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to messages namespace");
      newSocket.emit("join", userId);
    });

    newSocket.on("newMessage", (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === message.message_id)) return prev;
        return [...prev, message];
      });
    });

    newSocket.on("messageDeleted", (messageId) => {
      setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      handleAuthError({ status: 401, message: "Socket authentication failed" });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, userId, handleAuthError]);

  const fetchMessagesList = useCallback(
    async (filters = {}) => {
      if (!token) {
        setError("Authentication required.");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMessages(token, filters);
        setMessages(data);
        return data;
      } catch (err) {
        handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const sendNewMessage = useCallback(
    async (messageData) => {
      if (!token || !messageData) {
        setError("Authentication or message data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const newMessage = await sendMessage(messageData, token);
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === newMessage.message_id)) return prev;
          return [...prev, newMessage];
        });
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const markMessageRead = useCallback(
    async (messageId) => {
      if (!token || !messageId) {
        setError("Authentication or message ID missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedMessage = await markMessageAsRead(messageId, token);
        setMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true } : m))
        );
        return updatedMessage;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const deleteExistingMessage = useCallback(
    async (messageId) => {
      if (!token || !messageId) {
        setError("Authentication or message ID missing.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteMessage(messageId, token);
        setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
        socket?.emit("deleteMessage", { messageId, userId }); // Повідомляємо іншого користувача
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [token, socket, userId, handleAuthError]
  );

  return {
    messages,
    loading,
    error,
    socket,
    fetchMessagesList,
    sendNewMessage,
    markMessageRead,
    deleteExistingMessage,
  };
};

export default useMessages;