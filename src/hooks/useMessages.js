// src/hooks/useMessages.js
import { useState, useCallback } from "react";
import {
  sendMessage,
  fetchMessages,
  markMessageAsRead,
  deleteMessage,
} from "../api/messagesApi";

export const useMessages = (token, userId, onLogout, navigate) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const fetchMessagesList = useCallback(
    async ({ signal } = {}) => {
      if (!token) {
        setError("Authentication required.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMessages(token, {}, signal);
        setMessages(data || []);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Fetch aborted");
          return;
        }
        handleAuthError(err);
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
        return newMessage; // Повертаємо нове повідомлення, але не оновлюємо стан локально
      } catch (err) {
        handleAuthError(err);
        throw err;
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
        throw err;
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
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    messages,
    loading,
    error,
    fetchMessagesList,
    sendNewMessage,
    markMessageRead,
    deleteExistingMessage,
  };
};

export default useMessages;