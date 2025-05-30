import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  Typography,
  IconButton,
  Avatar,
  Badge,
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { useNotification } from '../../../context/NotificationContext';
import ConversationFilter from './ConversationFilter';
import ConversationItem from './ConversationItem';

const ConversationsList = ({
  conversations,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversation,
  onDeleteConversation,
  messages,
  getOrCreateConversation,
  pinConv,
  unpinConv,
  archiveConv,
  unarchiveConv,
  muteConv,
  unmuteConv,
  markRead,
  socket,
  loadMoreConversations,
  hasMore,
  loading,
}) => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Clear notifications
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Debounced search handler
  const debouncedSearch = useMemo(() => debounce((query) => setSearchQuery(query), 300), []);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Real-time conversation updates
  useEffect(() => {
    if (!socket) return;

    const handleConversationDeleted = ({ conversationId }) => {
      if (!conversationId) return;
      if (selectedConversation?.conversation_id === conversationId) {
        onSelectConversation(null);
      }
      showNotification('Conversation deleted', 'info');
    };

    socket.on('conversationDeleted', handleConversationDeleted);
    return () => {
      socket.off('conversationDeleted', handleConversationDeleted);
    };
  }, [socket, selectedConversation, onSelectConversation, showNotification]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
        loadMoreConversations();
      }
    },
    [hasMore, loading, loadMoreConversations]
  );

  // Process conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.map((conv) => {
      const isGroup = conv.type === 'group';
      const friend = !isGroup
        ? friends.find(
            (f) => conv.participants?.includes(f.anonymous_id) && f.anonymous_id !== currentUserId
          )
        : null;
      const unreadCount = messages.filter(
        (m) =>
          m?.conversation_id === conv.conversation_id &&
          !m.is_read &&
          m.sender_id !== currentUserId
      ).length;
      const lastMessage = messages.find((m) => m.message_id === conv.lastMessage?.message_id) || conv.lastMessage;

      return {
        conversation_id: conv.conversation_id,
        name: conv.name || friend?.username || 'Unknown',
        isGroup,
        lastMessage,
        lastMessagePreview:
          lastMessage?.content?.slice(0, 50) || (lastMessage?.media?.length ? 'Media message' : ''),
        created_at: conv.created_at || new Date().toISOString(),
        pinnedBy: conv.pinnedBy || [],
        mutedBy: conv.mutedBy || [],
        isArchived: conv.isArchived || false,
        participants: conv.participants || [],
        unreadCount,
        avatar: isGroup ? null : friend?.avatar || null, // Assume friend has avatar prop
      };
    });

    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter((item) => !item.isArchived);
    } else if (filter === 'archived') {
      filtered = filtered.filter((item) => item.isArchived);
    }

    // Apply search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.lastMessagePreview?.toLowerCase().includes(lowerQuery) ||
          item.participants?.some((id) => {
            const friend = friends.find((f) => f.anonymous_id === id);
            return friend?.username.toLowerCase().includes(lowerQuery);
          })
      );

      // Include friends for new chats
      const filteredFriends = friends
        .filter(
          (f) =>
            f.anonymous_id !== currentUserId &&
            f.username.toLowerCase().includes(lowerQuery) &&
            !filtered.some((c) => !c.isGroup && c.participants?.includes(f.anonymous_id))
        )
        .map((f) => ({
          conversation_id: `friend:${f.anonymous_id}`,
          name: f.username,
          isFriend: true,
          created_at: new Date().toISOString(),
          pinnedBy: [],
          mutedBy: [],
          isArchived: false,
          unreadCount: 0,
          avatar: f.avatar || null,
        }));

      filtered = [...filtered, ...filteredFriends];
    }

    // Sort conversations
    return filtered.sort((a, b) => {
      const aPinned = a.pinnedBy.includes(currentUserId);
      const bPinned = b.pinnedBy.includes(currentUserId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const aHasUnread = a.unreadCount > 0;
      const bHasUnread = b.unreadCount > 0;
      if (aHasUnread && !bHasUnread) return -1;
      if (!aHasUnread && bHasUnread) return 1;
      const aTime = a.lastMessage
        ? new Date(a.lastMessage.timestamp)
        : new Date(a.created_at || 0);
      const bTime = b.lastMessage
        ? new Date(b.lastMessage.timestamp)
        : new Date(b.created_at || 0);
      return bTime - aTime;
    });
  }, [conversations, friends, messages, currentUserId, filter, searchQuery]);

  const handleSelectConversation = useCallback(
    async (item) => {
      if (item.isFriend) {
        setIsCreating(true);
        try {
          const conv = await getOrCreateConversation(item.conversation_id.replace('friend:', ''));
          onSelectConversation({ ...conv, isGroup: false });
          setSuccess(`Chat with ${item.name} started!`);
        } catch (err) {
          const errorMsg = err.message || 'Failed to start chat';
          setError(errorMsg);
          showNotification(errorMsg, 'error');
        } finally {
          setIsCreating(false);
        }
      } else {
        onSelectConversation(item);
      }
    },
    [onSelectConversation, getOrCreateConversation, showNotification]
  );

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.grey[200]}`,
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        bgcolor: theme.palette.background.paper,
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        boxShadow: theme.shadows[1],
      }}
      onScroll={handleScroll}
      aria-label="Conversations list"
    >
      {(success || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Alert
            severity={success ? 'success' : 'error'}
            onClose={() => {
              setSuccess('');
              setError('');
            }}
            sx={{ mb: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}
          >
            {success || error}
          </Alert>
        </motion.div>
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search chats or friends..."
          onChange={(e) => debouncedSearch(e.target.value)}
          defaultValue={searchQuery}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery && (
                  <IconButton onClick={() => debouncedSearch('')} aria-label="Clear search">
                    <Clear fontSize="small" />
                  </IconButton>
                )}
                <Search fontSize="small" aria-hidden="true" />
              </InputAdornment>
            ),
            sx: { borderRadius: 8, bgcolor: theme.palette.grey[50], height: 40 },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
          aria-label="Search conversations or friends"
        />
        <ConversationFilter
          filter={filter}
          onChangeFilter={setFilter}
          sx={{
            bgcolor: theme.palette.grey[50],
            borderRadius: 8,
            minWidth: 80,
            '& .MuiSelect-select': { py: 1 },
          }}
        />
      </Box>
      {isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}
        >
          <CircularProgress size={24} aria-label="Creating chat" />
        </motion.div>
      )}
      {filteredConversations.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}
          aria-label="No conversations found"
        >
          {searchQuery ? 'No chats or friends found' : 'Start a new conversation!'}
        </Typography>
      ) : (
        <List sx={{ p: 0, mt: 1 }}>
          <AnimatePresence>
            {filteredConversations.map((item) => (
              <motion.div
                key={item.conversation_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ConversationItem
                  item={item}
                  selected={selectedConversation?.conversation_id === item.conversation_id}
                  onSelect={handleSelectConversation}
                  onDelete={onDeleteConversation}
                  onPin={pinConv}
                  onUnpin={unpinConv}
                  onArchive={archiveConv}
                  onUnarchive={unarchiveConv}
                  onMute={muteConv}
                  onUnmute={unmuteConv}
                  onMarkRead={markRead}
                  currentUserId={currentUserId}
                  messages={messages}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor:
                      selectedConversation?.conversation_id === item.conversation_id
                        ? theme.palette.action.selected
                        : 'transparent',
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    transition: 'background-color 0.2s',
                  }}
                  avatar={
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        item.unreadCount > 0 && (
                          <Box
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {item.unreadCount}
                          </Box>
                        )
                      }
                    >
                      <Avatar
                        src={item.avatar}
                        sx={{ width: 40, height: 40, bgcolor: theme.palette.grey[300] }}
                      >
                        {!item.avatar && getInitials(item.name)}
                      </Avatar>
                    </Badge>
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      )}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
        >
          <CircularProgress size={24} aria-label="Loading more conversations" />
        </motion.div>
      )}
    </Box>
  );
};

ConversationsList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      conversation_id: PropTypes.string.isRequired,
      name: PropTypes.string,
      participants: PropTypes.arrayOf(PropTypes.string),
      created_at: PropTypes.string,
      pinnedBy: PropTypes.arrayOf(PropTypes.string),
      mutedBy: PropTypes.arrayOf(PropTypes.string),
      isArchived: PropTypes.bool,
      type: PropTypes.string,
      lastMessage: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          message_id: PropTypes.string,
          content: PropTypes.string,
          timestamp: PropTypes.string,
          sender_id: PropTypes.string,
          is_read: PropTypes.bool,
          type: PropTypes.string,
          media: PropTypes.array,
        }),
      ]),
    })
  ).isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
      avatar: PropTypes.string,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversation: PropTypes.object,
  onDeleteConversation: PropTypes.func.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string,
      type: PropTypes.string,
      media: PropTypes.array,
    })
  ).isRequired,
  getOrCreateConversation: PropTypes.func.isRequired,
  pinConv: PropTypes.func.isRequired,
  unpinConv: PropTypes.func.isRequired,
  archiveConv: PropTypes.func.isRequired,
  unarchiveConv: PropTypes.func.isRequired,
  muteConv: PropTypes.func.isRequired,
  unmuteConv: PropTypes.func.isRequired,
  markRead: PropTypes.func.isRequired,
  socket: PropTypes.object,
  loadMoreConversations: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default React.memo(ConversationsList);