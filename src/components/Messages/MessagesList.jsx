import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

// Константи
const MAX_HEIGHT = { xs: "50vh", md: "70vh" };
const NO_MESSAGES_TEXT = "No messages yet. Start a conversation!";

// Стилі
const listContainerStyles = {
  maxHeight: MAX_HEIGHT,
  overflowY: "auto",
};

const listItemStyles = (msg, currentUserId) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  py: 1,
  "&:hover": { backgroundColor: "grey.100" },
  backgroundColor: !msg.is_read && msg.sender_id !== currentUserId ? "grey.100" : "inherit",
  flexDirection: { xs: "column", md: "row" },
});

const MessagesList = ({ messages, currentUserId, onMarkRead, onDeleteMessage }) => {
  const renderMessageStatus = (msg) => {
    const isSentByCurrentUser = msg.sender_id === currentUserId;
    return msg.is_read ? "Read" : isSentByCurrentUser ? "Sent" : "Unread";
  };

  return (
    <Box sx={listContainerStyles}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Your Messages
      </Typography>
      <Divider />
      <List>
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSentByCurrentUser = msg.sender_id === currentUserId;
            return (
              <ListItem key={msg.message_id} sx={listItemStyles(msg, currentUserId)}>
                <ListItemText
                  primary={msg.content}
                  secondary={`From: ${msg.sender_id} | To: ${msg.receiver_id} | ${renderMessageStatus(msg)}`}
                  primaryTypographyProps={{
                    fontWeight: !msg.is_read && !isSentByCurrentUser ? 600 : 400,
                  }}
                />
                <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, md: 0 } }}>
                  {!msg.is_read && !isSentByCurrentUser && (
                    <Button
                      variant="contained"
                      onClick={() => onMarkRead(msg.message_id)}
                      sx={{ ...actionButtonStyles, minWidth: { xs: "100%", md: "120px" } }}
                    >
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => onDeleteMessage(msg.message_id)}
                    sx={{ ...actionButtonStyles, minWidth: { xs: "100%", md: "100px" } }}
                  >
                    Delete
                  </Button>
                </Box>
              </ListItem>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {NO_MESSAGES_TEXT}
          </Typography>
        )}
      </List>
    </Box>
  );
};

MessagesList.propTypes = {
  messages: PropTypes.array.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
};

MessagesList.defaultProps = {
  messages: [],
};

export default MessagesList;