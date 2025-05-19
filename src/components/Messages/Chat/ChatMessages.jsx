import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  useTheme,
  Skeleton,
  Button,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../MessageBubble';
import { format, isSameDay } from 'date-fns';
import debounce from 'lodash/debounce';

const PinnedMessages = ({ pinnedMessages, theme, setHighlightedMessage }) => {
  return (
    <Box
      sx={{
        bgcolor: theme.palette.grey[100],
        p: 1,
        mb: 2,
        borderRadius: 1,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        boxShadow: theme.shadows[1],
      }}
      aria-label="Pinned messages"
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        Pinned Messages
      </Typography>
      {pinnedMessages.map((msg) => (
        <Typography
          key={msg.message_id}
          variant="body2"
          sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}
          onClick={() => {
            const element = document.getElementById(`message-${msg.message_id}`);
            element?.scrollIntoView({ behavior: 'smooth' });
            setHighlightedMessage(msg.message_id);
            setTimeout(() => setHighlightedMessage(null), 3000);
          }}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && e.target.click()}
          aria-label={`Pinned message: ${msg.content?.slice(0, 50) || 'Media message'}`}
        >
          {msg.content?.length > 50 ? `${msg.content.slice(0, 50)}...` : msg.content || 'Media message'}
        </Typography>
      ))}
    </Box>
  );
};

PinnedMessages.propTypes = {
  pinnedMessages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      content: PropTypes.string,
    })
  ).isRequired,
  theme: PropTypes.object.isRequired,
  setHighlightedMessage: PropTypes.func.isRequired,
};

const getBackgroundStyle = (chatBackground) =>
  ({
    lightGray: { backgroundColor: '#f5f5f5' },
    dark: { backgroundColor: '#333', color: 'white' },
    nature: { backgroundImage: "url('/nature-bg.jpg')", backgroundSize: 'cover' },
    default: { backgroundColor: 'white' },
  }[chatBackground] || { backgroundColor: 'white' });

const ChatMessages = ({
  messages,
  currentUserId,
  recipient,
  onDeleteMessage,
  onEditMessage,
  onSendMediaMessage,
  onMarkRead,
  onForwardMessage,
  isFetching,
  hasMore,
  loadMoreMessages,
  chatBackground,
  setReplyToMessage,
  isGroupChat,
  friends,
  token,
  onAddReaction,
  onCreatePoll,
  onVotePoll,
  onPinMessage,
  onUnpinMessage,
  chatSettings,
  showDate,
  socket,
}) => {
  const theme = useTheme();
  const chatContainerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ anchorEl: null, selectedText: '', message: null });
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [error, setError] = useState(null);

  const normalizedMessages = useMemo(() => {
    const msgs = Array.isArray(messages) ? messages : [messages].filter(Boolean);
    return msgs
      .filter((m) => m?.message_id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages]);

  const pinnedMessages = useMemo(() => {
    return normalizedMessages.filter((m) => m?.pinned);
  }, [normalizedMessages]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(chatBackground), [chatBackground]);

  const getSenderName = useCallback(
    (senderId) => {
      if (senderId === currentUserId) return 'You';
      const friend = friends.find((f) => f.anonymous_id === senderId);
      return friend?.username || 'Unknown';
    },
    [currentUserId, friends]
  );

  const handleContextMenu = useCallback((event, message) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText || message) {
      event.preventDefault();
      setContextMenu({ anchorEl: event.currentTarget, selectedText, message });
    }
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ anchorEl: null, selectedText: '', message: null });
  }, []);

  const handleReplyText = useCallback(() => {
    setReplyToMessage({
      ...contextMenu.message,
      selectedText: contextMenu.selectedText || null,
      isTextReply: !!contextMenu.selectedText,
    });
    handleContextMenuClose();
  }, [contextMenu.message, contextMenu.selectedText, setReplyToMessage]);

  const debouncedLoadMore = useCallback(
    debounce(() => {
      if (hasMore && !isFetching) {
        loadMoreMessages();
      }
    }, 300),
    [hasMore, isFetching, loadMoreMessages]
  );

  useEffect(() => {
    if (!chatContainerRef.current || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          debouncedLoadMore();
        }
      },
      { root: chatContainerRef.current, threshold: 0.1 }
    );

    const topElement = chatContainerRef.current.querySelector('div[style*="height: 1px"]');
    if (topElement) observer.observe(topElement);

    return () => {
      if (topElement) observer.unobserve(topElement);
      debouncedLoadMore.cancel();
    };
  }, [hasMore, isFetching, debouncedLoadMore]);

  useEffect(() => {
    const unreadMessages = normalizedMessages.filter(
      (m) => m?.receiver_id === currentUserId && !m.is_read
    );
    for (const msg of unreadMessages) {
      if (msg?.message_id) {
        onMarkRead(msg.message_id).catch(() =>
          setError('Failed to mark message as read')
        );
      }
    }
  }, [normalizedMessages, currentUserId, onMarkRead]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadMessages = normalizedMessages.filter(
      (m) => m?.receiver_id === currentUserId && !m.is_read
    );
    try {
      for (const msg of unreadMessages) {
        if (msg?.message_id) {
          await onMarkRead(msg.message_id);
        }
      }
    } catch (err) {
      setError('Failed to mark all messages as read');
    }
  }, [normalizedMessages, currentUserId, onMarkRead]);

  const handleRetrySend = useCallback(
    async (message) => {
      try {
        await onSendMediaMessage(message);
        setError(null);
      } catch (err) {
        setError('Failed to retry sending message');
      }
    },
    [onSendMediaMessage]
  );

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        ...backgroundStyle,
      }}
      role="region"
      aria-label="Chat messages"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
              {error.includes('Failed to send') && (
                <Button
                  size="small"
                  onClick={() => handleRetrySend(contextMenu.message)}
                >
                  Retry
                </Button>
              )}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ height: '1px' }} aria-hidden="true" />
      {pinnedMessages.length > 0 && (
        <PinnedMessages
          pinnedMessages={pinnedMessages}
          theme={theme}
          setHighlightedMessage={setHighlightedMessage}
        />
      )}
      {isGroupChat &&
        normalizedMessages.some((m) => m?.receiver_id === currentUserId && !m.is_read) && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleMarkAllRead}
              aria-label="Mark all messages as read"
            >
              Mark All as Read
            </Button>
          </Box>
        )}
      {isFetching && normalizedMessages.length === 0 && (
        <Box sx={{ py: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={`skeleton-${i}`}
              sx={{
                display: 'flex',
                justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
                mb: 2,
              }}
            >
              <Skeleton
                variant="rectangular"
                width="60%"
                height={40}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      )}
      {normalizedMessages.length > 0 ? (
        <AnimatePresence>
          {showDate && normalizedMessages[0]?.timestamp && (
            <Box
              sx={{
                position: 'sticky',
                top: pinnedMessages.length > 0 ? 80 : 0,
                bgcolor: theme.palette.background.paper,
                textAlign: 'center',
                py: 1,
                mb: 1,
                borderRadius: 1,
              }}
              aria-label="Message date"
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
              >
                {format(new Date(normalizedMessages[0].timestamp), 'MMMM d, yyyy')}
              </Typography>
            </Box>
          )}
          {normalizedMessages.map((msg) => (
            <motion.div
              key={msg.message_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MessageBubble
                message={msg}
                isSentByCurrentUser={msg.sender_id === currentUserId}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
                onSendMediaMessage={onSendMediaMessage}
                currentUserId={currentUserId}
                recipient={recipient}
                messages={normalizedMessages}
                setReplyToMessage={setReplyToMessage}
                onForward={onForwardMessage}
                onContextMenu={handleContextMenu}
                isGroupChat={isGroupChat}
                friends={friends}
                token={token}
                onAddReaction={onAddReaction}
                onCreatePoll={onCreatePoll}
                onVotePoll={onVotePoll}
                onPinMessage={onPinMessage}
                onUnpinMessage={onUnpinMessage}
                chatSettings={chatSettings}
                isHighlighted={highlightedMessage === msg.message_id}
                setHighlightedMessage={setHighlightedMessage}
                getSenderName={getSenderName}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        !isFetching && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
            aria-label="No messages"
          >
            No messages yet. Start chatting!
          </Typography>
        )
      )}
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={handleContextMenuClose}
      >
        <MenuItem onClick={handleReplyText}>
          {contextMenu.selectedText ? 'Reply to Selected Text' : 'Reply to Message'}
        </MenuItem>
        <MenuItem onClick={() => onForwardMessage(contextMenu.message)}>
          Forward
        </MenuItem>
      </Menu>
    </Box>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        message_id: PropTypes.string.isRequired,
        conversation_id: PropTypes.string,
        group_id: PropTypes.string,
        content: PropTypes.string,
        timestamp: PropTypes.string.isRequired,
        is_read: PropTypes.bool,
        sender_id: PropTypes.string.isRequired,
        receiver_id: PropTypes.string,
        media: PropTypes.array,
        replyTo: PropTypes.string,
        selectedText: PropTypes.string,
        pinned: PropTypes.bool,
        delivery_status: PropTypes.string,
        reactions: PropTypes.array,
        thread_id: PropTypes.string,
      })
    ),
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      group_id: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string.isRequired,
      receiver_id: PropTypes.string,
      media: PropTypes.array,
      replyTo: PropTypes.string,
      selectedText: PropTypes.string,
      pinned: PropTypes.bool,
      delivery_status: PropTypes.string,
      reactions: PropTypes.array,
      thread_id: PropTypes.string,
    }),
  ]).isRequired,
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onForwardMessage: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loadMoreMessages: PropTypes.func.isRequired,
  chatBackground: PropTypes.string.isRequired,
  setReplyToMessage: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  token: PropTypes.string.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onCreatePoll: PropTypes.func.isRequired,
  onVotePoll: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
  chatSettings: PropTypes.shape({
    videoShape: PropTypes.string,
    fontSize: PropTypes.string,
    fontStyle: PropTypes.string,
  }).isRequired,
  showDate: PropTypes.bool.isRequired,
  socket: PropTypes.object,
};

export default React.memo(ChatMessages);