import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert, Typography, useTheme, CircularProgress } from '@mui/material';
import { VariableSizeList } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatFooter from './ChatFooter';
import ChatSettingsModal from '../ChatSettingsModal';
import { isSameDay } from 'date-fns';

const ChatView = ({
  currentUserId,
  conversation,
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
  onAddReaction,
  onCreatePoll,
  onVotePoll,
  onPinMessage,
  onUnpinMessage,
  socket,
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
    fontSize: 'medium',
    fontStyle: 'normal',
  });
  const [replyToMessage, setReplyToMessage] = useState(null);
  const listRef = useRef(null);
  const isNearBottomRef = useRef(true);

  const conversationId = conversation?.conversation_id || null;
  const isGroupChat = conversation?.type === 'group' || false;

  // Auto-clear error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (!conversationId) return [];
    const validMessages = (messages || []).filter(
      (m) => m?.message_id && (isGroupChat ? m.group_id === conversationId : m.conversation_id === conversationId)
    );
    return validMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, conversationId, isGroupChat]);

  // Fetch messages
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

        setHasMore(newMessages.length === 20);
        setPage(targetPage + 1);

        if (reset && listRef.current && newMessages.length > 0) {
          setTimeout(() => {
            listRef.current.scrollToItem(filteredMessages.length - 1, 'end');
          }, 100);
        }
      } catch (err) {
        setError('Failed to load messages.');
        console.error('Fetch messages error:', err);
      } finally {
        setIsFetching(false);
      }
    },
    [conversationId, fetchMessagesList, isGroupChat, setMessages, hasMore, isFetching, filteredMessages]
  );

  // Initial fetch
  useEffect(() => {
    if (conversationId) {
      fetchMessagesForPage(1, true);
    }
  }, [conversationId, fetchMessagesForPage]);

  // Socket for new messages
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (newMessage) => {
      if (
        (isGroupChat && newMessage.group_id === conversationId) ||
        (!isGroupChat && newMessage.conversation_id === conversationId)
      ) {
        setMessages((prev) => [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        if (isNearBottomRef.current && listRef.current) {
          setTimeout(() => {
            listRef.current.scrollToItem(filteredMessages.length, 'end');
          }, 100);
        }
      }
    });

    return () => socket.off('new_message');
  }, [socket, isGroupChat, conversationId, setMessages, filteredMessages]);

  // Send message
  const handleSendMessage = useCallback(
    async (messageData) => {
      if (!conversationId) {
        setError('No conversation selected.');
        return;
      }

      const tempMessageId = `temp-${Date.now()}`;
      const finalMessageData = {
        ...messageData,
        conversationId,
        replyTo: replyToMessage?.message_id || undefined,
        selectedText: replyToMessage?.selectedText || undefined,
      };

      try {
        const tempMessage = {
          ...finalMessageData,
          message_id: tempMessageId,
          sender_id: currentUserId,
          timestamp: new Date().toISOString(),
          is_read: false,
          delivery_status: 'pending',
        };
        setMessages((prev) => [...prev, tempMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));

        const sentMessage = await onSendMediaMessage(finalMessageData);

        setMessages((prev) =>
          prev
            .filter((m) => m.message_id !== tempMessageId)
            .concat(sentMessage)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );

        setReplyToMessage(null);
        if (isNearBottomRef.current && listRef.current) {
          setTimeout(() => {
            listRef.current.scrollToItem(filteredMessages.length, 'end');
          }, 100);
        }
      } catch (err) {
        setError('Failed to send message.');
        setMessages((prev) => prev.filter((m) => m.message_id !== tempMessageId));
        console.error('Send message error:', err);
      }
    },
    [conversationId, currentUserId, onSendMediaMessage, setMessages, replyToMessage, filteredMessages]
  );

  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      fetchMessagesForPage(page);
    }
  }, [fetchMessagesForPage, isFetching, hasMore, page]);

  // Save settings
  const handleSettingsSave = useCallback((newSettings) => {
    setChatSettings(newSettings);
    setSettingsOpen(false);
  }, []);

  if (!conversation || !conversationId) {
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
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
      }}
    >
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
            {error}
          </Alert>
        </motion.div>
      )}
      <ChatHeader
        recipient={conversation}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
        socket={socket}
      />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <AutoSizer>
          {({ height, width }) => (
            <VariableSizeList
              ref={listRef}
              height={height}
              width={width}
              itemCount={filteredMessages.length}
              itemSize={(index) => {
                const message = filteredMessages[index];
                if (!message) return 120;
                if (message.media?.length) return 300;
                if (message.poll) return 200;
                return Math.max(120, 120 + Math.floor((message.content?.length || 0) / 50) * 20);
              }}
              overscanCount={5}
            >
              {({ index, style }) => (
                <div style={style}>
                  <ChatMessages
                    messages={[filteredMessages[index]]}
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
                    showDate={index === 0 || !isSameDay(
                      new Date(filteredMessages[index].timestamp),
                      new Date(filteredMessages[index - 1]?.timestamp)
                    )}
                    socket={socket}
                  />
                </div>
              )}
            </VariableSizeList>
          )}
        </AutoSizer>
        {isFetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
      <ChatFooter
        conversationId={conversationId}
        recipient={conversation}
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
      replyTo: PropTypes.string,
      selectedText: PropTypes.string,
      pinned: PropTypes.bool,
      reactions: PropTypes.array,
    })
  ).isRequired,
  setMessages: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  onCreatePoll: PropTypes.func.isRequired,
  onVotePoll: PropTypes.func.isRequired,
  onPinMessage: PropTypes.func.isRequired,
  onUnpinMessage: PropTypes.func.isRequired,
  socket: PropTypes.object,
};

export default React.memo(ChatView);