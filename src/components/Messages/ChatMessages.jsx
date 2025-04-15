import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

/**
 * Applies background styling based on chatBackground setting
 * @param {string} chatBackground - Background setting
 * @returns {Object} CSS styles
 */
const getBackgroundStyle = (chatBackground) => ({
  lightGray: { backgroundColor: '#f5f5f5' },
  dark: { backgroundColor: '#333', color: 'white' },
  nature: { backgroundImage: "url('/nature-bg.jpg')", backgroundSize: 'cover' },
  default: { backgroundColor: 'white' },
}[chatBackground] || { backgroundColor: 'white' });

/**
 * ChatMessages component for rendering conversation messages
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
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
}) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const observerRef = useRef(null);

  // Handle infinite scroll
  const handleIntersection = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        loadMoreMessages();
      }
    },
    [hasMore, isFetching, loadMoreMessages]
  );

  // Set up IntersectionObserver for loading more messages
  useEffect(() => {
    if (!chatContainerRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: chatContainerRef.current,
      threshold: 0.1,
    });

    const topElement = chatContainerRef.current.children[0];
    if (topElement) observerRef.current.observe(topElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length && !isFetching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isFetching]);

  // Mark unread messages as read
  useEffect(() => {
    if (messages.length) {
      const unreadMessages = messages.filter(
        (m) => m.receiver_id === currentUserId && !m.is_read
      );
      unreadMessages.forEach((m) => onMarkRead(m.message_id));
    }
  }, [messages, currentUserId, onMarkRead]);

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: { xs: 1, md: 2 },
        ...getBackgroundStyle(chatBackground),
        position: 'relative',
      }}
      aria-label="Chat messages"
    >
      <div style={{ height: '1px' }} aria-hidden="true" />
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} aria-label="Loading more messages" />
        </Box>
      )}
      {messages.length ? (
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.message_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble
                message={msg}
                isSentByCurrentUser={msg.sender_id === currentUserId}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
                onSendMediaMessage={onSendMediaMessage}
                currentUserId={currentUserId}
                recipient={recipient}
                messages={messages}
                setReplyToMessage={setReplyToMessage}
                onForward={onForwardMessage}
                isGroupChat={isGroupChat}
                friends={friends}
                token={token}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
          aria-label="No messages"
        >
          {isFetching ? 'Loading...' : 'No messages yet. Start chatting!'}
        </Typography>
      )}
      <div ref={messagesEndRef} aria-hidden="true" />
    </Box>
  );
};

ChatMessages.propTypes = {
  messages: PropTypes.arrayOf(
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
    })
  ).isRequired,
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
};

export default React.memo(ChatMessages);