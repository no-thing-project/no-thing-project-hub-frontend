import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Send,
  Delete,
  AttachFile,
  PhotoCamera,
  Mic,
  Videocam,
  InsertEmoticon,
  Clear,
} from "@mui/icons-material";
import { actionButtonStyles } from "../../styles/BaseStyles";

// Стилі
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
  borderRadius: "20px",
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
  alignItems: "center",
};

const previewStyles = {
  p: 1,
  mb: 1,
  border: "1px dashed",
  borderColor: "grey.400",
  borderRadius: 1,
  backgroundColor: "grey.100",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

// Компонент для бульбашки повідомлення
const MessageBubble = ({ message, isSentByCurrentUser, onDelete }) => {
  const renderContent = () => {
    switch (message.type) {
      case "text":
        return <Typography variant="body1" sx={{ wordBreak: "break-word" }}>{message.content}</Typography>;
      case "image":
        return <img src={message.content} alt="Image" style={{ maxWidth: "100%", borderRadius: "10px" }} />;
      case "file":
        return (
          <a href={message.content} target="_blank" rel="noopener noreferrer" download>
            <Typography variant="body1">File: {message.content.split('/').pop().split('?')[0]}</Typography>
          </a>
        );
      case "voice":
        return <audio controls src={message.content} style={{ maxWidth: "100%" }} />;
      case "video":
        return <video controls src={message.content} style={{ maxWidth: "100%", borderRadius: "10px" }} />;
      case "sticker":
        return <img src={message.content} alt="Sticker" style={{ maxWidth: "150px" }} />;
      default:
        return <Typography variant="body1">Unsupported message type</Typography>;
    }
  };

  const renderStatus = () => {
    if (!isSentByCurrentUser) return null;
    switch (message.status) {
      case "sent":
        return <Typography variant="caption" sx={{ opacity: 0.7 }}>✓ Sent</Typography>;
      case "delivered":
        return <Typography variant="caption" sx={{ opacity: 0.7 }}>✓✓ Delivered</Typography>;
      case "read":
        return <Typography variant="caption" sx={{ opacity: 0.7, color: "lightblue" }}>✓✓ Read</Typography>;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <Box sx={messageBubbleStyles(isSentByCurrentUser)}>
        {renderContent()}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Typography>
          {renderStatus()}
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
};

// Компонент для попереднього перегляду файлу
const MediaPreview = ({ pendingMedia, onClear }) => {
  const renderPreview = () => {
    switch (pendingMedia.type) {
      case "image":
      case "sticker":
        return <img src={pendingMedia.preview} alt="Preview" style={{ maxWidth: "100px", borderRadius: "5px" }} />;
      case "video":
        return <video src={pendingMedia.preview} controls style={{ maxWidth: "100px", borderRadius: "5px" }} />;
      case "voice":
        return <audio src={pendingMedia.preview} controls />;
      case "file":
        return <Typography variant="body2">{pendingMedia.file.name}</Typography>;
      default:
        return null;
    }
  };

  return (
    <Paper sx={previewStyles}>
      {renderPreview()}
      <IconButton size="small" onClick={onClear}>
        <Clear />
      </IconButton>
    </Paper>
  );
};

// Основний компонент
const ChatView = ({
  messages,
  currentUserId,
  recipient,
  onSendMessage,
  onSendMediaMessage,
  onMarkRead,
  onDeleteMessage,
  token,
  fetchMessagesList,
  pendingMedia,
  setPendingMediaFile,
  clearPendingMedia,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const unreadMessages = messages.filter((m) => m.receiver_id === currentUserId && !m.is_read);
    unreadMessages.forEach((m) => onMarkRead(m.message_id));
  }, [messages, currentUserId, onMarkRead]);

  const handleSend = async () => {
    if (!messageInput.trim() && !pendingMedia) return;

    try {
      if (pendingMedia) {
        await onSendMediaMessage(pendingMedia.file, pendingMedia.type, recipient.anonymous_id);
      } else if (messageInput.trim()) {
        const messageData = { recipientId: recipient.anonymous_id, content: messageInput.trim() };
        await onSendMessage(messageData);
      }
      setMessageInput("");
      clearPendingMedia();
      await fetchMessagesList();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    setPendingMediaFile(file, type);
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
      {pendingMedia && <MediaPreview pendingMedia={pendingMedia} onClear={clearPendingMedia} />}
      <Box sx={inputAreaStyles}>
        <Tooltip title="Attach File">
          <IconButton component="label">
            <AttachFile />
            <input type="file" hidden onChange={(e) => handleFileUpload(e, "file")} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Send Photo">
          <IconButton component="label">
            <PhotoCamera />
            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "image")} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Record Voice">
          <IconButton component="label">
            <Mic />
            <input type="file" hidden accept="audio/*" onChange={(e) => handleFileUpload(e, "voice")} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Send Video">
          <IconButton component="label">
            <Videocam />
            <input type="file" hidden accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Send Sticker">
          <IconButton component="label">
            <InsertEmoticon />
            <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "sticker")} />
          </IconButton>
        </Tooltip>
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
          disabled={!messageInput.trim() && !pendingMedia}
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
      type: PropTypes.oneOf(["text", "file", "image", "voice", "video", "sticker"]).isRequired,
      status: PropTypes.oneOf(["sent", "delivered", "read"]).isRequired,
      is_read: PropTypes.bool.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string.isRequired,
    username: PropTypes.string,
  }).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMedia: PropTypes.shape({
    file: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    preview: PropTypes.string.isRequired,
  }),
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
  }).isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
};

MediaPreview.propTypes = {
  pendingMedia: PropTypes.shape({
    file: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    preview: PropTypes.string.isRequired,
  }).isRequired,
  onClear: PropTypes.func.isRequired,
};

export default ChatView;