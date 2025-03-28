import { useState, useCallback } from "react";
import { sendMessage, fetchMessages, markMessageAsRead, deleteMessage, uploadFile } from "../api/messagesApi";

export const useMessages = (token, userId, onLogout, navigate) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingMediaList, setPendingMediaList] = useState([]);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout("Your session has expired. Please log in again.");
        navigate("/login");
        setError("Session expired. Redirecting to login...");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    },
    [onLogout, navigate]
  );

  const fetchMessagesList = useCallback(
    async ({ signal } = {}) => {
      if (!token) {
        setError("Authentication token is missing.");
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
      if (!token || !messageData || !messageData.recipientId || !messageData.content) {
        setError("Authentication token or message data (recipientId/content) is missing.");
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
    async (messageData) => {
      if (!token || !messageData || !messageData.recipientId) {
        setError("Authentication token or recipient ID is missing.");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const { recipientId, content = "Media message", media = [] } = messageData;
        let finalContent = content;
        let messageType = "text";

        if (media.length > 0) {
          // Завантажуємо файл і додаємо URL у content
          const uploadedUrl = await uploadFile(media[0].file, token); // Припускаємо, що тільки один файл
          if (!uploadedUrl) throw new Error(`Failed to upload file: ${media[0].file.name}`);
          finalContent = `${content} ${uploadedUrl}`; // Додаємо URL до content
          messageType = media[0].type; // Використовуємо тип медіа (image, video тощо)
        }

        const finalMessageData = {
          recipientId,
          content: finalContent,
          type: messageType,
        };
        console.log("Final message data sent to server:", finalMessageData); // Дебагування

        const newMessage = await sendMessage(finalMessageData, token);
        setMessages((prev) => [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        setPendingMediaList([]);
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
    if (!file || !type) {
      setError("File or type is missing for pending media.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingMediaList((prev) => [...prev, { file, type, preview }]);
  }, []);

  const clearPendingMedia = useCallback((index) => {
    setPendingMediaList((prev) => {
      if (index !== undefined) {
        const newList = [...prev];
        const removed = newList.splice(index, 1)[0];
        if (removed.preview) URL.revokeObjectURL(removed.preview);
        return newList;
      } else {
        prev.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
        return [];
      }
    });
  }, []);

  const markMessageRead = useCallback(
    async (messageId) => {
      if (!token || !messageId) {
        setError("Authentication token or message ID is missing.");
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
        setError("Authentication token or message ID is missing.");
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
    pendingMediaList,
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