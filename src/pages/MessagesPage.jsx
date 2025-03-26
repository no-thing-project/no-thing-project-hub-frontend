import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Alert, Snackbar } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useMessages from "../hooks/useMessages";
import useSocial from "../hooks/useSocial";
import { useNotification } from "../context/NotificationContext";
import { actionButtonStyles } from "../styles/BaseStyles";
import ProfileHeader from "../components/Headers/ProfileHeader";
import MessageFormDialog from "../components/Dialogs/MessageFormDialog";
import MessagesList from "../components/Messages/MessagesList";

const MessagesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    fetchMessagesList,
    sendNewMessage,
    markMessageRead,
    deleteExistingMessage,
  } = useMessages(token, authData?.anonymous_id, handleLogout, navigate);
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [newMessage, setNewMessage] = useState("");
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

  const handleOpenSendMessage = () => {
    setRecipientId("");
    setNewMessage("");
    setCreateDialogOpen(true);
  };

  const handleCancelSendMessage = () => {
    setCreateDialogOpen(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientId.trim()) {
      showNotification("Recipient and message content are required!", "error");
      return;
    }
    const messageData = {
      recipientId,
      content: newMessage.trim(),
    };
    try {
      await sendNewMessage(messageData);
      setSuccess("Message sent successfully!");
      setCreateDialogOpen(false);
      setNewMessage("");
      setRecipientId("");
      await fetchMessagesList();
    } catch (err) {
      showNotification(err.message || "Failed to send message", "error");
    }
  };

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

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  if (authLoading || messagesLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} headerTitle="Messages">
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            variant="contained"
            onClick={handleOpenSendMessage}
            startIcon={<Add />}
            sx={actionButtonStyles}
          >
            New Message
          </Button>
        </ProfileHeader>

        {messagesError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {messagesError}
          </Alert>
        )}

        <Box sx={{ my: 4 }}>
          <MessagesList
            messages={messages}
            currentUserId={authData.anonymous_id}
            onMarkRead={handleMarkRead}
            onDeleteMessage={handleDeleteMessage}
          />
        </Box>

        <MessageFormDialog
          open={createDialogOpen}
          title="Send a New Message"
          recipientId={recipientId}
          setRecipientId={setRecipientId}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          friends={friends}
          onSave={handleSendMessage}
          onCancel={handleCancelSendMessage}
        />

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