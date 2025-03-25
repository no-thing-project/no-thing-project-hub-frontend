import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useMessages from "../hooks/useMessages";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { inputStyles } from "../styles/BaseStyles";
import { containerStyles } from "../styles/ProfileStyles";
import { buttonStyles } from "../styles/BoardSectionStyles";
import { useNotification } from "../context/NotificationContext";

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

  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && token && authData) {
      fetchMessagesList().catch((err) => {
        console.error("Failed to fetch messages:", err);
        showNotification(err.message || "Failed to load messages", "error");
      });
    }
  }, [authLoading, isAuthenticated, token, authData, fetchMessagesList, showNotification]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientId.trim()) {
      showNotification("Recipient ID and message content are required!", "error");
      return;
    }

    const messageData = {
      recipientId,
      content: newMessage.trim(),
    };

    try {
      await sendNewMessage(messageData);
      setSuccess("Message sent successfully!");
      setNewMessage("");
      setRecipientId("");
      await fetchMessagesList();
    } catch (err) {
      showNotification(err.message || "Failed to send message", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || messagesLoading;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !authData) {
    navigate("/login");
    return null;
  }
  if (messagesError === "User not found") {
    showNotification("Profile not found. Please try again or check your profile ID.", "error");
  }

  return (
    <AppLayout
      currentUser={authData}
      onLogout={handleLogout}
      token={token}
      headerTitle="Messages"
    >
      <Container sx={containerStyles}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>

        {messagesError && <Alert severity="error">{messagesError}</Alert>}

        <Box sx={{ mb: 4 }}>
          <TextField
            label="Recipient ID"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            sx={inputStyles}
            fullWidth
            margin="normal"
          />
          <TextField
            label="New Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={inputStyles}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />
          <Button sx={buttonStyles} onClick={handleSendMessage}>
            Send
          </Button>
        </Box>

        <Box>
          <Typography variant="h6">Your Messages</Typography>
          <List>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <ListItem key={msg.message_id}>
                  <ListItemText
                    primary={msg.content}
                    secondary={`From: ${msg.sender_id} | To: ${msg.receiver_id} | ${
                      msg.is_read ? "Read" : "Unread"
                    }`}
                  />
                  <Box>
                    {!msg.is_read && (
                      <Button
                        sx={{ ...buttonStyles, mr: 1 }}
                        onClick={() => markMessageRead(msg.message_id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      sx={buttonStyles}
                      onClick={() => deleteExistingMessage(msg.message_id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </ListItem>
              ))
            ) : (
              <Typography>No messages yet.</Typography>
            )}
          </List>
        </Box>
      </Container>
    </AppLayout>
  );
};

export default MessagesPage;