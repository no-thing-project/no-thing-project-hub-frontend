// src/components/ChatFooter.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert } from '@mui/material';
import ChatInput from './ChatInput';

const ChatFooter = ({
  conversationId,
  recipient,
  onSendMessage,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  token,
  currentUserId,
  friends,
  socket,
  onTyping,
}) => {
  const [error, setError] = useState(null);

  // Validate props
  useEffect(() => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.warn('[ChatFooter] Invalid conversationId:', conversationId);
      setError('No conversation selected');
    } else if (!recipient || !currentUserId || !token) {
      console.warn('[ChatFooter] Invalid chat configuration:', { recipient, currentUserId, token });
      setError('Invalid chat configuration');
    } else {
      console.log('[ChatFooter] conversationId:', conversationId);
      setError(null);
    }
  }, [conversationId, recipient, currentUserId, token]);

  // Auto-clear error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (error) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderTop: `1px solid`,
        borderColor: 'grey.300',
        bgcolor: 'background.paper',
        px: 2,
        py: 1,
      }}
      aria-label="Chat Footer"
    >
      <ChatInput
        conversationId={conversationId}
        recipient={recipient}
        onSendMessage={onSendMessage}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        token={token}
        currentUserId={currentUserId}
        friends={friends}
        socket={socket}
        onTyping={onTyping}
      />
    </Box>
  );
};

ChatFooter.propTypes = {
  conversationId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
    conversation_id: PropTypes.string,
  }).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    content: PropTypes.string,
    sender_id: PropTypes.string,
    thread_id: PropTypes.string,
  }),
  setReplyToMessage: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  token: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  socket: PropTypes.object,
  onTyping: PropTypes.func.isRequired,
};

export default React.memo(ChatFooter);