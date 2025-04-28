import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText, Box, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Delete, PushPin, Archive, NotificationsOff, Unarchive, Notifications, DoneAll } from '@mui/icons-material';
import ConversationAvatar from './ConversationAvatar';
import ConversationActions from './ConversationActions';

const ConversationItem = ({
  item,
  selected,
  onSelect,
  onDelete,
  onPin,
  onUnpin,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onMarkRead,
  currentUserId,
  messages,
}) => {
  const [contextMenu, setContextMenu] = useState({ anchorEl: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, isGroup: false });

  const handleOpenMenu = useCallback((event) => {
    event.stopPropagation();
    setContextMenu({ anchorEl: event.currentTarget });
  }, []);

  const handleCloseMenu = useCallback(() => {
    setContextMenu({ anchorEl: null });
  }, []);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialog({ open: true, id: item.conversation_id, isGroup: item.isGroup });
    handleCloseMenu();
  }, [item.conversation_id, item.isGroup, handleCloseMenu]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await onDelete(item.conversation_id);
      setDeleteDialog({ open: false, id: null, isGroup: false });
    } catch (err) {
      console.error('Delete error:', err);
    }
  }, [item.conversation_id, onDelete]);

  const handleAction = useCallback(
    async (action, ...args) => {
      try {
        await action(...args);
      } catch (err) {
        console.error(`${action.name} error:`, err);
      }
      handleCloseMenu();
    },
    [handleCloseMenu]
  );

  // Helper function to determine last message preview
  const getMessagePreview = (lastMessage) => {
    if (!lastMessage) {
      return 'No messages yet';
    }

    // Check for text content
    if (lastMessage.content && lastMessage.content.trim()) {
      return lastMessage.content.length > 30
        ? `${lastMessage.content.slice(0, 30)}...`
        : lastMessage.content;
    }

    // Check for media or type
    if (lastMessage.media && lastMessage.media.length > 0) {
      const mediaType = lastMessage.media[0]?.type || 'media';
      switch (mediaType) {
        case 'image':
          return 'Image';
        case 'video':
          return 'Video';
        case 'audio':
          return 'Audio';
        default:
          return 'Media';
      }
    }

    // Check for message type (if provided)
    if (lastMessage.type) {
      switch (lastMessage.type) {
        case 'poll':
          return 'Poll';
        case 'reaction':
          return 'Reaction';
        case 'text':
          return 'Text message'; // Fallback for empty content
        default:
          return lastMessage.type.charAt(0).toUpperCase() + lastMessage.type.slice(1);
      }
    }

    // Fallback for unknown cases
    return 'Message';
  };

  return (
    <>
      <ListItem
        button
        onClick={() => onSelect(item)}
        selected={selected}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          bgcolor: selected ? 'action.selected' : 'inherit',
          '&:hover': { bgcolor: 'action.hover' },
          p: 1,
        }}
        aria-label={`${item.isGroup ? 'Group' : item.isFriend ? 'New friend' : 'Conversation'} with ${item.name}`}
      >
        <ConversationAvatar item={item} currentUserId={currentUserId} />
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: item.unreadCount > 0 || item.pinnedBy.includes(currentUserId) ? 'bold' : 'medium',
                  color: item.unreadCount > 0 ? 'primary.main' : 'text.primary',
                }}
              >
                {item.name}
              </Typography>
            </Box>
          }
          secondary={
            item.isFriend ? (
              <Typography variant="body2" color="text.secondary">
                Start a new chat
              </Typography>
            ) : (
              <Typography
                variant="body2"
                color={item.mutedBy.includes(currentUserId) ? 'text.disabled' : 'text.secondary'}
                noWrap
              >
                {getMessagePreview(item.lastMessage)}
              </Typography>
            )
          }
        />
        <ConversationActions
          item={item}
          onOpenMenu={handleOpenMenu}
          onMarkRead={() => handleAction(onMarkRead, item.conversation_id)}
          currentUserId={currentUserId}
          messages={messages}
        />
      </ListItem>
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={handleCloseMenu}
        aria-label="Conversation options"
      >
        {item.pinnedBy.includes(currentUserId) ? (
          <MenuItem onClick={() => handleAction(onUnpin, item.conversation_id)}>
            <PushPin sx={{ mr: 1 }} /> Unpin
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction(onPin, item.conversation_id)}>
            <PushPin sx={{ mr: 1 }} /> Pin
          </MenuItem>
        )}
        {item.isArchived ? (
          <MenuItem onClick={() => handleAction(onUnarchive, item.conversation_id)}>
            <Unarchive sx={{ mr: 1 }} /> Unarchive
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction(onArchive, item.conversation_id)}>
            <Archive sx={{ mr: 1 }} /> Archive
          </MenuItem>
        )}
        {item.mutedBy.includes(currentUserId) ? (
          <MenuItem onClick={() => handleAction(onUnmute, item.conversation_id)}>
            <Notifications sx={{ mr: 1 }} /> Unmute
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleAction(onMute, item.conversation_id)}>
            <NotificationsOff sx={{ mr: 1 }} /> Mute
          </MenuItem>
        )}
        {item.unreadCount > 0 && (
          <MenuItem onClick={() => handleAction(onMarkRead, item.conversation_id)}>
            <DoneAll sx={{ mr: 1 }} /> Mark as read
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
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
    </>
  );
};

ConversationItem.propTypes = {
  item: PropTypes.shape({
    conversation_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isGroup: PropTypes.bool,
    isFriend: PropTypes.bool,
    lastMessage: PropTypes.shape({
      message_id: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.string,
      sender_id: PropTypes.string,
      is_read: PropTypes.bool,
      type: PropTypes.string,
      media: PropTypes.arrayOf(
        PropTypes.shape({
          url: PropTypes.string,
          fileKey: PropTypes.string,
          type: PropTypes.string,
        })
      ),
    }),
    unreadCount: PropTypes.number,
    pinnedBy: PropTypes.arrayOf(PropTypes.string),
    mutedBy: PropTypes.arrayOf(PropTypes.string),
    isArchived: PropTypes.bool,
    participants: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPin: PropTypes.func.isRequired,
  onUnpin: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
  onUnarchive: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onUnmute: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      group_id: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string,
      type: PropTypes.string,
      media: PropTypes.arrayOf(PropTypes.shape({})),
    })
  ).isRequired,
};

export default React.memo(ConversationItem);