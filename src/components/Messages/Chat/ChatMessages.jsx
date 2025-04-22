import React, { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, CircularProgress, Menu, MenuItem, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '../MessageBubble';

const getBackgroundStyle = (chatBackground) => ({
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
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const observerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ anchorEl: null, selectedText: '', message: null });

  const handleContextMenu = useCallback((event, message) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText) {
      event.preventDefault();
      setContextMenu({ anchorEl: event.currentTarget, selectedText, message });
    }
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ anchorEl: null, selectedText: '', message: null });
  }, []);

  const handleReplyText = useCallback(() => {
    setReplyToMessage({ ...contextMenu.message, selectedText: contextMenu.selectedText });
    handleContextMenuClose();
  }, [contextMenu.message, contextMenu.selectedText, setReplyToMessage]);

  const handleIntersection = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        console.log('[ChatMessages] Loading more messages');
        loadMoreMessages();
      }
    },
    [hasMore, isFetching, loadMoreMessages]
  );

  useEffect(() => {
    if (!chatContainerRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: chatContainerRef.current,
      threshold: 0.1,
    });

    const topElement = chatContainerRef.current.children[0];
    if (topElement) observerRef.current.observe(topElement);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleIntersection, messages]);

  useEffect(() => {
    if (messages.length && !isFetching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isFetching]);

  useEffect(() => {
    if (messages.length) {
      const unreadMessages = messages.filter(
        (m) => m?.receiver_id === currentUserId && !m.is_read
      );
      unreadMessages.forEach((m) => m?.message_id && onMarkRead(m.message_id));
    }
  }, [messages, currentUserId, onMarkRead]);

  const pinnedMessages = messages.filter((m) => m?.pinned);

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        flex: 1,
        overflowY: 'auto',
        p: { xs: 1, sm: 2 },
        ...getBackgroundStyle(chatBackground),
        position: 'relative',
        minHeight: '200px',
      }}
      aria-label="Chat messages"
    >
      <div style={{ height: '1px' }} aria-hidden="true" />
      {pinnedMessages.length > 0 && (
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
              }}
            >
              {msg.content?.length > 50 ? `${msg.content.slice(0, 50)}...` : msg.content || 'Media message'}
            </Typography>
          ))}
        </Box>
      )}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} aria-label="Loading more messages" />
        </Box>
      )}
      {messages.length > 0 ? (
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
                onContextMenu={handleContextMenu}
                isGroupChat={isGroupChat}
                friends={friends}
                token={token}
                onAddReaction={onAddReaction}
                onCreatePoll={onCreatePoll}
                onVotePoll={onVotePoll}
                onPinMessage={onPinMessage}
                onUnpinMessage={onUnpinMessage}
                chatSettings={{
                  videoShape: 'rectangle',
                  fontSize: 'medium',
                  fontStyle: 'normal',
                }}
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
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={handleContextMenuClose}
        aria-label="Text selection menu"
      >
        <MenuItem onClick={handleReplyText} aria-label="Reply to selected text">
          Reply to Text
        </MenuItem>
        <MenuItem onClick={() => onForwardMessage(contextMenu.message)} aria-label="Forward message">
          Forward
        </MenuItem>
      </Menu>
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
      pinned: PropTypes.bool,
      delivery_status: PropTypes.string,
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
  onAddReaction: PropTypes.func.isRequired,
  onCreatePoll: PropTypes.func.isRequired,
  onVotePoll: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
};

export default React.memo(ChatMessages);