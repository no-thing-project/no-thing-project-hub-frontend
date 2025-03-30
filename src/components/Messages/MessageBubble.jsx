import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import { Delete, Reply, Forward, Save } from "@mui/icons-material";

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
    borderColor: isSentByCurrentUser ? "transparent transparent transparent primary.main" : "transparent grey.200 transparent transparent",
  },
});

const mediaRenderers = {
  image: (item) => <img src={item.content} alt="media" style={{ maxWidth: "100%", borderRadius: "10px" }} />,
  video: (item) => <video controls src={item.content} style={{ maxWidth: "100%", borderRadius: "10px", clipPath: `url(#${item.shape || "square"})` }} />,
  voice: (item) => <audio controls src={item.content} />,
  sticker: (item) => <img src={item.content} alt="sticker" style={{ maxWidth: "100px", borderRadius: "10px" }} />,
  file: (item) => <a href={item.content} download><Typography variant="body2" color="inherit">Download: {item.content.split("/").pop()}</Typography></a>,
};

const MessageBubble = ({ message, isSentByCurrentUser, onDelete, currentUserId, recipient, onSendMediaMessage, messages, setReplyToMessage, onForward }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const renderContent = () => {
    const contents = [];
    if (message.replyTo) {
      const replied = messages.find((m) => m.message_id === message.replyTo);
      if (replied) contents.push(
        <Box key="reply" sx={{ backgroundColor: "rgba(0,0,0,0.1)", p: 1, borderRadius: "10px", mb: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{replied.content.slice(0, 50) + (replied.content.length > 50 ? "..." : "")}</Typography>
        </Box>
      );
    }
    if (message.content) contents.push(<Typography key="content" variant="body1">{message.content}</Typography>);
    message.media?.forEach((item, i) => contents.push(<Box key={`media-${i}`} sx={{ mt: 1 }}>{mediaRenderers[item.type]?.(item)}</Box>));
    return contents;
  };

  return (
    <Box sx={{ display: "flex", justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start", mb: 2 }}>
      <Box sx={messageBubbleStyles(isSentByCurrentUser)} onContextMenu={(e) => { e.preventDefault(); setAnchorEl(e.currentTarget); }}>
        {renderContent()}
        <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.7, display: "block", textAlign: isSentByCurrentUser ? "right" : "left" }}>
          {new Date(message.timestamp).toLocaleTimeString()}
          {isSentByCurrentUser && (message.status === "read" ? " ✓✓" : message.status === "delivered" ? " ✓" : "")}
        </Typography>
      </Box>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setReplyToMessage(message); setAnchorEl(null); }}><Reply sx={{ mr: 1 }} /> Reply</MenuItem>
        <MenuItem onClick={() => { onForward(message); setAnchorEl(null); }}><Forward sx={{ mr: 1 }} /> Forward</MenuItem>
        {message.media?.length > 0 && (
          <MenuItem onClick={() => { const link = document.createElement("a"); link.href = message.media[0].content; link.download = message.media[0].content.split("/").pop(); link.click(); setAnchorEl(null); }}>
            <Save sx={{ mr: 1 }} /> Save
          </MenuItem>
        )}
        {isSentByCurrentUser && <MenuItem onClick={() => { onDelete(message.message_id); setAnchorEl(null); }}><Delete sx={{ mr: 1 }} /> Delete</MenuItem>}
      </Menu>
    </Box>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.object.isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.object,
  onSendMediaMessage: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired, // Додано
};

export default MessageBubble;