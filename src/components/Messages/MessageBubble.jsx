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
import {
  MoreVert,
  Reply,
  Edit,
  Delete,
  Forward,
  Done,
  DoneAll,
  EmojiEmotions,
  InsertDriveFile,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const MESSAGE_CONSTANTS = {
  HIGHLIGHT_DURATION: 3000,
};

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
  getSenderName,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const messageRef = useRef(null);

  const sender = useMemo(() => {
    return isGroupChat
      ? friends.find((f) => f.anonymous_id === message.sender_id) || { username: 'Unknown' }
      : null;
  }, [isGroupChat, friends, message.sender_id]);

  const senderName = useMemo(() => {
    return isGroupChat ? sender.username : recipient?.username || 'User';
  }, [isGroupChat, sender, recipient]);

  const reactionCounts = useMemo(() => {
    return message.reactions?.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {}) || {};
  }, [message.reactions]);

  const totalPollVotes = useMemo(() => {
    return message.poll?.options.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
  }, [message.poll]);

  const repliedMessage = useMemo(() => {
    return messages.find((m) => m.message_id === message.replyTo);
  }, [messages, message.replyTo]);

  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEmojiOpen = useCallback((event) => {
    event.stopPropagation();
    setEmojiAnchorEl(event.currentTarget);
  }, []);

  const handleEmojiClose = useCallback(() => {
    setEmojiAnchorEl(null);
  }, []);

  const handleReply = useCallback(() => {
    setReplyToMessage({ ...message, selectedText: null, isTextReply: false });
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

  useEffect(() => {
    return () => setMediaError(null);
  }, [message.message_id]);

  useEffect(() => {
    const ref = messageRef.current;
    if (ref) {
      const handleContext = (e) => onContextMenu(e, message);
      ref.addEventListener('contextmenu', handleContext);
      return () => ref.removeEventListener('contextmenu', handleContext);
    }
  }, [onContextMenu, message]);

  const renderDeliveryStatus = useCallback(() => {
    if (!isSentByCurrentUser) return null;
    if (message.is_read) {
      return (
        <DoneAll
          sx={{ fontSize: 14, color: theme.palette.primary.main }}
          aria-label="Message read"
        />
      );
    }
    if (message.delivery_status === 'delivered') {
      return (
        <Done
          sx={{ fontSize: 14, color: theme.palette.grey[600] }}
          aria-label="Message delivered"
        />
      );
    }
    return (
      <Done
        sx={{ fontSize: 14, color: theme.palette.grey[400] }}
        aria-label="Message sent"
      />
    );
  }, [isSentByCurrentUser, message.is_read, message.delivery_status, theme]);

  const getVideoStyle = useCallback(() => {
    switch (chatSettings?.videoShape) {
      case 'circle':
        return { borderRadius: '50%', overflow: 'hidden' };
      case 'square':
        return { borderRadius: '8px' };
      case 'rectangle':
      default:
        return { borderRadius: '8px', aspectRatio: '16/9' };
    }
  }, [chatSettings?.videoShape]);

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
            alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start',
          }}
          ref={messageRef}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isSentByCurrentUser ? 'flex-end' : 'flex-start',
            }}
          >
            {isGroupChat && !isSentByCurrentUser && (
              <Typography
                variant="caption"
                sx={{ mb: 0.5, color: theme.palette.text.secondary }}
              >
                {senderName}
              </Typography>
            )}
            {message.replyTo && repliedMessage && (
              <Box
                sx={{
                  bgcolor: theme.palette.grey[100],
                  p: 1,
                  borderRadius: 1,
                  mb: 1,
                  maxWidth: '100%',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  fontStyle: message.isTextReply ? 'italic' : 'normal',
                  '&:hover': {
                    bgcolor: theme.palette.grey[200],
                  },
                }}
                onClick={() => {
                  const element = document.getElementById(
                    `message-${repliedMessage.message_id}`
                  );
                  element?.scrollIntoView({ behavior: 'smooth' });
                  setHighlightedMessage(repliedMessage.message_id);
                  setTimeout(
                    () => setHighlightedMessage(null),
                    MESSAGE_CONSTANTS.HIGHLIGHT_DURATION
                  );
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && e.target.click()}
                aria-label={`Replied message preview from ${getSenderName(
                  repliedMessage.sender_id
                )}`}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    display: 'block',
                    fontWeight: 'bold',
                  }}
                >
                  {message.isTextReply
                    ? 'Replying to selected text'
                    : 'Replying to message'}{' '}
                  by {getSenderName(repliedMessage.sender_id)}
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
                    (repliedMessage.content?.slice(0, 50) +
                      (repliedMessage.content?.length > 50 ? '...' : '')) ||
                    'Media message'}
                </Typography>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                bgcolor: isSentByCurrentUser
                  ? theme.palette.primary.light
                  : theme.palette.grey[200],
                borderRadius: 2,
                borderTopLeftRadius: isSentByCurrentUser ? 16 : 0,
                borderTopRightRadius: isSentByCurrentUser ? 0 : 16,
                boxShadow: theme.shadows[1],
                maxWidth: '100%',
              }}
              id={`message-${message.message_id}`}
              aria-label="Message content"
            >
              <Box sx={{ flex: 1, p: { xs: 1, sm: 1.5 } }}>
                {message.content && (
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      ...getFontStyles(
                        chatSettings?.fontSize,
                        chatSettings?.fontStyle
                      ),
                    }}
                  >
                    {message.content}
                  </Typography>
                )}
                {message.media?.map((media, index) => (
                  <Box
                    key={`${message.message_id}-media-${index}`}
                    sx={{ mt: message.content ? 1 : 0, maxWidth: '100%' }}
                  >
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
                        onError={() =>
                          setMediaError(`Failed to load image ${index + 1}`)
                        }
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
                        onError={() =>
                          setMediaError(`Failed to load video ${index + 1}`)
                        }
                        loading="lazy"
                      />
                    )}
                    {media.type === 'file' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <InsertDriveFile sx={{ mr: 1 }} />
                        <a
                          href={media.url}
                          download
                          style={{
                            color: theme.palette.primary.main,
                            textDecoration: 'none',
                          }}
                        >
                          {media.name || 'Download File'}
                        </a>
                      </Box>
                    )}
                  </Box>
                ))}
                {message.poll && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">
                      {message.poll.question}
                    </Typography>
                    {message.poll.options.map((option, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mt: 0.5,
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="body2">{option.text}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ mr: 1 }}>
                            {option.votes || 0} votes
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onVotePoll(message.message_id, index)}
                            disabled={message.poll.voted}
                            aria-label={`Vote for ${option.text}`}
                          >
                            Vote
                          </Button>
                        </Box>
                      </Box>
                    ))}
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Total votes: {totalPollVotes}
                    </Typography>
                  </Box>
                )}
                {mediaError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {mediaError}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  p: 0.5,
                  color: isSentByCurrentUser
                    ? theme.palette.grey[600]
                    : theme.palette.grey[700],
                }}
                aria-label="Message options"
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
                aria-label="Message timestamp"
              >
                {formatTimestamp(message.timestamp)}
              </Typography>
              {renderDeliveryStatus()}
            </Box>
            {message.reactions?.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <Tooltip
                    key={emoji}
                    title={`${count} reaction${count > 1 ? 's' : ''}`}
                  >
                    <Chip
                      label={`${emoji} ${count}`}
                      size="small"
                      onClick={handleEmojiOpen}
                      sx={{
                        bgcolor: message.reactions.some(
                          (r) => r.emoji === emoji && r.user_id === currentUserId
                        )
                          ? theme.palette.action.selected
                          : theme.palette.grey[300],
                        cursor: 'pointer',
                      }}
                      aria-label={`${count} reactions with ${emoji}`}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
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
        <MenuItem onClick={handleEmojiOpen} aria-label="Add reaction">
          <EmojiEmotions fontSize="small" sx={{ mr: 1 }} /> Add Reaction
        </MenuItem>
        {message.pinned ? (
          <MenuItem onClick={handleUnpin} aria-label="Unpin message">
            <Delete fontSize="small" sx={{ mr: 1 }} /> Unpin
          </MenuItem>
        ) : (
          <MenuItem onClick={handlePin} aria-label="Pin message">
            <Delete fontSize="small" sx={{ mr: 1 }} /> Pin
          </MenuItem>
        )}
      </Menu>
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={handleEmojiClose}
      >
        <MenuItem sx={{ p: 0 }}>
          <EmojiPicker onEmojiClick={handleReaction} />
        </MenuItem>
      </Menu>
    </motion.div>
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
        type: PropTypes.string,
        url: PropTypes.string,
        name: PropTypes.string,
      })
    ),
    reactions: PropTypes.arrayOf(
      PropTypes.shape({
        emoji: PropTypes.string,
        user_id: PropTypes.string,
      })
    ),
    replyTo: PropTypes.string,
    selectedText: PropTypes.string,
    isTextReply: PropTypes.bool,
    pinned: PropTypes.bool,
    delivery_status: PropTypes.string,
    poll: PropTypes.shape({
      question: PropTypes.string,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          votes: PropTypes.number,
        })
      ),
      voted: PropTypes.bool,
    }),
    thread_id: PropTypes.string,
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
    videoShape: PropTypes.string,
    fontSize: PropTypes.string,
    fontStyle: PropTypes.string,
  }).isRequired,
  onVotePoll: PropTypes.func.isRequired,
  isHighlighted: PropTypes.bool.isRequired,
  setHighlightedMessage: PropTypes.func.isRequired,
  getSenderName: PropTypes.func.isRequired,
};

export default React.memo(MessageBubble);