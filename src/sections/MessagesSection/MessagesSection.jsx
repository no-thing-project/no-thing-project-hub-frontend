// src/components/Sections/MessagesSection.jsx
import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { buttonStyles, inputStyles } from "../../styles";

const MessagesSection = ({
  messages,
  sendNewMessage,
  markMessageRead,
  deleteExistingMessage,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");

  const handleSend = () => {
    if (!newMessage || !recipientId) return;
    sendNewMessage({ recipient_id: recipientId, content: { type: "text", value: newMessage } });
    setNewMessage("");
    setRecipientId("");
  };

  return (
    <Box>
      <Typography variant="h6">Messages</Typography>
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
        rows={2}
        margin="normal"
      />
      <Button sx={buttonStyles} onClick={handleSend}>
        Send
      </Button>

      <List>
        {messages.map((msg) => (
          <ListItem key={msg.message_id}>
            <ListItemText
              primary={msg.content.value}
              secondary={`From: ${msg.sender_id} | To: ${msg.recipient_id} | ${
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
        ))}
      </List>
    </Box>
  );
};

export default MessagesSection;