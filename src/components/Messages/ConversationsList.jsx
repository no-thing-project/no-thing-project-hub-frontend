import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Badge } from "@mui/material";

const ConversationsList = ({
  messages,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
}) => {
  const getConversationData = (friendId) => {
    const conversationMessages = messages.filter(
      (msg) => [msg.sender_id, msg.receiver_id].includes(friendId)
    );
    const lastMessage = conversationMessages.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
    const unreadCount = conversationMessages.filter(
      (m) => m.receiver_id === currentUserId && !m.is_read && m.sender_id === friendId
    ).length;
    return { lastMessage, unreadCount };
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Friends
      </Typography>
      <List>
        {friends.length > 0 ? (
          friends.map((friend) => {
            const { lastMessage, unreadCount } = getConversationData(friend.anonymous_id);
            return (
              <ListItem
                key={friend.anonymous_id}
                onClick={() => onSelectConversation(friend.anonymous_id)}
                sx={{
                  py: 1,
                  cursor: "pointer",
                  backgroundColor:
                    selectedConversationId === friend.anonymous_id ? "grey.200" : "inherit",
                  "&:hover": { backgroundColor: "grey.100" },
                }}
              >
                <ListItemText
                  primary={friend.username || `User (${friend.anonymous_id})`}
                  secondary={
                    lastMessage
                      ? lastMessage.content.slice(0, 50) + (lastMessage.content.length > 50 ? "..." : "")
                      : "No messages yet"
                  }
                  primaryTypographyProps={{ fontWeight: unreadCount > 0 ? 600 : 400 }}
                />
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="primary" sx={{ mr: 2 }} />
                )}
              </ListItem>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No friends yet. Add someone to start chatting!
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default ConversationsList;