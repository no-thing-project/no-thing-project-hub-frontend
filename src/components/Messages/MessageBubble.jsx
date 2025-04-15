import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
} from '@mui/material';
import { MoreVert, Reply, Edit, Delete, Forward } from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';

/**
 * Formats timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date/time
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy h:mm a');
};

/**
 * MessageBubble component for rendering individual messages
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const MessageBubble = ({
  message,
  isSentByCurrentUser,
  onDelete,
  onEdit,
  onSendMediaMessage,
  currentUserId,
  recipient,
  messages,
  setReplyToMessage,
  onForward,
  isGroupChat,
  friends,
  token,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  // Get sender info for group chats
  const sender = isGroupChat
    ? friends.find((f) => f.anonymous_id === message.sender_id) || {
        username: 'Unknown',
      }
    : null;
  const senderName = isGroupChat ? sender.username : recipient?.username || 'User';

  // Handle menu actions
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleReply = useCallback(() => {
    setReplyToMessage(message);
    handleMenuClose();
  }, [message, setReplyToMessage]);

  const handleEdit = useCallback(() => {
    onEdit(message.message_id, prompt('Edit message:', message.content));
    handleMenuClose();
  }, [message, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(message.message_id);
    handleMenuClose();
  }, [message, onDelete]);

  const handleForward = useCallback(() => {
    onForward(message);
    handleMenuClose();
  }, [message, onForward]);

  // Cleanup for media elements
  useEffect(() => {
    return () => {
      setMediaError(null);
    };
  }, [message.message_id]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isSentByCurrentUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        mb: 2,
        px: { xs: 1, md: 2 },
      }}
      aria-label={`Message from ${isSentByCurrentUser ? 'you' : senderName}`}
    >
      {isGroupChat && !isSentByCurrentUser && (
        <Avatar
          src={sender?.profile_image}
          alt={`${senderName}'s avatar`}
          sx={{ width: 32, height: 32, mr: 1, mt: 1 }}
        >
          {senderName.charAt(0).toUpperCase()}
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: '70%',
          bgcolor: isSentByCurrentUser ? 'primary.light' : 'grey.200',
          borderRadius: 2,
          p: 1,
          position: 'relative',
        }}
      >
        {isGroupChat && !isSentByCurrentUser && (
          <Typography variant="caption" sx={{ fontWeight: 'medium', mb: 0.5 }}>
            {senderName}
          </Typography>
        )}
        {message.replyTo && (
          <Box
            sx={{
              bgcolor: 'grey.300',
              p: 1,
              borderRadius: 1,
              mb: 1,
              fontStyle: 'italic',
            }}
            aria-label="Replied message"
          >
            <Typography variant="caption">
              {messages.find((m) => m.message_id === message.replyTo)?.content ||
                'Original message'}
            </Typography>
          </Box>
        )}
        {message.content && (
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        )}
        {message.media?.map((media, index) => (
          <Box key={index} sx={{ mt: 1 }}>
            {media.type.startsWith('image') ? (
              <img
                src={media.url}
                alt={`Media ${index + 1}`}
                style={{
                  maxWidth: '100%',
                  borderRadius: '8px',
                  display: 'block',
                }}
                onError={() => setMediaError(`Failed to load image ${index + 1}`)}
                loading="lazy"
              />
            ) : media.type.startsWith('video') ? (
              <video
                src={media.url}
                controls
                style={{ maxWidth: '100%', borderRadius: '8px' }}
                onError={() => setMediaError(`Failed to load video ${index + 1}`)}
              />
            ) : (
              <Chip label="Unsupported media" size="small" />
            )}
          </Box>
        ))}
        {mediaError && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: 'block' }}
          >
            {mediaError}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
        >
          {formatTimestamp(message.timestamp)}
          {isSentByCurrentUser && (message.is_read ? ' · Seen' : ' · Sent')}
        </Typography>
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          sx={{
            position: 'absolute',
            top: 4,
            right: isSentByCurrentUser ? 4 : undefined,
            left: !isSentByCurrentUser ? 4 : undefined,
          }}
          aria-label="Message options"
        >
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          aria-label="Message actions menu"
        >
          <MenuItem onClick={handleReply} aria-label="Reply to message">
            <Reply fontSize="small" sx={{ mr: 1 }} /> Reply
          </MenuItem>
          {isSentByCurrentUser && message.content && (
            <MenuItem onClick={handleEdit} aria-label="Edit message">
              <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
            </MenuItem>
          )}
          {isSentByCurrentUser && (
            <MenuItem onClick={handleDelete} aria-label="Delete message">
              <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
            </MenuItem>
          )}
          <MenuItem onClick={handleForward} aria-label="Forward message">
            <Forward fontSize="small" sx={{ mr: 1 }} /> Forward
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    conversation_id: PropTypes.string,
    group_id: PropTypes.string,
    content: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    is_read: PropTypes.bool,
    sender_id: PropTypes.string.isRequired,
    receiver_id: PropTypes.string,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ),
    replyTo: PropTypes.string,
  }).isRequired,
  isSentByCurrentUser: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
    profile_image: PropTypes.string,
  }).isRequired,
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
      profile_image: PropTypes.string,
    })
  ).isRequired,
  token: PropTypes.string.isRequired,
};

export default React.memo(MessageBubble);