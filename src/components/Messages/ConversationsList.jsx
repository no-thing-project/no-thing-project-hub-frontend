import React, { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  List,
  TextField,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { motion } from "framer-motion";
import ConversationItem from "./ConversationItem";

const CONTAINER_STYLES = {
  mt: 2,
  maxHeight: { xs: "50vh", md: "70vh" },
  overflowY: "auto",
};
const HEADER_STYLES = { mb: 2, fontWeight: 600 };
const LOADING_STYLES = { display: "flex", justifyContent: "center", my: 2 };
const NO_CONTENT_STYLES = { textAlign: "center", py: 4 };
const SEARCH_CONTAINER_STYLES = {
  display: "flex",
  justifyContent: "space-between",
  mb: 2,
};
const SEARCH_FIELD_STYLES = { mr: 2 };
const SUBTITLE_STYLES = { mt: 2 };
const NO_RESULTS_STYLES = {
  variant: "body2",
  color: "text.secondary",
  sx: { mt: 2 },
};
const MENU_STYLES = {
  PaperProps: {
    sx: { maxHeight: "50vh", overflowY: "auto" },
  },
};

const ConversationsList = ({
  messages,
  groupChats,
  conversations,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  onDeleteGroupChat,
  onDeleteConversation,
  isLoading,
  createNewConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const getConversationData = useCallback(
    (id, isGroup) => {
      // Перевіряємо, чи messages є масивом; якщо ні — повертаємо порожні значення
      const convMessages = Array.isArray(messages)
        ? messages.filter((msg) =>
            isGroup ? msg.group_id === id : msg.conversation_id === id
          )
        : [];
      const lastMessage = convMessages.length
        ? convMessages.reduce((latest, msg) =>
            new Date(msg.timestamp) > new Date(latest.timestamp) ? msg : latest
          )
        : null;
      const unreadCount = convMessages.filter(
        (m) => m.receiver_id === currentUserId && !m.is_read
      ).length;
      return { lastMessage, unreadCount };
    },
    [messages, currentUserId]
  );

  const filteredGroupChats = useMemo(
    () =>
      Array.isArray(groupChats)
        ? groupChats.filter(
            (g) =>
              g.members?.includes(currentUserId) &&
              g.name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [],
    [groupChats, currentUserId, searchQuery]
  );

  const filteredConversations = useMemo(() => {
    return Array.isArray(conversations)
      ? conversations.filter((c) => {
          const friendId = c.user1 === currentUserId ? c.user2 : c.user1;
          const friendName =
            friends.find((f) => f.anonymous_id === friendId)?.username || "";
          return friendName.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : [];
  }, [conversations, currentUserId, friends, searchQuery]);

  const activeConversations = useMemo(() => {
    return filteredConversations.map((conv) => {
      const friendId = conv.user1 === currentUserId ? conv.user2 : conv.user1;
      return {
        anonymous_id: friendId,
        conversation_id: conv.conversation_id,
        username:
          friends.find((f) => f.anonymous_id === friendId)?.username ||
          `User (${friendId})`,
      };
    });
  }, [filteredConversations, friends, currentUserId]);

  const availableFriends = useMemo(() => {
    return Array.isArray(friends)
      ? friends
          .filter((f) =>
            (f.username || f.anonymous_id)
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
          .filter(
            (friend) =>
              !activeConversations.some(
                (active) => active.anonymous_id === friend.anonymous_id
              )
          )
      : [];
  }, [friends, activeConversations, searchQuery]);

  const hasConversations =
    filteredGroupChats.length > 0 || activeConversations.length > 0;
  const hasFriends = friends.length > 0;

  const handleNewChatClick = useCallback(
    (event) => setAnchorEl(event.currentTarget),
    []
  );

  const handleFriendSelect = useCallback(
    async (friendId) => {
      try {
        const existingConversation = conversations.find(
          (c) =>
            (c.user1 === currentUserId && c.user2 === friendId) ||
            (c.user1 === friendId && c.user2 === currentUserId)
        );
        if (!existingConversation) {
          const newConversation = await createNewConversation(friendId);
          if (newConversation)
            onSelectConversation(newConversation.conversation_id);
        } else {
          onSelectConversation(existingConversation.conversation_id);
        }
      } catch (err) {
        // Обробка помилки, якщо потрібно
      } finally {
        setAnchorEl(null);
      }
    },
    [conversations, currentUserId, createNewConversation, onSelectConversation]
  );

  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  return (
    <Box sx={CONTAINER_STYLES}>
      <Typography variant="h6" sx={HEADER_STYLES}>
        Conversations
      </Typography>

      {isLoading ? (
        <Box sx={LOADING_STYLES}>
          <CircularProgress size={24} />
        </Box>
      ) : !hasFriends ? (
        <Box sx={NO_CONTENT_STYLES}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Add friends to start chatting!
          </Typography>
        </Box>
      ) : !hasConversations ? (
        <Box sx={NO_CONTENT_STYLES}>
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
          <Box sx={SEARCH_CONTAINER_STYLES}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={SEARCH_FIELD_STYLES}
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

          <List
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredGroupChats.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={SUBTITLE_STYLES}>
                  Groups
                </Typography>
                {filteredGroupChats.map((group) => {
                  const { lastMessage, unreadCount } = getConversationData(
                    group.group_id,
                    true
                  );
                  return (
                    <ConversationItem
                      key={group.group_id}
                      id={group.group_id}
                      name={group.name || "Unnamed Group"}
                      isGroup
                      lastMessage={lastMessage}
                      unreadCount={unreadCount}
                      selected={
                        selectedConversationId === `group:${group.group_id}`
                      }
                      onSelect={() =>
                        onSelectConversation(`group:${group.group_id}`)
                      }
                      onDelete={onDeleteGroupChat}
                    />
                  );
                })}
              </>
            )}

            {activeConversations.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={SUBTITLE_STYLES}>
                  Friends
                </Typography>
                {activeConversations.map((friend) => {
                  const { lastMessage, unreadCount } = getConversationData(
                    friend.conversation_id,
                    false
                  );
                  return (
                    <ConversationItem
                      key={friend.conversation_id}
                      id={friend.conversation_id}
                      name={friend.username}
                      isGroup={false}
                      lastMessage={lastMessage}
                      unreadCount={unreadCount}
                      selected={selectedConversationId === friend.conversation_id}
                      onSelect={() =>
                        onSelectConversation(friend.conversation_id)
                      }
                      onDelete={onDeleteConversation}
                    />
                  );
                })}
              </>
            )}

            {filteredGroupChats.length === 0 &&
              activeConversations.length === 0 && (
                <Typography {...NO_RESULTS_STYLES}>
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
        {...MENU_STYLES}
      >
        {availableFriends.length > 0 ? (
          availableFriends.map((friend) => (
            <MenuItem
              key={friend.anonymous_id}
              onClick={() => handleFriendSelect(friend.anonymous_id)}
            >
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

ConversationsList.propTypes = {
  messages: PropTypes.array,
  groupChats: PropTypes.array,
  conversations: PropTypes.array,
  friends: PropTypes.array,
  currentUserId: PropTypes.string.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversationId: PropTypes.string,
  onDeleteGroupChat: PropTypes.func.isRequired,
  onDeleteConversation: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  createNewConversation: PropTypes.func.isRequired,
};

ConversationsList.defaultProps = {
  messages: [],
  groupChats: [],
  conversations: [],
  friends: [],
  isLoading: false,
};

export default ConversationsList;