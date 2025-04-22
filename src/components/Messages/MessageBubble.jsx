import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  Tooltip,
  Button,
} from '@mui/material';
import { MoreVert, Reply, Edit, Delete, Forward, Done, DoneAll, EmojiEmotions, InsertDriveFile } from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { MESSAGE_CONSTANTS } from '../../constants/constants';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy h:mm a');
};

const getFontStyles = (fontSize, fontStyle) => {
  const sizeMap = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.125rem',
  };
  return {
    fontSize: sizeMap[fontSize] || sizeMap.medium,
    fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
    fontWeight: fontStyle === 'bold' ? 'bold' : 'normal',
  };
};

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
  onContextMenu,
  isGroupChat,
  friends,
  token,
  onAddReaction,
  onPinMessage,
  onUnpinMessage,
  chatSettings,
  onVotePoll,
  isHighlighted,
  setHighlightedMessage,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const messageRef = useRef(null);

  const sender = isGroupChat
    ? friends.find((f) => f.anonymous_id === message.sender_id) || { username: 'Unknown' }
    : null;
  const senderName = isGroupChat ? sender.username : recipient?.username || 'User';

  // Memoize reaction counts
  const reactionCounts = useMemo(() => {
    return message.reactions?.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});
  }, [message.reactions]);

  // Memoize total poll votes
  const totalPollVotes = useMemo(() => {
    return message.poll?.options.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
  }, [message.poll]);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleEmojiOpen = (event) => {
    event.stopPropagation();
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => setEmojiAnchorEl(null);

  const handleReply = useCallback(() => {
    setReplyToMessage({ ...message, selectedText: null });
    handleMenuClose();
  }, [message, setReplyToMessage]);

  const handleEdit = useCallback(() => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      onEdit(message.message_id, newContent);
    }
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

  const handleReaction = useCallback(
    (emojiObject) => {
      const emoji = emojiObject.emoji;
      const existingReaction = message.reactions?.find(
        (r) => r.emoji === emoji && r.user_id === currentUserId
      );
      onAddReaction(message.message_id, emoji, !!existingReaction);
      handleEmojiClose();
    },
    [message, currentUserId, onAddReaction]
  );

  const handlePin = useCallback(() => {
    onPinMessage(message.message_id);
    handleMenuClose();
  }, [message.message_id, onPinMessage]);

  const handleUnpin = useCallback(() => {
    onUnpinMessage(message.message_id);
    handleMenuClose();
  }, [message.message_id, onUnpinMessage]);

  // Cleanup media error
  useEffect(() => {
    return () => setMediaError(null);
  }, [message.message_id]);

  // Attach context menu listener
  useEffect(() => {
    const ref = messageRef.current;
    if (ref) {
      const handleContext = (e) => onContextMenu(e, message);
      ref.addEventListener('contextmenu', handleContext);
      return () => ref.removeEventListener('contextmenu', handleContext);
    }
  }, [onContextMenu, message]);

  const renderDeliveryStatus = () => {
    if (!isSentByCurrentUser) return null;
    if (message.is_read) {
      return <DoneAll sx={{ fontSize: 14, color: theme.palette.primary.main }} />;
    }
    if (message.delivery_status === 'delivered') {
      return <Done sx={{ fontSize: 14, color: theme.palette.grey[600] }} />;
    }
    return <Done sx={{ fontSize: 14, color: theme.palette.grey[400] }} />;
  };

  const getVideoStyle = () => {
    switch (chatSettings?.videoShape) {
      case 'circle':
        return { borderRadius: '50%', overflow: 'hidden' };
      case 'square':
        return { borderRadius: '8px' };
      case 'rectangle':
      default:
        return { borderRadius: '8px', aspectRatio: '16/9' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        backgroundColor: isHighlighted ? theme.palette.action.selected : 'transparent',
        transition: 'background-color 0.5s',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isSentByCurrentUser ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          mb: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 2 },
          maxWidth: '100%',
        }}
        aria-label={`Message from ${isSentByCurrentUser ? 'you' : senderName}`}
      >
        {isGroupChat && !isSentByCurrentUser && (
          <Avatar
            src={sender?.profile_image}
            alt={`${senderName}'s avatar`}
            sx={{ width: 32, height: 32, mr: 1, mt: 2 }}
            imgProps={{ loading: 'lazy' }}
          />
        )}
        <Box
          sx={{
            maxWidth: { xs: '85%', sm: '70%' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start',
          }}
          ref={messageRef}
        >
          {isGroupChat && !isSentByCurrentUser && (
            <Typography
              variant="caption"
              sx={{ mb: 0.5, color: theme.palette.text.secondary }}
            >
              {senderName}
            </Typography>
          )}
          {message.replyTo && (
            <Box
              sx={{
                bgcolor: theme.palette.grey[100],
                p: 1,
                borderRadius: 1,
                mb: 1,
                maxWidth: '100%',
                cursor: 'pointer',
              }}
              onClick={() => {
                const repliedMessage = messages.find((m) => m.message_id === message.replyTo);
                if (repliedMessage) {
                  const element = document.getElementById(`message-${repliedMessage.message_id}`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                  setHighlightedMessage(repliedMessage.message_id);
                  setTimeout(() => setHighlightedMessage(null), MESSAGE_CONSTANTS.HIGHLIGHT_DURATION);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && e.target.click()}
              aria-label="Replied message preview"
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary, display: 'block' }}
              >
                {messages.find((m) => m.message_id === message.replyTo)?.sender_id === currentUserId
                  ? 'You'
                  : friends.find((f) => f.anonymous_id === messages.find((m) => m.message_id === message.replyTo)?.sender_id)?.username || 'Unknown'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: theme.palette.text.primary,
                  ...getFontStyles(chatSettings?.fontSize, chatSettings?.fontStyle),
                }}
              >
                {message.selectedText ||
                  messages.find((m) => m.message_id === message.replyTo)?.content?.slice(0, 50) ||
                  'Media message'}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              bgcolor: isSentByCurrentUser ? theme.palette.primary.light : theme.palette.grey[200],
              p: { xs: 1, sm: 1.5 },
              borderRadius: 2,
              borderTopLeftRadius: isSentByCurrentUser ? 16 : 0,
              borderTopRightRadius: isSentByCurrentUser ? 0 : 16,
              boxShadow: theme.shadows[1],
              maxWidth: '100%',
              position: 'relative',
              '&:hover .message-actions': { opacity: 1 },
            }}
            id={`message-${message.message_id}`}
            aria-label="Message content"
          >
            {message.content && (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  ...getFontStyles(chatSettings?.fontSize, chatSettings?.fontStyle),
                }}
              >
                {message.content}
              </Typography>
            )}
            {message.media?.map((media, index) => (
              <Box key={`${message.message_id}-media-${index}`} sx={{ mt: message.content ? 1 : 0, maxWidth: '100%' }}>
                {media.type === 'image' && (
                  <img
                    src={media.url}
                    alt={`Media ${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      borderRadius: 8,
                      display: 'block',
                      maxHeight: '300px',
                      objectFit: 'contain',
                    }}
                    onError={() => setMediaError(`Failed to load image ${index + 1}`)}
                    loading="lazy"
                  />
                )}
                {media.type === 'video' && (
                  <video
                    controls
                    src={media.url}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      display: 'block',
                      ...getVideoStyle(),
                    }}
                    onError={() => setMediaError(`Failed to load video ${index + 1}`)}
                    loading="lazy"
                  />
                )}
                {media.type === 'file' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <InsertDriveFile sx={{ mr: 1 }} />
                    <a
                      href={media.url}
                      download
                      style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
                    >
                      {media.fileKey || 'Download File'}
                    </a>
                  </Box>
                )}
              </Box>
            ))}
            {message.poll && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {message.poll.question}
                </Typography>
                {message.poll.options.map((option, idx) => (
                  <Box key={`${message.message_id}-poll-${idx}`} sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalPollVotes > 0
                          ? `${((option.votes || 0) / totalPollVotes * 100).toFixed(1)}%`
                          : '0%'} ({option.votes || 0} votes)
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => onVotePoll(message.message_id, idx)}
                      disabled={message.poll.votedBy?.includes(currentUserId)}
                      variant="outlined"
                    >
                      Vote
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: isSentByCurrentUser ? 'flex-end' : 'flex-start',
                alignItems: 'center',
                mt: 0.5,
                gap: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {formatTimestamp(message.timestamp)}
              </Typography>
              {renderDeliveryStatus()}
            </Box>
            {message.reactions?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                <AnimatePresence>
                  {Object.entries(reactionCounts || {}).map(([emoji, count]) => (
                    <motion.div
                      key={`${message.message_id}-reaction-${emoji}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Chip
                        label={`${emoji} ${count}`}
                        size="small"
                        onClick={() => handleReaction({ emoji })}
                        sx={{
                          bgcolor: message.reactions.some(
                            (r) => r.emoji === emoji && r.user_id === currentUserId
                          )
                            ? theme.palette.primary.light
                            : theme.palette.grey[300],
                          cursor: 'pointer',
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && handleReaction({ emoji })}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            )}
            <Box
              className="message-actions"
              sx={{
                position: 'absolute',
                top: 8,
                right: isSentByCurrentUser ? 8 : undefined,
                left: isSentByCurrentUser ? undefined : 8,
                display: 'flex',
                gap: 0.5,
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            >
              <Tooltip title="React">
                <IconButton size="small" onClick={handleEmojiOpen} aria-label="Add reaction">
                  <EmojiEmotions fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reply">
                <IconButton size="small" onClick={handleReply} aria-label="Reply to message">
                  <Reply fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More options">
                <IconButton size="small" onClick={handleMenuOpen} aria-label="Message options">
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {mediaError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {mediaError}
            </Typography>
          )}
        </Box>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        aria-label="Message options menu"
      >
        <MenuItem onClick={handleReply} aria-label="Reply to message">Reply</MenuItem>
        <MenuItem onClick={handleForward} aria-label="Forward message">Forward</MenuItem>
        {isSentByCurrentUser && (
          <MenuItem onClick={handleEdit} aria-label="Edit message">Edit</MenuItem>
        )}
        {message.pinned ? (
          <MenuItem onClick={handleUnpin} aria-label="Unpin message">Unpin</MenuItem>
        ) : (
          <MenuItem onClick={handlePin} aria-label="Pin message">Pin</MenuItem>
        )}
        <MenuItem
          onClick={handleDelete}
          sx={{ color: theme.palette.error.main }}
          aria-label="Delete message"
        >
          Delete
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={handleEmojiClose}
        aria-label="Emoji picker"
      >
        <Box sx={{ p: 1 }}>
          <EmojiPicker
            onEmojiClick={handleReaction}
            previewConfig={{ showPreview: false }}
            width={300}
            height={400}
          />
        </Box>
      </Menu>
    </motion.div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    content: PropTypes.string,
    timestamp: PropTypes.string.isRequired,
    is_read: PropTypes.bool,
    sender_id: PropTypes.string.isRequired,
    receiver_id: PropTypes.string,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        type: PropTypes.oneOf(['image', 'video', 'file']).isRequired,
        fileKey: PropTypes.string,
      })
    ),
    replyTo: PropTypes.string,
    selectedText: PropTypes.string,
    reactions: PropTypes.arrayOf(
      PropTypes.shape({
        emoji: PropTypes.string.isRequired,
        user_id: PropTypes.string.isRequired,
      })
    ),
    poll: PropTypes.shape({
      question: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string.isRequired,
          votes: PropTypes.number,
        })
      ),
      votedBy: PropTypes.arrayOf(PropTypes.string),
    }),
    pinned: PropTypes.bool,
    delivery_status: PropTypes.oneOf(['sent', 'delivered', 'read']),
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
  }).isRequired,
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  onForward: PropTypes.func.isRequired,
  onContextMenu: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
      profile_image: PropTypes.string,
    })
  ).isRequired,
  token: PropTypes.string.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
  chatSettings: PropTypes.shape({
    videoShape: PropTypes.oneOf(['square', 'circle', 'rectangle']),
    fontSize: PropTypes.oneOf(['small', 'medium', 'large']),
    fontStyle: PropTypes.oneOf(['normal', 'italic', 'bold']),
  }),
  onVotePoll: PropTypes.func.isRequired,
  isHighlighted: PropTypes.bool,
  setHighlightedMessage: PropTypes.func,
};

export default React.memo(MessageBubble);