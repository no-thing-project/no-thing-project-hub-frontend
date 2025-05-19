// src/components/ChatView.jsx
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

  // Filter and sort messages
  const filteredMessages = useMemo(() => {
    if (!conversationId) return [];
    return Array.from(
      new Map(
        (messages || []).filter((m) => m?.message_id && m.conversation_id === conversationId).map((m) => [m.message_id, m])
      ).values()
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, conversationId]);

  // Fetch messages for pagination
  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || isFetching || !hasMore) return;
      setIsFetching(true);
      setError(null);
      try {
        const data = await loadMessages(conversationId, { page: targetPage, limit: 20 });
        setHasMore(data.messages.length === 20);
        setPage(targetPage + 1);
        if (reset) setMessages(data.messages);
      } catch (err) {
        const errorMsg = err.message || 'Failed to load messages';
        setError(errorMsg);
        showNotification(errorMsg, 'error');
      } finally {
        setIsFetching(false);
      }
    },
    [conversationId, loadMessages, hasMore, isFetching, setMessages, showNotification]
  );

  // Initial message fetch
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      fetchMessagesForPage(1, true);
    }
  }, [conversationId, fetchMessagesForPage, setMessages]);

  // Real-time message updates
  useEffect(() => {
    if (!socket || !conversationId) return;
    const handleNewMessage = (newMessage) => {
      if (newMessage?.conversation_id !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === newMessage.message_id)) return prev;
        return [...prev, newMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      if (newMessage.sender_id !== currentUserId) {
        markRead(newMessage.message_id).catch(() =>
          showNotification('Failed to mark message as read', 'error')
        );
      }
    };
    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, conversationId, currentUserId, markRead, setMessages, showNotification]);

  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) fetchMessagesForPage(page);
  }, [fetchMessagesForPage, isFetching, hasMore, page]);

  // Save chat settings
  const handleSettingsSave = useCallback((newSettings) => {
    setChatSettings(newSettings);
    setSettingsOpen(false);
  }, []);

  // Calculate message item size
  const getItemSize = useCallback(
    (index) => {
      const message = filteredMessages[index];
      if (!message) return 120;
      let baseSize = 120;
      if (message.media?.length) baseSize += 180;
      if (message.type === 'poll') baseSize += 100;
      if (message.reply_to) baseSize += 60;
      if (message.content) baseSize += Math.floor(message.content.length / 50) * 20;
      return Math.max(120, baseSize);
    },
    [filteredMessages]
  );

  // Render message item
  const renderItem = useCallback(
    ({ index, style }) => {
      const message = filteredMessages[index];
      return (
        <div style={style} key={message.message_id}>
          <ChatMessages
            messages={[message]}
            currentUserId={currentUserId}
            recipient={conversation}
            onDeleteMessage={deleteMsg}
            onEditMessage={editMsg}
            onMarkRead={markRead}
            onForwardMessage={onForwardMessage}
            isFetching={isFetching}
            hasMore={hasMore}
            loadMoreMessages={handleLoadMore}
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
            showDate={
              index === 0 ||
              !isSameDay(new Date(message.timestamp), new Date(filteredMessages[index - 1]?.timestamp))
            }
            socket={socket}
          />
        </div>
      );
    },
    [
      filteredMessages,
      currentUserId,
      conversation,
      deleteMsg,
      editMsg,
      markRead,
      onForwardMessage,
      isFetching,
      hasMore,
      handleLoadMore,
      chatSettings,
      setReplyToMessage,
      isGroupChat,
      friends,
      token,
      addMessageReaction,
      createNewPoll,
      voteInPoll,
      pinMsg,
      unpinMsg,
      socket,
    ]
  );

  // Auto-scroll to bottom
  useEffect(() => {
    if (filteredMessages.length && listRef.current && isNearBottomRef.current) {
      listRef.current.scrollToItem(filteredMessages.length - 1, 'end');
    }
  }, [filteredMessages]);

  // Track scroll position
  useEffect(() => {
    const outerRef = listRef.current?._outerRef;
    if (!outerRef) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = outerRef;
      isNearBottomRef.current = scrollTop + clientHeight >= scrollHeight - 100;
      if (scrollTop < 100 && hasMore && !isFetching) handleLoadMore();
    };
    outerRef.addEventListener('scroll', handleScroll);
    return () => outerRef.removeEventListener('scroll', handleScroll);
  }, [hasMore, isFetching, handleLoadMore]);

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
            <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
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
      <Box sx={{ flex: 1, overflow: 'hidden' }} aria-label="Chat Messages">
        <AutoSizer>
          {({ height, width }) => (
            <VariableSizeList
              key={conversationId}
              ref={listRef}
              height={height}
              width={width}
              itemCount={filteredMessages.length}
              itemSize={getItemSize}
              overscanCount={10}
            >
              {renderItem}
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
      timestamp: PropTypes.string.isRequired,
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