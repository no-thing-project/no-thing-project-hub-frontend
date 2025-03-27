import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Typography, TextField, Button, IconButton } from "@mui/material";
import { Send, Delete } from "@mui/icons-material";
import { actionButtonStyles } from "../../styles/BaseStyles";

// Стилі як константи
const chatContainerStyles = {
  display: "flex",
  flexDirection: "column",
  height: "70vh",
  border: "1px solid",
  borderColor: "grey.300",
  borderRadius: 1,
  backgroundColor: "background.paper",
};

const headerStyles = {
  p: 2,
  borderBottom: "1px solid",
  borderColor: "grey.300",
  backgroundColor: "grey.50",
};

const messagesAreaStyles = {
  flex: 1,
  overflowY: "auto",
  p: 2,
  backgroundColor: "white",
};

const messageBubbleStyles = (isSentByCurrentUser) => ({
  maxWidth: "70%",
  p: 1.5,
  borderRadius: "30px",
  backgroundColor: isSentByCurrentUser ? "primary.main" : "grey.200",
  color: isSentByCurrentUser ? "white" : "text.primary",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  position: "relative",
  "&:before": {
    content: '""',
    position: "absolute",
    width: 0,
    height: 0,
    border: "8px solid transparent",
    top: "50%",
    transform: "translateY(-50%)",
    [isSentByCurrentUser ? "right" : "left"]: "-8px",
    borderColor: isSentByCurrentUser
      ? "transparent transparent transparent primary.main"
      : "transparent grey.200 transparent transparent",
  },
});

const inputAreaStyles = {
  p: 2,
  borderTop: "1px solid",
  borderColor: "grey.300",
  display: "flex",
  gap: 1,
  backgroundColor: "grey.50",
};

// Компонент для бульбашки повідомлення
const MessageBubble = ({ message, isSentByCurrentUser, onDelete }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
      mb: 2,
    }}
  >
    <Box sx={messageBubbleStyles(isSentByCurrentUser)}>
      <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
        {message.content}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onDelete(message.message_id)}
          sx={{ color: isSentByCurrentUser ? "white" : "error.main" }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  </Box>
);

// Основний компонент
const ChatView = ({
  messages,
  currentUserId,
  recipient,
  onSendMessage,
  onMarkRead,
  onDeleteMessage,
  token,
  fetchMessagesList,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const unreadMessages = messages.filter((m) => m.receiver_id === currentUserId && !m.is_read);
    unreadMessages.forEach((m) => onMarkRead(m.message_id));
  }, [messages, currentUserId, onMarkRead]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    const messageData = { recipientId: recipient.anonymous_id, content: messageInput.trim() };
    await onSendMessage(messageData);
    setMessageInput("");
    await fetchMessagesList();
  };

  return (
    <Box sx={chatContainerStyles}>
      <Typography variant="h6" sx={headerStyles}>
        Chat with {recipient?.username || `User (${recipient?.anonymous_id})`}
      </Typography>
      <Box sx={messagesAreaStyles}>
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.message_id}
              message={msg}
              isSentByCurrentUser={msg.sender_id === currentUserId}
              onDelete={onDeleteMessage}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
            No messages yet. Start the conversation!
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={inputAreaStyles}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          sx={{ backgroundColor: "white" }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<Send />}
          sx={actionButtonStyles}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

// Типізація пропсів
ChatView.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      sender_id: PropTypes.string.isRequired,
      receiver_id: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      is_read: PropTypes.bool.isRequired,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string.isRequired,
    username: PropTypes.string,
  }).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
  }).isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ChatView;