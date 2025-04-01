import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Menu, MenuItem } from "@mui/material";
import { Delete, Reply, Forward, Save } from "@mui/icons-material";
import { motion } from "framer-motion";

const MEDIA_RENDERERS = {
  image: (item) => (
    <img
      src={item.content}
      alt="media"
      style={{ maxWidth: "100%", borderRadius: "10px" }}
      onError={(e) => (e.target.src = "/fallback-image.jpg")}
    />
  ),
  video: (item) => (
    <video
      controls
      src={item.content}
      style={{
        maxWidth: "100%",
        borderRadius: "10px",
        clipPath: `url(#${item.shape || "square"})`,
      }}
    />
  ),
  voice: (item) => <audio controls src={item.content} />,
  sticker: (item) => (
    <img
      src={item.content}
      alt="sticker"
      style={{ maxWidth: "100px", borderRadius: "10px" }}
    />
  ),
  file: (item) => (
    <a href={item.content} download>
      <Typography variant="body2" color="inherit">
        Download: {item.content.split("/").pop()}
      </Typography>
    </a>
  ),
};

const MESSAGE_BUBBLE_STYLES = (isSentByCurrentUser) => ({
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

const TIMESTAMP_STYLES = {
  fontSize: "0.75rem",
  opacity: 0.7,
  mt: 0.5,
};

const MessageBubble = ({
  message,
  isSentByCurrentUser,
  onDelete,
  currentUserId,
  recipient,
  onSendMediaMessage,
  messages,
  setReplyToMessage,
  onForward,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleContextMenu = (event) => {
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleDelete = () => {
    onDelete(message.message_id);
    handleClose();
  };

  const handleReply = () => {
    setReplyToMessage(message);
    handleClose();
  };

  const handleForward = () => {
    onForward(message);
    handleClose();
  };

  const handleSave = () => {
    // Власна логіка збереження
    handleClose();
  };

  const renderContent = () => {
    const contents = [];
    if (message.replyTo) {
      const replied = messages.find((m) => m.message_id === message.replyTo);
      if (replied) {
        contents.push(
          <Box
            key="reply"
            sx={{
              backgroundColor: "rgba(0,0,0,0.1)",
              p: 1,
              borderRadius: "10px",
              mb: 1,
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {replied.content.slice(0, 50) +
                (replied.content.length > 50 ? "..." : "")}
            </Typography>
          </Box>
        );
      }
    }
    if (message.content) {
      contents.push(
        <Typography key="content" variant="body1">
          {message.content}
        </Typography>
      );
    }
    message.media?.forEach((item, i) => {
      const Renderer = MEDIA_RENDERERS[item.type];
      if (Renderer) {
        contents.push(
          <Box key={`media-${i}`} sx={{ mt: 1 }}>
            <Renderer {...item} />
          </Box>
        );
      }
    });
    return contents;
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isSentByCurrentUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={MESSAGE_BUBBLE_STYLES(isSentByCurrentUser)}
          onContextMenu={handleContextMenu}
          aria-controls={anchorEl ? "message-menu" : undefined}
          aria-haspopup="true"
        >
          {renderContent()}
          <Typography sx={TIMESTAMP_STYLES}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>
        </Box>
      </motion.div>

      <Menu
        id="message-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleReply}>
          <Reply fontSize="small" sx={{ mr: 1 }} /> Reply
        </MenuItem>
        <MenuItem onClick={handleForward}>
          <Forward fontSize="small" sx={{ mr: 1 }} /> Forward
        </MenuItem>
        {isSentByCurrentUser && (
          <MenuItem onClick={handleDelete}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
        <MenuItem onClick={handleSave}>
          <Save fontSize="small" sx={{ mr: 1 }} /> Save
        </MenuItem>
      </Menu>
    </Box>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    sender_id: PropTypes.string.isRequired,
    receiver_id: PropTypes.string,
    content: PropTypes.string,
    media: PropTypes.array,
    timestamp: PropTypes.string.isRequired,
    replyTo: PropTypes.string,
  }).isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.object,
  onSendMediaMessage: PropTypes.func.isRequired,
  messages: PropTypes.array.isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
};

MessageBubble.defaultProps = {
  media: [],
};

export default MessageBubble;
