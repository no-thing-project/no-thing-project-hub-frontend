import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
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
  chatBackground,
  onSendTyping,
}) => {
  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: 'grey.300',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
      aria-label="Chat footer"
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
        chatBackground={chatBackground}
        onSendTyping={onSendTyping}
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
  pendingMediaList: PropTypes.arrayOf(PropTypes.any).isRequired,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    content: PropTypes.string,
    sender_id: PropTypes.string,
    selectedText: PropTypes.string,
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
  chatBackground: PropTypes.string,
  onSendTyping: PropTypes.func.isRequired,
};

export default React.memo(ChatFooter);