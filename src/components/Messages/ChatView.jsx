import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert, Typography } from '@mui/material';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatFooter from './ChatFooter';
import ChatSettingsModal from './ChatSettingsModal';

/**
 * ChatView component for displaying a conversation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const ChatView = ({
  currentUserId,
  recipient,
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
  isGroupChat,
  friends,
  messages,
  setMessages,
  searchMessages,
}) => {
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

  // Compute conversationId
  const conversationId = useMemo(() => {
    if (!recipient) return null;
    return isGroupChat ? recipient.group_id : recipient.anonymous_id;
  }, [recipient, isGroupChat]);

  // Filter messages for the current conversation
  const filteredMessages = useMemo(() => {
    if (!conversationId) return [];
    return messages.filter(
      (m) => (isGroupChat ? m.group_id === conversationId : m.conversation_id === conversationId)
    );
  }, [messages, conversationId, isGroupChat]);

  // Fetch messages for a specific page
  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || isFetching || !hasMore) return;

      setIsFetching(true);
      setError(null);

      try {
        const data = await fetchMessagesList(conversationId, {
          page: targetPage,
          limit: 20,
          reset,
        });

        const newMessages = data?.messages || [];
        setMessages((prev) => {
          const filteredPrev = reset
            ? prev.filter(
                (m) => (isGroupChat ? m.group_id !== conversationId : m.conversation_id !== conversationId)
              )
            : prev;
          return [...filteredPrev, ...newMessages].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
        });

        setHasMore(newMessages.length === 20);
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

  // Load initial messages
  useEffect(() => {
    if (conversationId) {
      fetchMessagesForPage(1, true);
    }
  }, [conversationId, fetchMessagesForPage]);

  // Handle message sending
  const handleSendMessage = useCallback(
    async (messageData) => {
      if (!conversationId) {
        setError('No conversation selected.');
        return;
      }

      const finalMessageData = {
        ...messageData,
        conversationId,
      };

      try {
        const tempMessage = {
          ...finalMessageData,
          message_id: `temp-${Date.now()}`,
          sender_id: currentUserId,
          timestamp: new Date().toISOString(),
          is_read: false,
          status: 'sending',
        };
        setMessages((prev) => [...prev, tempMessage]);

        const sentMessage = await onSendMediaMessage(finalMessageData);

        setMessages((prev) => [
          ...prev.filter((m) => m.message_id !== tempMessage.message_id),
          sentMessage,
        ]);
      } catch (err) {
        setError('Failed to send message.');
        console.error('Send message error:', err);
      }
    },
    [conversationId, currentUserId, onSendMediaMessage, setMessages]
  );

  // Handle loading more messages
  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      fetchMessagesForPage(page);
    }
  }, [fetchMessagesForPage, isFetching, hasMore, page]);

  // Handle settings save
  const handleSettingsSave = useCallback((newSettings) => {
    setChatSettings(newSettings);
    setSettingsOpen(false);
  }, []);

  // Handle forward message
  const handleForwardMessage = useCallback(
    async (message) => {
      const newConversationId = prompt('Enter conversation ID to forward to:');
      if (newConversationId && newConversationId !== conversationId) {
        try {
          await onSendMediaMessage({
            conversationId: newConversationId,
            content: message.content,
            media: message.media,
          });
        } catch (err) {
          setError('Failed to forward message.');
          console.error('Forward message error:', err);
        }
      }
    },
    [conversationId, onSendMediaMessage]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setMessages((prev) =>
        prev.filter(
          (m) => (isGroupChat ? m.group_id !== conversationId : m.conversation_id !== conversationId)
        )
      );
    };
  }, [conversationId, isGroupChat, setMessages]);

  if (!recipient || !conversationId) {
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
        height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 100px)' },
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        overflow: 'hidden',
      }}
      aria-label="Chat view"
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}
      <ChatHeader
        recipient={recipient}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <ChatMessages
        messages={filteredMessages}
        currentUserId={currentUserId}
        recipient={recipient}
        onDeleteMessage={onDeleteMessage}
        onEditMessage={onEditMessage}
        onSendMediaMessage={handleSendMessage}
        onMarkRead={onMarkRead}
        onForwardMessage={handleForwardMessage}
        isFetching={isFetching}
        hasMore={hasMore}
        loadMoreMessages={handleLoadMore}
        chatBackground={chatSettings.chatBackground}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        friends={friends}
        token={token}
      />
      <ChatFooter
        conversationId={conversationId}
        recipient={recipient}
        onSendMessage={onSendMessage}
        onSendMediaMessage={handleSendMessage}
        pendingMediaList={pendingMediaList}
        setPendingMediaFile={setPendingMediaFile}
        clearPendingMedia={clearPendingMedia}
        defaultVideoShape={chatSettings.videoShape}
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
        isGroupChat={isGroupChat}
        token={token}
        currentUserId={currentUserId}
        friends={friends}
        chatBackground={chatSettings.chatBackground}
      />
      <ChatSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSettingsSave}
        initialSettings={chatSettings}
      />
    </Box>
  );
};

ChatView.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
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
  isGroupChat: PropTypes.bool.isRequired,
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
    })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  searchMessages: PropTypes.func.isRequired,
};

export default React.memo(ChatView);