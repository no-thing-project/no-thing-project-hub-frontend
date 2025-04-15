import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { Delete, Group, Person, Search, MoreVert, PushPin, Archive, NotificationsOff, Unarchive, Notifications } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ConversationsList component for displaying and managing conversations
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const ConversationsList = ({
  conversations,
  groupChats,
  friends,
  currentUserId,
  onSelectConversation,
  selectedConversation,
  onDeleteConversation,
  onDeleteGroupChat,
  messages,
  getOrCreateConversation,
  pinConv,
  unpinConv,
  archiveConv,
  unarchiveConv,
  muteConv,
  unmuteConv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, isGroup: false });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState({ anchorEl: null, item: null });

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

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery((prev) => prev); // Trigger memoization
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Combine conversations and groups
  const combinedConversations = useMemo(() => {
    const convs = conversations.map((conv) => ({
      conversation_id: conv.conversation_id,
      name: conv.name || friends.find((f) => conv.participants?.includes(f.anonymous_id) && f.anonymous_id !== currentUserId)?.username || 'Unknown',
      isGroup: false,
      lastMessage: messages.find((m) => m.conversation_id === conv.conversation_id) || null,
      created_at: conv.created_at,
      pinnedBy: conv.pinnedBy || [],
      mutedBy: conv.mutedBy || [],
      isArchived: conv.isArchived || false,
      participants: conv.participants,
    }));

    const groups = groupChats.map((group) => ({
      conversation_id: `group:${group.group_id}`,
      group_id: group.group_id,
      name: group.name,
      isGroup: true,
      lastMessage: messages.find((m) => m.group_id === group.group_id) || null,
      created_at: group.created_at,
      pinnedBy: group.pinnedBy || [],
      mutedBy: group.mutedBy || [],
      isArchived: group.isArchived || false,
      participants: group.members,
    }));

    return [...convs, ...groups].sort((a, b) => {
      // Prioritize pinned chats
      const aPinned = a.pinnedBy.includes(currentUserId);
      const bPinned = b.pinnedBy.includes(currentUserId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Sort by last message or creation date
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.created_at || 0);
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.created_at || 0);
      return bTime - aTime;
    });
  }, [conversations, groupChats, friends, messages, currentUserId]);

  // Filter conversations and friends for search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return combinedConversations;

    const lowerQuery = searchQuery.toLowerCase();
    const filteredConvs = combinedConversations.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.participants?.some((id) => {
          const friend = friends.find((f) => f.anonymous_id === id);
          return friend?.username.toLowerCase().includes(lowerQuery);
        })
    );

    // Add friends for new chats
    const filteredFriends = friends
      .filter(
        (f) =>
          f.anonymous_id !== currentUserId &&
          f.username.toLowerCase().includes(lowerQuery) &&
          !combinedConversations.some((c) => !c.isGroup && c.participants?.includes(f.anonymous_id))
      )
      .map((f) => ({
        conversation_id: `friend:${f.anonymous_id}`,
        name: f.username,
        isFriend: true,
        created_at: new Date().toISOString(),
        pinnedBy: [],
        mutedBy: [],
        isArchived: false,
      }));

    return [...filteredConvs, ...filteredFriends];
  }, [searchQuery, combinedConversations, friends, currentUserId]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    async (item) => {
      console.log('Selecting conversation:', item); // Debug log
      if (item.isFriend) {
        setIsCreating(true);
        try {
          const conv = await getOrCreateConversation(item.conversation_id.replace('friend:', ''));
          onSelectConversation({ ...conv, isGroup: false });
          setSuccess(`Chat with ${item.name} started!`);
        } catch (err) {
          setError('Failed to start chat');
          console.error('Create conversation error:', err);
        } finally {
          setIsCreating(false);
        }
      } else {
        onSelectConversation(item);
      }
    },
    [onSelectConversation, getOrCreateConversation]
  );

  // Context menu handlers
  const handleOpenMenu = useCallback((event, item) => {
    event.stopPropagation();
    setContextMenu({ anchorEl: event.currentTarget, item });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setContextMenu({ anchorEl: null, item: null });
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback((id, isGroup) => {
    setDeleteDialog({ open: true, id, isGroup });
    handleCloseMenu();
  }, [handleCloseMenu]);

  const handleDeleteConfirm = useCallback(async () => {
    const { id, isGroup } = deleteDialog;
    try {
      if (isGroup) {
        await onDeleteGroupChat(id.replace('group:', ''));
        setSuccess('Group chat deleted!');
      } else {
        await onDeleteConversation(id);
        setSuccess('Conversation deleted!');
      }
      if (selectedConversation?.conversation_id === id) {
        onSelectConversation(null);
      }
    } catch (err) {
      setError('Failed to delete');
      console.error('Delete error:', err);
    } finally {
      setDeleteDialog({ open: false, id: null, isGroup: false });
    }
  }, [deleteDialog, onDeleteGroupChat, onDeleteConversation, selectedConversation, onSelectConversation]);

  // Action handlers
  const handlePin = useCallback(async (id) => {
    try {
      await pinConv(id);
      setSuccess('Conversation pinned!');
    } catch (err) {
      setError('Failed to pin conversation');
      console.error('Pin error:', err);
    }
    handleCloseMenu();
  }, [pinConv, handleCloseMenu]);

  const handleUnpin = useCallback(async (id) => {
    try {
      await unpinConv(id);
      setSuccess('Conversation unpinned!');
    } catch (err) {
      setError('Failed to unpin conversation');
      console.error('Unpin error:', err);
    }
    handleCloseMenu();
  }, [unpinConv, handleCloseMenu]);

  const handleArchive = useCallback(async (id) => {
    try {
      await archiveConv(id);
      setSuccess('Conversation archived!');
      if (selectedConversation?.conversation_id === id) {
        onSelectConversation(null);
      }
    } catch (err) {
      setError('Failed to archive conversation');
      console.error('Archive error:', err);
    }
    handleCloseMenu();
  }, [archiveConv, handleCloseMenu, selectedConversation, onSelectConversation]);

  const handleUnarchive = useCallback(async (id) => {
    try {
      await unarchiveConv(id);
      setSuccess('Conversation unarchived!');
    } catch (err) {
      setError('Failed to unarchive conversation');
      console.error('Unarchive error:', err);
    }
    handleCloseMenu();
  }, [unarchiveConv, handleCloseMenu]);

  const handleMute = useCallback(async (id) => {
    try {
      await muteConv(id);
      setSuccess('Conversation muted!');
    } catch (err) {
      setError('Failed to mute conversation');
      console.error('Mute error:', err);
    }
    handleCloseMenu();
  }, [muteConv, handleCloseMenu]);

  const handleUnmute = useCallback(async (id) => {
    try {
      await unmuteConv(id);
      setSuccess('Conversation unmuted!');
    } catch (err) {
      setError('Failed to unarchive conversation');
      console.error('Unmute error:', err);
    }
    handleCloseMenu();
  }, [unmuteConv, handleCloseMenu]);

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        height: { xs: 'auto', md: 'calc(100vh - 180px)' },
        overflowY: 'auto',
      }}
      aria-label="Conversations list"
    >
      {(success || error) && (
        <Alert
          severity={success ? 'success' : 'error'}
          onClose={() => {
            setSuccess('');
            setError('');
          }}
          sx={{ mb: 2 }}
        >
          {success || error}
        </Alert>
      )}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search chats or friends..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          endAdornment: <Search aria-hidden="true" />,
        }}
        sx={{ mb: 2 }}
        aria-label="Search conversations or friends"
      />
      {isCreating && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} aria-label="Creating chat" />
        </Box>
      )}
      {filteredItems.length === 0 ? (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 2 }}
          aria-label="No conversations found"
        >
          {searchQuery ? 'No chats or friends found' : 'No conversations yet'}
        </Typography>
      ) : (
        <List>
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.conversation_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ListItem
                  button
                  onClick={() => handleSelectConversation(item)}
                  selected={selectedConversation?.conversation_id === item.conversation_id}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: selectedConversation?.conversation_id === item.conversation_id ? 'action.selected' : 'inherit',
                    cursor: 'pointer',
                  }}
                  aria-label={`${item.isGroup ? 'Group' : item.isFriend ? 'New friend' : 'Conversation'} with ${item.name}`}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        item.isArchived ? <Archive fontSize="small" color="action" /> :
                        item.mutedBy.includes(currentUserId) ? <NotificationsOff fontSize="small" color="action" /> :
                        item.pinnedBy.includes(currentUserId) ? <PushPin fontSize="small" color="primary" /> : null
                      }
                    >
                      <Avatar>
                        {item.isGroup ? <Group /> : item.isFriend ? <Person /> : <Person />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      item.isFriend
                        ? 'Start a new chat'
                        : item.lastMessage
                        ? item.lastMessage.content.length > 30
                          ? `${item.lastMessage.content.slice(0, 30)}...`
                          : item.lastMessage.content
                        : 'No messages yet'
                    }
                    primaryTypographyProps={{
                      fontWeight: item.pinnedBy.includes(currentUserId) ? 'bold' : 'medium',
                    }}
                  />
                  {!item.isFriend && (
                    <IconButton
                      edge="end"
                      onClick={(e) => handleOpenMenu(e, item)}
                      aria-label={`More options for ${item.name}`}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      )}
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={handleCloseMenu}
        aria-label="Conversation options"
      >
        {contextMenu.item?.pinnedBy.includes(currentUserId) ? (
          <MenuItem onClick={() => handleUnpin(contextMenu.item.conversation_id)}>
            <PushPin sx={{ mr: 1 }} /> Unpin
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handlePin(contextMenu.item.conversation_id)}>
            <PushPin sx={{ mr: 1 }} /> Pin
          </MenuItem>
        )}
        {contextMenu.item?.isArchived ? (
          <MenuItem onClick={() => handleUnarchive(contextMenu.item.conversation_id)}>
            <Unarchive sx={{ mr: 1 }} /> Unarchive
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleArchive(contextMenu.item.conversation_id)}>
            <Archive sx={{ mr: 1 }} /> Archive
          </MenuItem>
        )}
        {contextMenu.item?.mutedBy.includes(currentUserId) ? (
          <MenuItem onClick={() => handleUnmute(contextMenu.item.conversation_id)}>
            <Notifications sx={{ mr: 1 }} /> Unmute
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleMute(contextMenu.item.conversation_id)}>
            <NotificationsOff sx={{ mr: 1 }} /> Mute
          </MenuItem>
        )}
        <MenuItem
          onClick={() => handleDeleteClick(contextMenu.item.conversation_id, contextMenu.item.isGroup)}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, isGroup: false })}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete {deleteDialog.isGroup ? 'Group Chat' : 'Conversation'}?
        </DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. Are you sure you want to delete this{' '}
            {deleteDialog.isGroup ? 'group chat' : 'conversation'}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null, isGroup: false })}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            aria-label="Confirm deletion"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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
    })
  ).isRequired,
  groupChats: PropTypes.arrayOf(
    PropTypes.shape({
      group_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      members: PropTypes.arrayOf(PropTypes.string).isRequired,
      created_at: PropTypes.string,
      pinnedBy: PropTypes.arrayOf(PropTypes.string),
      mutedBy: PropTypes.arrayOf(PropTypes.string),
      isArchived: PropTypes.bool,
    })
  ).isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  selectedConversation: PropTypes.object,
  onDeleteConversation: PropTypes.func.isRequired,
  onDeleteGroupChat: PropTypes.func.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      group_id: PropTypes.string,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
    })
  ).isRequired,
  getOrCreateConversation: PropTypes.func.isRequired,
  pinConv: PropTypes.func.isRequired,
  unpinConv: PropTypes.func.isRequired,
  archiveConv: PropTypes.func.isRequired,
  unarchiveConv: PropTypes.func.isRequired,
  muteConv: PropTypes.func.isRequired,
  unmuteConv: PropTypes.func.isRequired,
};

export default React.memo(ConversationsList);