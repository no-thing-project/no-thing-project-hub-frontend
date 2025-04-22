import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert, Typography, CircularProgress, useTheme } from '@mui/material';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatFooter from './ChatFooter';
import ChatSettingsModal from '../ChatSettingsModal';

const ChatView = ({
  currentUserId,
  conversation,
  onSendMessage,
  onSendMediaMessage,
  onMarkRead,
  onDeleteMessage,
  onEditMessage,
  onForwardMessage,
  token,
  fetchMessagesList,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  friends,
  messages,
  setMessages,
  searchMessages,
  onAddReaction,
  onCreatePoll,
  onVotePoll,
  onPinMessage,
  onUnpinMessage,
  onSendTyping,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    videoShape: 'square',
    chatBackground: 'default',
  });
  const [replyToMessage, setReplyToMessage] = useState(null);
  const chatContainerRef = useRef(null);

  const conversationId = conversation?.conversation_id || null;
  const isGroupChat = conversation?.type === 'group' || false;

  const filteredMessages = useMemo(() => {
    if (!conversationId) return [];
    const validMessages = (messages || []).filter(
      (m) => m && m.message_id && (isGroupChat ? m.group_id === conversationId : m.conversation_id === conversationId)
    );
    return validMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, conversationId, isGroupChat]);

  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || isFetching || !hasMore) return;

      setIsFetching(true);
      setError(null);

      try {
        const data = await fetchMessagesList(conversationId, {
          page: targetPage,
          limit: 50,
          reset,
        });

        const newMessages = (data?.messages || []).filter((m) => m?.message_id);
        setMessages((prev) => {
          const validPrev = Array.isArray(prev) ? prev : [];
          const filteredPrev = reset
            ? validPrev.filter(
                (m) => (isGroupChat ? m.group_id !== conversationId : m.conversation_id !== conversationId)
              )
            : validPrev;
          const combined = [...filteredPrev, ...newMessages];
          return [...new Set(combined.map((m) => m.message_id))].map((id) =>
            combined.find((m) => m.message_id === id)
          ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        setHasMore(newMessages.length === 50);
        setPage(targetPage + 1);
      } catch (err) {
        setError('Failed to load messages. Please try again.');
        console.error('Fetch messages error:', err);
      } finally {
        setIsFetching(false);
      }
    },
    [conversationId, fetchMessagesList, isGroupChat, setMessages, hasMore, isFetching]
  );

  useEffect(() => {
    if (conversationId) {
      fetchMessagesForPage(1, true);
    }
  }, [conversationId, fetchMessagesForPage]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessagesForPage(1, false);
    }, 5000); // Increased interval to reduce server load
    return () => clearInterval(interval);
  }, [conversationId, fetchMessagesForPage]);

  const handleSendMessage = useCallback(
    async (messageData) => {
      if (!conversationId) {
        setError('No conversation selected.');
        return;
      }

      const finalMessageData = {
        ...messageData,
        conversationId,
        replyTo: replyToMessage?.message_id || undefined,
      };

      try {
        const tempMessage = {
          ...finalMessageData,
          message_id: `temp-${Date.now()}`,
          sender_id: currentUserId,
          timestamp: new Date().toISOString(),
          is_read: false,
          delivery_status: 'sent',
        };
        setMessages((prev) => {
          const validPrev = Array.isArray(prev) ? prev : [];
          return [...validPrev, tempMessage].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });

        const sentMessage = await onSendMediaMessage(finalMessageData);

        setMessages((prev) => {
          const validPrev = Array.isArray(prev) ? prev : [];
          return [
            ...validPrev.filter((m) => m.message_id !== tempMessage.message_id),
            sentMessage,
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        setReplyToMessage(null);
      } catch (err) {
        setError('Failed to send message.');
        console.error('Send message error:', err);
      }
    },
    [conversationId, currentUserId, onSendMediaMessage, setMessages, replyToMessage]
  );

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      fetchMessagesForPage(page);
    }
  }, [fetchMessagesForPage, isFetching, hasMore, page]);

  const handleSettingsSave = useCallback((newSettings) => {
    setChatSettings(newSettings);
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      setMessages((prev) => {
        const validPrev = Array.isArray(prev) ? prev : [];
        return validPrev.filter(
          (m) => (isGroupChat ? m.group_id !== conversationId : m.conversation_id !== conversationId)
        );
      });
    };
  }, [conversationId, isGroupChat, setMessages]);

  if (!conversation || !conversationId) {
    return (
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ mt: 4, textAlign: 'center' }}
        aria-label="No conversation selected"
      >
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
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
        boxSizing: 'border-box',
        minWidth: 0,
      }}
      aria-label="Chat view"
      ref={chatContainerRef}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      {isFetching && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} aria-label="Loading messages" />
        </Box>
      )}
      <ChatHeader
        recipient={conversation}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <ChatMessages
        messages={filteredMessages}
        currentUserId={currentUserId}
        recipient={conversation}
        onDeleteMessage={onDeleteMessage}
        onEditMessage={onEditMessage}
        onSendMediaMessage={handleSendMessage}
        onMarkRead={onMarkRead}
        onForwardMessage={onForwardMessage}
        isFetching={isFetching}
        hasMore={hasMore}
        loadMoreMessages={handleLoadMore}
        chatBackground={chatSettings.chatBackground}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        friends={friends}
        token={token}
        onAddReaction={onAddReaction}
        onCreatePoll={onCreatePoll}
        onVotePoll={onVotePoll}
        onPinMessage={onPinMessage}
        onUnpinMessage={onUnpinMessage}
        chatSettings={chatSettings}
      />
      <ChatFooter
        conversationId={conversationId}
        recipient={conversation}
        onSendMessage={onSendMessage}
        onSendMediaMessage={handleSendMessage}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        token={token}
        currentUserId={currentUserId}
        friends={friends}
        chatBackground={chatSettings.chatBackground}
        onSendTyping={onSendTyping}
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
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  onEditMessage: PropTypes.func.isRequired,
  onForwardMessage: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      conversation_id: PropTypes.string,
      group_id: PropTypes.string,
      content: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string,
      receiver_id: PropTypes.string,
      type: PropTypes.string,
      media: PropTypes.array,
    })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  searchMessages: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onCreatePoll: PropTypes.func.isRequired,
  onVotePoll: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
  onSendTyping: PropTypes.func.isRequired,
};

export default React.memo(ChatView);