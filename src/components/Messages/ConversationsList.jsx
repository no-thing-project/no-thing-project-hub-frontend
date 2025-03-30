import React, { useState, useMemo, useCallback } from "react";
import { Box, Typography, List, TextField, CircularProgress, Button, Menu, MenuItem } from "@mui/material";
import { Add } from "@mui/icons-material";
import ConversationItem from "./ConversationItem";

const ConversationsList = ({
  messages,
  groupChats,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  onDeleteGroupChat,
  onDeleteConversation,
  isLoading: externalLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const getConversationData = useMemo(() => {
    return (group_id, isGroup = false) => {
      const convMessages = messages.filter((msg) =>
        isGroup ? msg.group_id === group_id : [msg.sender_id, msg.receiver_id].includes(group_id) && !msg.group_id
      );
      const lastMessage = convMessages.length
        ? convMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
        : null;
      const unreadCount = convMessages.filter((m) => m.receiver_id === currentUserId && !m.is_read).length;
      console.log(`Conversation data for ${isGroup ? "group" : "friend"} ${group_id}:`, { lastMessage, unreadCount });
      return { lastMessage, unreadCount };
    };
  }, [messages, currentUserId]);

  const filteredGroupChats = useMemo(() => {
    const filtered = groupChats.filter((g) =>
      g.members.includes(currentUserId) && g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log("filteredGroupChats:", filtered);
    return filtered;
  }, [groupChats, currentUserId, searchQuery]);

  const filteredFriends = useMemo(() => {
    const filtered = friends.filter((f) =>
      (f.username || f.anonymous_id).toLowerCase().includes(searchQuery.toLowerCase())
    );
    console.log("filteredFriends:", filtered);
    return filtered;
  }, [friends, searchQuery]);

  const activeConversations = useMemo(() => {
    const friendIdsWithMessages = new Set(
      messages
        .filter((msg) => !msg.group_id) // Тільки приватні повідомлення
        .map((msg) => {
          console.log("Processing message:", msg); // Дебаг кожного повідомлення
          return [msg.sender_id, msg.receiver_id].filter((id) => id !== undefined); // Фільтруємо undefined
        })
        .flat()
    );
    const result = filteredFriends.filter((friend) => friendIdsWithMessages.has(friend.anonymous_id));
    console.log("friendIdsWithMessages:", [...friendIdsWithMessages]);
    console.log("activeConversations:", result);
    return result;
  }, [filteredFriends, messages]);

  const availableFriends = useMemo(() => {
    const result = filteredFriends.filter(
      (friend) => !activeConversations.some((active) => active.anonymous_id === friend.anonymous_id)
    );
    console.log("availableFriends:", result);
    return result;
  }, [filteredFriends, activeConversations]);

  const hasConversations = messages.length > 0 || groupChats.length > 0;
  const hasFriends = friends.length > 0;

  const handleNewChatClick = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleFriendSelect = useCallback(
    (friendId) => {
      console.log("Selected friend ID:", friendId);
      onSelectConversation(friendId);
      setAnchorEl(null);
    },
    [onSelectConversation]
  );
  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  console.log("ConversationsList render:");
  console.log("currentUserId:", currentUserId);
  console.log("messages:", messages);
  console.log("groupChats:", groupChats);
  console.log("friends:", friends);
  console.log("filteredGroupChats:", filteredGroupChats);
  console.log("activeConversations:", activeConversations);

  return (
    <Box sx={{ mt: 2, maxHeight: { xs: "50vh", md: "70vh" }, overflowY: "auto" }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Conversations</Typography>
      {externalLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress />
        </Box>
      ) : !hasFriends ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Add friends to start chatting!
          </Typography>
        </Box>
      ) : !hasConversations ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No conversations yet. Start chatting now!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewChatClick}
            disabled={availableFriends.length === 0}
          >
            Start Chat
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewChatClick}
              disabled={availableFriends.length === 0}
            >
              New Chat
            </Button>
          </Box>
          <List>
            {filteredGroupChats.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Groups</Typography>
                {filteredGroupChats.map((group) => {
                  const { lastMessage, unreadCount } = getConversationData(group.group_id, true);
                  return (
                    <ConversationItem
                      key={group.group_id}
                      id={`group:${group.group_id}`}
                      name={group.name}
                      isGroup
                      lastMessage={lastMessage}
                      unreadCount={unreadCount}
                      selected={selectedConversationId === `group:${group.group_id}`}
                      onSelect={onSelectConversation}
                      onDelete={onDeleteGroupChat}
                    />
                  );
                })}
              </>
            )}
            {activeConversations.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Friends</Typography>
                {activeConversations.map((friend) => {
                  const { lastMessage, unreadCount } = getConversationData(friend.anonymous_id);
                  return (
                    <ConversationItem
                      key={friend.anonymous_id}
                      id={friend.anonymous_id}
                      name={friend.username || `User (${friend.anonymous_id})`}
                      isGroup={false}
                      lastMessage={lastMessage}
                      unreadCount={unreadCount}
                      selected={selectedConversationId === friend.anonymous_id}
                      onSelect={onSelectConversation}
                      onDelete={onDeleteConversation}
                    />
                  );
                })}
              </>
            )}
            {filteredGroupChats.length === 0 && activeConversations.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No active conversations match your search.
              </Typography>
            )}
          </List>
        </>
      )}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{ sx: { maxHeight: "50vh", overflowY: "auto" } }}
      >
        {availableFriends.length > 0 ? (
          availableFriends.map((friend) => (
            <MenuItem key={friend.anonymous_id} onClick={() => handleFriendSelect(friend.anonymous_id)}>
              {friend.username || `User (${friend.anonymous_id})`}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No friends available to chat</MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default ConversationsList;