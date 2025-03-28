import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, IconButton, CircularProgress } from "@mui/material";
import { Delete } from "@mui/icons-material";

const messageBubbleStyles = (isSentByCurrentUser) => ({
  maxWidth: { xs: "85%", md: "70%" },
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

const MessageBubble = ({ message, isSentByCurrentUser, onDelete, isSending }) => {
  const renderContent = () => {
    const contents = [];
    const { content, type } = message;

    // Регулярний вираз для пошуку URL у тексті
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    const textParts = content.split(urlRegex);

    // Обробляємо кожну частину content
    textParts.forEach((part, index) => {
      if (part && !urls.includes(part)) {
        // Якщо це текст (не URL)
        contents.push(
          <Typography key={`text-${index}`} variant="body1" sx={{ wordBreak: "break-word" }}>
            {part}
          </Typography>
        );
      } else if (part && urls.includes(part)) {
        // Якщо це URL, відображаємо залежно від type
        switch (type) {
          case "image":
          case "sticker":
            contents.push(
              <img
                key={`media-${index}`}
                src={part}
                alt={type}
                style={{ maxWidth: "100%", borderRadius: "10px", marginTop: contents.length > 0 ? "8px" : "0" }}
              />
            );
            break;
          case "video":
            contents.push(
              <video
                key={`media-${index}`}
                src={part}
                controls
                style={{ maxWidth: "100%", borderRadius: "10px", marginTop: contents.length > 0 ? "8px" : "0" }}
              />
            );
            break;
          case "voice":
            contents.push(
              <audio
                key={`media-${index}`}
                src={part}
                controls
                style={{ maxWidth: "100%", marginTop: contents.length > 0 ? "8px" : "0" }}
              />
            );
            break;
          case "file":
            contents.push(
              <a
                key={`media-${index}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Typography variant="body1" sx={{ mt: contents.length > 0 ? "8px" : "0" }}>
                  File: {part.split('/').pop().split('?')[0]}
                </Typography>
              </a>
            );
            break;
          default:
            // Якщо тип не медіа, просто показуємо URL як текст
            contents.push(
              <Typography key={`text-${index}`} variant="body1" sx={{ wordBreak: "break-word" }}>
                {part}
              </Typography>
            );
        }
      }
    });

    // Якщо нічого немає (заглушка)
    if (contents.length === 0) {
      contents.push(
        <Typography key="empty" variant="body1" sx={{ opacity: 0.7 }}>
          Empty message
        </Typography>
      );
    }

    return contents;
  };

  const renderStatus = () => {
    if (!isSentByCurrentUser) return null;
    if (isSending) {
      return <CircularProgress size={16} sx={{ color: "white", mr: 1 }} />;
    }
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
          {!isSending && (
            <IconButton
              size="small"
              onClick={() => onDelete(message.message_id)}
              sx={{ color: isSentByCurrentUser ? "white" : "error.main" }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    content: PropTypes.string,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
      })
    ),
    type: PropTypes.string,
    status: PropTypes.oneOf(["sent", "delivered", "read"]).isRequired,
    timestamp: PropTypes.string.isRequired,
  }).isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  isSending: PropTypes.bool,
};

export default MessageBubble;