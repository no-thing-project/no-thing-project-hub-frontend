import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

const MessagesList = ({ messages, currentUserId, onMarkRead, onDeleteMessage }) => {
  // Функція для відображення стану прочитано / непрочитано
  const renderMessageStatus = (msg) => {
    const isSentByCurrentUser = msg.sender_id === currentUserId;
    return msg.is_read
      ? "Read"
      : isSentByCurrentUser
      ? "Sent"
      : "Unread";
  };

  return (
    <Box sx={{ maxHeight: { xs: "50vh", md: "70vh" }, overflowY: "auto" }}>
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
                  "&:hover": { backgroundColor: "grey.100" },
                  backgroundColor: !msg.is_read && !isSentByCurrentUser ? "grey.100" : "inherit",
                  flexDirection: { xs: "column", md: "row" }, // Колонка на малих екранах
                }}
              >
                <ListItemText
                  primary={msg.content}
                  secondary={`From: ${msg.sender_id} | To: ${msg.receiver_id} | ${renderMessageStatus(msg)}`}
                  primaryTypographyProps={{ fontWeight: !msg.is_read && !isSentByCurrentUser ? 600 : 400 }}
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
            No messages yet. Start a conversation!
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default MessagesList;
