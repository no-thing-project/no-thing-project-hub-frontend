import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

const MessagesList = ({ messages, currentUserId, onMarkRead, onDeleteMessage }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Your Messages
      </Typography>
      <Divider />
      <List>
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isSentByCurrentUser = msg.sender_id === currentUserId;
            return (
              <ListItem
                key={msg.message_id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  "&:hover": { backgroundColor: "background.hover" },
                  backgroundColor: !msg.is_read && !isSentByCurrentUser ? "grey.100" : "inherit",
                }}
              >
                <ListItemText
                  primary={msg.content}
                  secondary={`From: ${msg.sender_id} | To: ${msg.receiver_id} | ${
                    msg.is_read ? "Read" : "Unread"
                  }`}
                  primaryTypographyProps={{ fontWeight: !msg.is_read && !isSentByCurrentUser ? 600 : 400 }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  {!msg.is_read && !isSentByCurrentUser && (
                    <Button
                      variant="contained"
                      onClick={() => onMarkRead(msg.message_id)}
                      sx={{ ...actionButtonStyles, minWidth: "120px" }}
                    >
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => onDeleteMessage(msg.message_id)}
                    sx={{ ...actionButtonStyles, minWidth: "100px" }}
                  >
                    Delete
                  </Button>
                </Box>
              </ListItem>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No messages yet. Start a conversation!
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default MessagesList;