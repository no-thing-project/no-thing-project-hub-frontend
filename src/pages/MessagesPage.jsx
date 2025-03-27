import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Alert, Snackbar, Typography } from "@mui/material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useMessages from "../hooks/useMessages";
import useSocial from "../hooks/useSocial";
import { useNotification } from "../context/NotificationContext";
import ProfileHeader from "../components/Headers/ProfileHeader";
import ConversationsList from "../components/Messages/ConversationsList";
import ChatView from "../components/Messages/ChatView";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    pendingMedia,
    fetchMessagesList,
    sendNewMessage,
    sendMediaMessage,
    setPendingMediaFile,
    clearPendingMedia,
    markMessageRead,
    deleteExistingMessage,
  } = useMessages(token, authData?.anonymous_id, handleLogout, navigate);
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      showNotification("Authentication missing.", "error");
      return;
    }
    try {
      await Promise.all([fetchMessagesList(), getFriends()]);
    } catch (err) {
      showNotification(err.message || "Failed to load data", "error");
    }
  }, [isAuthenticated, token, fetchMessagesList, getFriends, showNotification]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  const handleMarkRead = async (messageId) => {
    try {
      await markMessageRead(messageId);
      setSuccess("Message marked as read!");
      await fetchMessagesList();
    } catch (err) {
      showNotification(err.message || "Failed to mark message as read", "error");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteExistingMessage(messageId);
      setSuccess("Message deleted successfully!");
      await fetchMessagesList();
    } catch (err) {
      showNotification(err.message || "Failed to delete message", "error");
    }
  };

  const handleCloseSnackbar = () => setSuccess("");

  if (authLoading || messagesLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle="Messages">
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true} />
        {messagesError && <Alert severity="error" sx={{ mt: 2 }}>{messagesError}</Alert>}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Box sx={{ flex: "1 1 30%", maxWidth: "400px" }}>
            <ConversationsList
              messages={messages}
              friends={friends}
              currentUserId={authData.anonymous_id}
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
            />
          </Box>
          <Box sx={{ flex: "1 1 70%" }}>
            {selectedConversationId ? (
              <ChatView
                messages={messages.filter((msg) =>
                  [msg.sender_id, msg.receiver_id].includes(selectedConversationId)
                )}
                currentUserId={authData.anonymous_id}
                recipient={friends.find((f) => f.anonymous_id === selectedConversationId)}
                onSendMessage={sendNewMessage}
                onSendMediaMessage={sendMediaMessage}
                onMarkRead={handleMarkRead}
                onDeleteMessage={handleDeleteMessage}
                token={token}
                fetchMessagesList={fetchMessagesList}
                pendingMedia={pendingMedia}
                setPendingMediaFile={setPendingMediaFile}
                clearPendingMedia={clearPendingMedia}
              />
            ) : (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
                Select a friend to start chatting
              </Typography>
            )}
          </Box>
        </Box>

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
};

export default MessagesPage;