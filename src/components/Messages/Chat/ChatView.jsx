import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Alert, Typography, useTheme, CircularProgress, Button } from '@mui/material';
import { VariableSizeList } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import AutoSizer from 'react-virtualized-auto-sizer';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatFooter from './ChatFooter';
import ChatSettingsModal from '../ChatSettingsModal';
import { isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

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
  const socketListenerId = useRef(`chatview-${uuidv4()}`);
  const conversationId = conversation?.conversation_id || null;
  const isGroupChat = conversation?.type === 'group' || false;

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filteredMessages = useMemo(() => {
    if (!conversationId) return [];
    const validMessages = (messages || []).filter(
      (m) => m?.message_id && (isGroupChat ? m.group_id === conversationId : m.conversation_id === conversationId)
    );
    return Array.from(
      new Map(validMessages.map((m) => [m.message_id, m])).values()
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, conversationId, isGroupChat]);

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
          return Array.from(
            new Map(combined.map((m) => [m.message_id, m])).values()
          ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        setHasMore(newMessages.length === 20);
        setPage(targetPage + 1);
      } catch (err) {
        console.error(`[ChatView] Fetch messages error: ${err.message}`);
        setError('Failed to load messages.');
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
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      console.log('[ChatView] Received new message:', newMessage);
      if (
        !newMessage?.message_id ||
        ((isGroupChat && newMessage.group_id !== conversationId) ||
         (!isGroupChat && newMessage.conversation_id !== conversationId))
      ) {
        return;
      }

      setMessages((prev) => {
        if (
          prev.some(
            (m) =>
              m.message_id === newMessage.message_id ||
              m.client_message_id === newMessage.client_message_id
          )
        ) {
          return prev;
        }
        return [...prev, newMessage].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
    };

    socket.on(`new_message_${socketListenerId.current}`, handleNewMessage);
    return () => {
      socket.off(`new_message_${socketListenerId.current}`, handleNewMessage);
    };
  }, [socket, isGroupChat, conversationId, setMessages]);

  const handleSendMessage = useCallback(
    async (messageData) => {
      if (!conversationId || (!messageData.content?.trim() && !messageData.media?.length)) {
        return false;
      }

      const clientMessageId = `client-${uuidv4()}`;
      const finalMessageData = {
        conversationId: String(conversationId),
        content: messageData.content?.trim(),
        media: messageData.media || [],
        replyTo: messageData.replyTo || undefined,
        selectedText: messageData.selectedText || undefined,
        isTextReply: messageData.isTextReply || false,
        thread_id: messageData.thread_id || null,
        client_message_id: clientMessageId,
      };

      const tempMessage = {
        ...finalMessageData,
        message_id: clientMessageId,
        sender_id: currentUserId,
        timestamp: new Date().toISOString(),
        is_read: false,
        delivery_status: 'pending',
      };

      setMessages((prev) => {
        const updated = prev.filter((m) => m.client_message_id !== clientMessageId);
        return [...updated, tempMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

      try {
        const sentMessage = await onSendMediaMessage(
          finalMessageData.conversationId,
          finalMessageData.content,
          finalMessageData.media,
          finalMessageData.replyTo
        );

        if (!sentMessage) throw new Error('Empty message response from server');

        setMessages((prev) =>
          prev
            .map((m) =>
              m.client_message_id === clientMessageId
                ? { ...sentMessage, message_id: sentMessage.message_id || clientMessageId }
                : m
            )
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        );

        setReplyToMessage(null);
        return true;
      } catch (err) {
        console.error(`[ChatView] Send message error: ${err.message}`);
        setError('Failed to send message.');
        setMessages((prev) => prev.filter((m) => m.client_message_id !== clientMessageId));
        return false;
      }
    },
    [conversationId, currentUserId, onSendMediaMessage, setMessages, setReplyToMessage]
  );

  const handleRetrySend = useCallback(
    async (messageData) => {
      try {
        await handleSendMessage(messageData);
        setError(null);
      } catch (err) {
        console.error(`[ChatView] Retry send error: ${err.message}`);
        setError('Failed to retry sending message.');
      }
    },
    [handleSendMessage]
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

  const itemSize = useCallback(
    (index) => {
      const message = filteredMessages[index];
      if (!message) return 120;
      let baseSize = 120;
      if (message.media?.length) baseSize += 180;
      if (message.poll) baseSize += 100;
      if (message.replyTo) baseSize += 60;
      if (message.content) baseSize += Math.floor((message.content.length || 0) / 50) * 20;
      return Math.max(120, baseSize);
    },
    [filteredMessages]
  );

  const renderItem = useCallback(
    ({ index, style }) => {
      return (
        <div style={style} key={filteredMessages[index].message_id}>
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
      );
    },
    [
      filteredMessages,
      currentUserId,
      conversation,
      onDeleteMessage,
      onEditMessage,
      handleSendMessage,
      onMarkRead,
      onForwardMessage,
      isFetching,
      hasMore,
      handleLoadMore,
      chatSettings,
      setReplyToMessage,
      isGroupChat,
      friends,
      token,
      onAddReaction,
      onCreatePoll,
      onVotePoll,
      onPinMessage,
      onUnpinMessage,
      socket,
    ]
  );

  useEffect(() => {
    if (filteredMessages.length > 0 && listRef.current && isNearBottomRef.current) {
      setTimeout(() => {
        listRef.current.scrollToItem(filteredMessages.length - 1, 'end');
      }, 100);
    }
  }, [filteredMessages]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = list._outerRef;
      isNearBottomRef.current = scrollTop + clientHeight >= scrollHeight - 100;
    };

    list._outerRef.addEventListener('scroll', handleScroll);
    return () => list._outerRef.removeEventListener('scroll', handleScroll);
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
      aria-label="Chat View 2"
    >
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
            {error}
            {error.includes('Failed to send') && (
              <Button size="small" onClick={() => handleRetrySend(replyToMessage)}>
                Retry
              </Button>
            )}
          </Alert>
        </motion.div>
      )}
      <ChatHeader
        recipient={conversation}
        isGroupChat={isGroupChat}
        onSettingsOpen={() => setSettingsOpen(true)}
        socket={socket}
        friends={friends}
        currentUserId={currentUserId}
      />
      <Box sx={{ flex: 1, overflow: 'hidden' }}
      aria-label="Chat Messages"
      >
        <AutoSizer>
          {({ height, width }) => (
            <VariableSizeList
              key={conversationId}
              ref={listRef}
              height={height}
              width={width}
              itemCount={filteredMessages.length}
              itemSize={itemSize}
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
        socket={socket}
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
      client_message_id: PropTypes.string,
      isTextReply: PropTypes.bool,
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