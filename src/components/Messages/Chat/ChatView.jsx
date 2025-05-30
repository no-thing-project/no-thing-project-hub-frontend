import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert, Typography, useTheme, CircularProgress } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatFooter from './ChatFooter';
import ChatSettingsModal from '../ChatSettingsModal';
import { useNotification } from '../../../context/NotificationContext';

const ChatView = ({
  currentUserId,
  conversation,
  messages,
  setMessages,
  token,
  friends,
  socket,
  fetchMessagesList: loadMessages,
  onSendMessage: sendNewMessage,
  onMarkRead: markRead,
  onDeleteMessage: deleteMsg,
  onEditMessage: editMsg,
  onAddReaction: addMessageReaction,
  onCreatePoll: createNewPoll,
  onVotePoll: voteInPoll,
  onPinMessage: pinMsg,
  onUnpinMessage: unpinMsg,
  onTyping: sendTypingIndicator,
  onForwardMessage,
}) => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    videoShape: 'square',
    chatBackground: 'default',
    fontSize: 'medium',
    fontStyle: 'normal',
  });
  const [replyToMessage, setReplyToMessage] = useState(null);
  const conversationId = conversation?.conversation_id ?? null;
  const isGroupChat = conversation?.type === 'group' ?? false;

  // Log conversationId for debugging
  useEffect(() => {
    if (!conversationId || typeof conversationId !== 'string') {
      console.warn('[ChatView] Invalid conversationId:', conversationId);
      setError('No conversation selected');
    } else {
      console.log('[ChatView] conversationId:', conversationId);
    }
  }, [conversationId]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Save chat settings
  const handleSettingsSave = useCallback((newSettings) => {
    setChatSettings(newSettings);
    setSettingsOpen(false);
  }, []);

  // Early return if no valid conversation
  if (!conversation || !conversationId || typeof conversationId !== 'string') {
    return (
      <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Select a conversation to start chatting
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: `1px solid ${theme.palette.grey[300]}`,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
      }}
      aria-label="Chat View"
    >
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ m: 1 }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <ChatHeader
        recipient={conversation}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
        socket={socket}
        friends={friends}
        currentUserId={currentUserId}
      />
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }} aria-label="Chat Messages">
        <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          conversationId={conversationId}
          recipient={conversation}
          onDeleteMessage={deleteMsg}
          onEditMessage={editMsg}
          onSendMediaMessage={sendNewMessage}
          onMarkRead={markRead}
          onForwardMessage={onForwardMessage}
          loadMessages={loadMessages}
          setMessages={setMessages}
          showNotification={showNotification}
          chatBackground={chatSettings.chatBackground}
          setReplyToMessage={setReplyToMessage}
          isGroupChat={isGroupChat}
          friends={friends}
          token={token}
          onAddReaction={addMessageReaction}
          onCreatePoll={createNewPoll}
          onVotePoll={voteInPoll}
          onPinMessage={pinMsg}
          onUnpinMessage={unpinMsg}
          chatSettings={chatSettings}
          showDate={true}
          socket={socket}
        />
      </Box>
      <ChatFooter
        conversationId={conversationId}
        recipient={conversation}
        onSendMessage={sendNewMessage}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        token={token}
        currentUserId={currentUserId}
        friends={friends}
        socket={socket}
        onTyping={sendTypingIndicator}
      />
      <ChatSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
        initialSettings={chatSettings}
        isGroupChat={isGroupChat}
      />
    </Box>
  );
};

ChatView.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  conversation: PropTypes.shape({
    conversation_id: PropTypes.string,
    type: PropTypes.string,
    name: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
  }),
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      content: PropTypes.string,
      content_per_user: PropTypes.arrayOf(
        PropTypes.shape({
          user_id: PropTypes.string,
          content: PropTypes.string,
        })
      ),
      timestamp: PropTypes.string,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string,
      type: PropTypes.string,
      media: PropTypes.array,
      reply_to: PropTypes.string,
    })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  socket: PropTypes.object,
  fetchMessagesList: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onCreatePoll: PropTypes.func.isRequired,
  onVotePoll: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
  onTyping: PropTypes.func.isRequired,
  onForwardMessage: PropTypes.func.isRequired,
};

export default React.memo(ChatView);