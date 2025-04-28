import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert } from '@mui/material';
import ChatInput from './ChatInput';

const ChatFooter = ({
  conversationId,
  recipient,
  onSendMediaMessage,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  token,
  currentUserId,
  friends,
}) => {
  const [error, setError] = useState(null);

  // Validate props
  useEffect(() => {
    if (!conversationId || !recipient || !currentUserId || !token) {
      setError('Invalid chat configuration.');
    } else {
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
        borderTop: '1px solid',
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
        onSendMediaMessage={onSendMediaMessage}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        token={token}
        currentUserId={currentUserId}
        friends={friends}
      />
    </Box>
  );
};

ChatFooter.propTypes = {
  conversationId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.arrayOf(
    PropTypes.shape({
      file: PropTypes.instanceOf(File),
      preview: PropTypes.string,
      type: PropTypes.string,
    })
  ).isRequired,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    content: PropTypes.string,
    sender_id: PropTypes.string,
    selectedText: PropTypes.string,
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
};

export default React.memo(ChatFooter);