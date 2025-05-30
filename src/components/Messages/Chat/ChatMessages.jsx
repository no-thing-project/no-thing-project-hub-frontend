import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  useTheme,
  Skeleton,
  Button,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownward } from '@mui/icons-material';
import MessageBubble from '../MessageBubble';
import { format, isSameDay, parseISO } from 'date-fns';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

const PinnedMessages = React.memo(({ pinnedMessages, theme, setHighlightedMessage, currentUserId, isLoading }) => {
  if (isLoading) {
    return (
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
        aria-label="Pinned messages loading"
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          Pinned Messages
        </Typography>
        {[...Array(2)].map((_, i) => (
          <Skeleton key={`pinned-skeleton-${i}`} variant="text" width="80%" sx={{ mt: 0.5 }} />
        ))}
      </Box>
    );
  }

  return (
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
      aria-label="Pinned messages"
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        Pinned Messages
      </Typography>
      {pinnedMessages.length === 0 ? (
        <Typography variant="body2" sx={{ mt: 0.5, color: theme.palette.text.secondary }}>
          No pinned messages
        </Typography>
      ) : (
        pinnedMessages.map((msg) => {
          const content = msg.content || (
            Array.isArray(msg.content_per_user) && msg.content_per_user.length > 0
              ? msg.content_per_user.find(c => c.user_id === currentUserId)?.encryptedContent || msg.content_per_user[0]?.encryptedContent || 'Media message'
              : 'Media message'
          );
          console.log('[PinnedMessages] Rendering pinned message:', { message_id: msg.message_id, content });
          return (
            <Typography
              key={msg.message_id}
              variant="body2"
              sx={{
                display: 'block',
                mt: 0.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: theme.palette.action.hover }
              }}
              onClick={() => {
                const element = document.getElementById(`message-${msg.message_id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  setHighlightedMessage(msg.message_id);
                  setTimeout(() => setHighlightedMessage(null), 3000);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target.click()}
              aria-label={`Pinned message: ${content.slice(0, 50)}`}
            >
              {content.length > 50 ? `${content.slice(0, 50)}...` : content}
            </Typography>
          );
        })
      )}
    </Box>
  );
});

PinnedMessages.propTypes = {
  pinnedMessages: PropTypes.arrayOf(
    PropTypes.shape({
      message_id: PropTypes.string.isRequired,
      content: PropTypes.string,
      content_per_user: PropTypes.arrayOf(
        PropTypes.shape({
          user_id: PropTypes.string,
          encryptedContent: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  theme: PropTypes.object.isRequired,
  setHighlightedMessage: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

const getBackgroundStyle = (chatBackground) => ({
  lightGray: { backgroundColor: '#f5f5f5' },
  dark: { backgroundColor: '#333', color: 'white' },
  nature: { backgroundImage: "url('/nature-bg.jpg')", backgroundSize: 'cover' },
  default: { backgroundColor: 'white' },
}[chatBackground] || { backgroundColor: 'white' });

const ChatMessages = ({
  messages,
  currentUserId,
  conversationId,
  recipient,
  onDeleteMessage,
  onEditMessage,
  onSendMediaMessage,
  onMarkRead,
  onForwardMessage,
  loadMessages,
  setMessages,
  showNotification,
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
  chatSettings,
  showDate,
  socket,
  searchQuery = '',
}) => {
  const theme = useTheme();
  const chatContainerRef = useRef(null);
  const lastMessageRef = useRef(null);
  const topSentinelRef = useRef(null);
  const firstVisibleMessageRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({ anchorEl: null, selectedText: '', message: null });
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const retryCountRef = useRef(0);
  const hasFetchedInitial = useRef(false);
  const maxRetries = 3;

  const normalizedMessages = useMemo(() => {
    if (!conversationId) return [];
    const validMessages = (Array.isArray(messages) ? messages : [])
      .map((m) => {
        const content = m.content || (
          Array.isArray(m.content_per_user) && m.content_per_user.length > 0
            ? m.content_per_user.find(c => c.user_id === currentUserId)?.encryptedContent || m.content_per_user[0]?.encryptedContent || 'Media message'
            : 'Media message'
        );
        return {
          ...m,
          conversation_id: m.conversation_id || conversationId,
          content,
          timestamp: m.timestamp && !isNaN(Date.parse(m.timestamp)) ? m.timestamp : new Date().toISOString(),
        };
      })
      .filter((m) => {
        const isValid = m?.message_id && m.conversation_id === conversationId;
        if (!isValid) {
          console.warn('[ChatMessages] Filtered out invalid message:', m);
        }
        return isValid;
      });
    const sortedMessages = validMessages.sort((a, b) => {
      const aTime = new Date(a.timestamp);
      const bTime = new Date(b.timestamp);
      return aTime - bTime;
    });
    console.log('[ChatMessages] Normalized messages:', sortedMessages.length);
    return sortedMessages;
  }, [messages, conversationId, currentUserId]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    normalizedMessages.forEach((msg, index) => {
      const msgDate = parseISO(msg.timestamp);
      if (!currentDate || !isSameDay(msgDate, currentDate)) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [] });
      }
      groups[groups.length - 1].messages.push({ ...msg, index });
    });
    return groups;
  }, [normalizedMessages]);

  const pinnedMessages = useMemo(() => {
    return normalizedMessages.filter((m) => m?.pinned);
  }, [normalizedMessages]);

  const backgroundStyle = useMemo(() => getBackgroundStyle(chatBackground), [chatBackground]);

  const getSenderName = useCallback(
    (senderId) => {
      if (senderId === currentUserId) return 'You';
      const friend = friends.find((f) => f.anonymous_id === senderId);
      return friend?.username || 'Unknown';
    },
    [currentUserId, friends]
  );

  const fetchMessagesForPage = useCallback(
    async (targetPage, reset = false) => {
      if (!conversationId || isFetching || (!reset && !hasMore)) {
        console.log('[ChatMessages] Skipping fetch:', { conversationId, isFetching, hasMore, reset, targetPage });
        return;
      }
      if (retryCountRef.current >= maxRetries) {
        setError('Max retry attempts reached. Please try again later.');
        console.error('[ChatMessages] Max retries reached');
        return;
      }
      setIsFetching(true);
      setError(null);
      try {
        const data = await loadMessages(conversationId, { page: targetPage, limit: 20 });
        console.log('[ChatMessages] Raw API response:', data);
        if (!Array.isArray(data.messages)) {
          throw new Error('Invalid messages format from API');
        }
        setMessages((prev) => {
          const newMessages = reset ? data.messages : [...data.messages, ...prev];
          const uniqueMessages = Array.from(
            new Map(newMessages.map((m) => [m.message_id, m])).values()
          );
          const sortedMessages = uniqueMessages.sort((a, b) => {
            const aTime = new Date(a.timestamp);
            const bTime = new Date(b.timestamp);
            return aTime - bTime;
          });
          console.log('[ChatMessages] Updated messages:', sortedMessages.length);
          return [...sortedMessages];
        });
        setHasMore(data.messages.length >= 20);
        setPage(targetPage + 1);
        retryCountRef.current = 0;
      } catch (err) {
        retryCountRef.current += 1;
        const delay = Math.pow(2, retryCountRef.current) * 1000;
        const errorMsg = `Failed to load messages. Retrying in ${delay/1000}s...`;
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        console.error('[ChatMessages] Fetch error:', err);
        setTimeout(() => fetchMessagesForPage(targetPage, reset), delay);
      } finally {
        setIsFetching(false);
      }
    },
    [conversationId, loadMessages, hasMore, isFetching, setMessages, showNotification]
  );

  useEffect(() => {
    if (conversationId && !hasFetchedInitial.current) {
      console.log('[ChatMessages] Initiating initial fetch for conversation:', conversationId);
      hasFetchedInitial.current = true;
      setPage(1);
      setHasMore(true);
      retryCountRef.current = 0;
      fetchMessagesForPage(1, false);
    }
  }, [conversationId, fetchMessagesForPage]);

  const debouncedHandleNewMessage = useMemo(
    () =>
      debounce((newMessage) => {
        if (newMessage?.conversation_id !== conversationId || !newMessage?.message_id) {
          console.warn('[ChatMessages] Invalid or irrelevant new message:', newMessage);
          return;
        }
        console.log('[ChatMessages] Received new message:', newMessage);
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === newMessage.message_id)) {
            console.log('[ChatMessages] Message already exists:', newMessage.message_id);
            return prev;
          }
          const transformedMessage = {
            ...newMessage,
            conversation_id: newMessage.conversation_id || conversationId,
            content: newMessage.content || (
              Array.isArray(newMessage.content_per_user) && newMessage.content_per_user.length > 0
                ? newMessage.content_per_user.find(c => c.user_id === currentUserId)?.encryptedContent || newMessage.content_per_user[0]?.encryptedContent || 'Media message'
                : 'Media message'
            ),
            timestamp: newMessage.timestamp && !isNaN(Date.parse(newMessage.timestamp)) ? newMessage.timestamp : new Date().toISOString(),
          };
          const updatedMessages = [...prev, transformedMessage].sort((a, b) => {
            const aTime = new Date(a.timestamp);
            const bTime = new Date(b.timestamp);
            return aTime - bTime;
          });
          console.log('[ChatMessages] Updated messages with new message:', updatedMessages.length);
          return updatedMessages;
        });
        if (newMessage.sender_id !== currentUserId) {
          onMarkRead(newMessage.message_id).catch(() =>
            showNotification('Failed to mark message as read', 'error')
          );
        }
      }, 300),
    [conversationId, currentUserId, setMessages, onMarkRead, showNotification]
  );

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.on('newMessage', debouncedHandleNewMessage);
    return () => {
      socket.off('newMessage', debouncedHandleNewMessage);
      debouncedHandleNewMessage.cancel();
    };
  }, [socket, conversationId, debouncedHandleNewMessage]);

  const debouncedLoadMore = useCallback(
    debounce(() => {
      if (hasMore && !isFetching) {
        console.log('[ChatMessages] Triggering loadMoreMessages, page:', page);
        fetchMessagesForPage(page);
      } else {
        console.log('[ChatMessages] Load more skipped:', { hasMore, isFetching });
      }
    }, 500),
    [hasMore, isFetching, fetchMessagesForPage, page]
  );

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = throttle(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsUserScrolling(!isNearBottom);
      setShowJumpToBottom(!isNearBottom && scrollTop > 200);
      console.log('[ChatMessages] Scroll position:', { scrollTop, scrollHeight, clientHeight, isNearBottom });
    }, 100);

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, []);

  useEffect(() => {
    if (!chatContainerRef.current || isFetching || isUserScrolling) return;

    const scrollToBottom = () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        console.log('[ChatMessages] Scrolled to latest message');
      } else {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        console.log('[ChatMessages] Scrolled to bottom of container');
      }
    };

    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [normalizedMessages, isFetching, isUserScrolling]);

  useEffect(() => {
    if (!chatContainerRef.current || !hasMore || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          console.log('[ChatMessages] Top sentinel intersected, triggering loadMoreMessages');
          const container = chatContainerRef.current;
          const firstVisible = firstVisibleMessageRef.current || topSentinelRef.current;
          const offsetTop = firstVisible ? firstVisible.offsetTop : 0;
          debouncedLoadMore();
          requestAnimationFrame(() => {
            if (firstVisible) {
              container.scrollTop = firstVisible.offsetTop - (offsetTop - container.scrollTop);
              console.log('[ChatMessages] Restored scroll position:', { scrollTop: container.scrollTop, offsetTop });
            }
          });
        }
      },
      { root: chatContainerRef.current, threshold: 0.5 }
    );

    const topElement = topSentinelRef.current;
    if (topElement) {
      observer.observe(topElement);
      console.log('[ChatMessages] Observing top sentinel');
    } else {
      console.warn('[ChatMessages] Top sentinel not found');
    }

    return () => {
      if (topElement) {
        observer.unobserve(topElement);
        console.log('[ChatMessages] Unobserved top sentinel');
      }
      debouncedLoadMore.cancel();
    };
  }, [hasMore, isFetching, debouncedLoadMore]);

  useEffect(() => {
    const unreadMessages = normalizedMessages.filter(
      (m) => m?.receiver_id === currentUserId && !m.is_read
    );
    for (const msg of unreadMessages) {
      if (msg?.message_id) {
        onMarkRead(msg.message_id).catch(() =>
          setError('Failed to mark message as read')
        );
      }
    }
  }, [normalizedMessages, currentUserId, onMarkRead]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleContextMenu = useCallback((event, message) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText || message) {
      event.preventDefault();
      setContextMenu({ anchorEl: event.currentTarget, selectedText, message });
    }
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu({ anchorEl: null, selectedText: '', message: null });
  }, []);

  const handleReplyText = useCallback(() => {
    setReplyToMessage({
      ...contextMenu.message,
      selectedText: contextMenu.selectedText || null,
      isTextReply: !!contextMenu.selectedText,
    });
    handleContextMenuClose();
  }, [contextMenu.message, contextMenu.selectedText, setReplyToMessage]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadMessages = normalizedMessages.filter(
      (m) => m?.receiver_id === currentUserId && !m.is_read
    );
    try {
      await Promise.all(
        unreadMessages.map((msg) => msg?.message_id && onMarkRead(msg.message_id))
      );
      showNotification('All messages marked as read', 'success');
    } catch (err) {
      setError('Failed to mark all messages as read');
    }
  }, [normalizedMessages, currentUserId, onMarkRead, showNotification]);

  const handleRetrySend = useCallback(
    async (message) => {
      try {
        await onSendMediaMessage(message);
        setError(null);
        showNotification('Message sent successfully', 'success');
      } catch (err) {
        setError('Failed to retry sending message');
      }
    },
    [onSendMediaMessage, showNotification]
  );

  const handleJumpToBottom = useCallback(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      setIsUserScrolling(false);
      setShowJumpToBottom(false);
      console.log('[ChatMessages] Jumped to bottom');
    }
  }, []);

  return (
    <Box
      ref={chatContainerRef}
      sx={{
        flex: 1,
        minHeight: '100%',
        height: '0', // Ensure container stretches to fit content
        overflowY: 'auto',
        p: { xs: 1, sm: 2, md: 3 },
        ...backgroundStyle,
        width: '100%',
        boxSizing: 'border-box',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="region"
      aria-label="Chat messages"
    >
      <div ref={topSentinelRef} style={{ height: '1px', flexShrink: 0 }} aria-hidden="true" />
      {isFetching && normalizedMessages.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, flexShrink: 0 }}>
          <CircularProgress size={24} aria-label="Loading older messages" />
        </Box>
      )}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 2, mx: { xs: 1, sm: 2 }, flexShrink: 0 }}
              action={
                error.includes('Failed to load') ? (
                  <Button
                    size="small"
                    onClick={() => {
                      retryCountRef.current = 0;
                      fetchMessagesForPage(page, false);
                    }}
                  >
                    Retry
                  </Button>
                ) : error.includes('Failed to send') ? (
                  <Button
                    size="small"
                    onClick={() => handleRetrySend(contextMenu.message)}
                  >
                    Retry
                  </Button>
                ) : null
              }
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <PinnedMessages
        pinnedMessages={pinnedMessages}
        theme={theme}
        setHighlightedMessage={setHighlightedMessage}
        currentUserId={currentUserId}
        isLoading={isFetching && normalizedMessages.length === 0}
      />
      {isGroupChat && normalizedMessages.some((m) => m?.receiver_id === currentUserId && !m.is_read) && (
        <Box sx={{ textAlign: 'center', mb: 2, mx: { xs: 1, sm: 2 }, flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={handleMarkAllRead}
            aria-label="Mark all messages as read"
            size="small"
          >
            Mark All as Read
          </Button>
        </Box>
      )}
      {isFetching && normalizedMessages.length === 0 ? (
        <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, flex: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={`skeleton-${i}`}
              sx={{
                display: 'flex',
                justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
                mb: 2,
                maxWidth: { xs: '90%', sm: '80%' },
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height={40}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          ))}
        </Box>
      ) : normalizedMessages.length > 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence>
            {groupedMessages.map((group) => (
              <React.Fragment key={format(group.date, 'yyyy-MM-dd')}>
                {showDate && (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 1,
                      mb: 1,
                      mx: { xs: 1, sm: 2 },
                      flexShrink: 0,
                    }}
                    aria-label="Message date"
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary, fontWeight: 'medium' }}
                    >
                      {format(group.date, 'MMMM d, yyyy')}
                    </Typography>
                  </Box>
                )}
                {group.messages.map(({ index, ...msg }) => {
                  const isLastMessage = index === normalizedMessages.length - 1;
                  const isSearchMatch = searchQuery && msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
                  console.log('[ChatMessages] Rendering message:', { message_id: msg.message_id, content: msg.content });
                  return (
                    <motion.div
                      key={msg.message_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      ref={index === 0 ? firstVisibleMessageRef : isLastMessage ? lastMessageRef : null}
                      sx={{ maxWidth: { xs: '95%', sm: '80%', md: '70%' }, flexShrink: 0 }}
                    >
                      <MessageBubble
                        message={msg}
                        isSentByCurrentUser={msg.sender_id === currentUserId}
                        onDelete={onDeleteMessage}
                        onEdit={onEditMessage}
                        onSendMediaMessage={onSendMediaMessage}
                        currentUserId={currentUserId}
                        recipient={recipient}
                        messages={normalizedMessages}
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
                        chatSettings={chatSettings}
                        isHighlighted={highlightedMessage === msg.message_id || isSearchMatch}
                        setHighlightedMessage={setHighlightedMessage}
                        getSenderName={getSenderName}
                      />
                    </motion.div>
                  );
                })}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', mt: 4, px: { xs: 1, sm: 2 }, flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            aria-label="No messages"
          >
            No messages yet. Start chatting!
          </Typography>
          {normalizedMessages.length === 0 && !isFetching && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1 }}
              aria-label="Debug info"
            >
              Debug: Messages loaded but none are valid. Check console logs for details.
            </Typography>
          )}
        </Box>
      )}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 3,
            }}
          >
            <IconButton
              onClick={handleJumpToBottom}
              color="primary"
              aria-label="Jump to latest message"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              <ArrowDownward />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
      <Menu
        anchorEl={contextMenu.anchorEl}
        open={Boolean(contextMenu.anchorEl)}
        onClose={handleContextMenuClose}
        slotProps={{
          root: {
            style: {
              pointerEvents: 'auto',
              touchAction: 'none',
            },
          },
        }}
      >
        <MenuItem onClick={handleReplyText}>
          {contextMenu.selectedText ? 'Reply to Selected Text' : 'Reply to Message'}
        </MenuItem>
        <MenuItem onClick={() => {
          onForwardMessage(contextMenu.message);
          handleContextMenuClose();
        }}>
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
      content_per_user: PropTypes.arrayOf(
        PropTypes.shape({
          user_id: PropTypes.string,
          encryptedContent: PropTypes.string,
        })
      ),
      timestamp: PropTypes.string,
      is_read: PropTypes.bool,
      sender_id: PropTypes.string.isRequired,
      receiver_id: PropTypes.string,
      media: PropTypes.array,
      replyTo: PropTypes.string,
      selectedText: PropTypes.string,
      pinned: PropTypes.bool,
      delivery_status: PropTypes.string,
      reactions: PropTypes.array,
      thread_id: PropTypes.string,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  conversationId: PropTypes.string,
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
  loadMessages: PropTypes.func.isRequired,
  setMessages: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
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
  chatSettings: PropTypes.shape({
    videoShape: PropTypes.string,
    fontSize: PropTypes.string,
    fontStyle: PropTypes.string,
  }).isRequired,
  showDate: PropTypes.bool.isRequired,
  socket: PropTypes.object,
  searchQuery: PropTypes.string,
};

export default React.memo(ChatMessages);