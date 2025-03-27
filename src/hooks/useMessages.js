import { useState, useCallback } from "react";
import { sendMessage, fetchMessages, markMessageAsRead, deleteMessage, uploadFile } from "../api/messagesApi";

export const useMessages = (token, userId, onLogout, navigate) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMedia, setPendingMedia] = useState(null); // Для зберігання файлу перед відправкою

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
        setMessages(
          (data || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );
      } catch (err) {
        if (err.name === "AbortError") return;
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
        const newMessage = await sendMessage({ ...messageData, type: "text" }, token);
        setMessages((prev) => [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const sendMediaMessage = useCallback(
    async (file, type, recipientId) => {
      if (!token || !file || !recipientId) {
        setError("Authentication or data missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const uploadedUrl = await uploadFile(file, token);
        const messageData = { recipientId, content: uploadedUrl, type };
        const newMessage = await sendMessage(messageData, token);
        setMessages((prev) => [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setPendingMedia(null); // Очищаємо після відправки
        return newMessage;
      } catch (err) {
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  const setPendingMediaFile = useCallback((file, type) => {
    setPendingMedia({ file, type, preview: URL.createObjectURL(file) });
  }, []);

  const clearPendingMedia = useCallback(() => {
    if (pendingMedia?.preview) URL.revokeObjectURL(pendingMedia.preview);
    setPendingMedia(null);
  }, [pendingMedia]);

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
          prev.map((m) => (m.message_id === messageId ? { ...m, is_read: true, status: "read" } : m))
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
    pendingMedia,
    fetchMessagesList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    deleteExistingMessage,
  };
};

export default useMessages;