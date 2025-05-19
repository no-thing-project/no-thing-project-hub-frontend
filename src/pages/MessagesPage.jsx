import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Snackbar,
  Typography,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { GroupAdd } from '@mui/icons-material';
import { throttle } from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useMessages from '../hooks/useMessages';
import useConversations from '../hooks/useConversations';
import useSocial from '../hooks/useSocial';
import { useNotification } from '../context/NotificationContext';
import ProfileHeader from '../components/Headers/ProfileHeader';
import ConversationsList from '../components/Messages/Conversations/ConversationsList';
import ChatView from '../components/Messages/Chat/ChatView';
import GroupChatModal from '../components/Messages/GroupChatModal';
import ForwardMessageModal from '../components/Messages/ForwardMessageModal';
import { connectSocket, getSocket } from '../api/socketClient';
import { MESSAGE_CONSTANTS, SOCKET_EVENTS } from '../constants/constants';

// Localization
const getLocalizedMessage = (key, params = {}) => {
  const messages = {
    en: {
      [MESSAGE_CONSTANTS.ERRORS.NO_CONVERSATION]: 'No conversation selected.',
      [MESSAGE_CONSTANTS.SUCCESS.MESSAGE_SENT]: 'Message sent successfully.',
      [MESSAGE_CONSTANTS.ERRORS.MESSAGE_SEND]: 'Failed to send message.',
      [MESSAGE_CONSTANTS.SUCCESS.GROUP_CREATED]: 'Group created successfully.',
      [MESSAGE_CONSTANTS.ERRORS.GROUP_CREATE]: 'Failed to create group.',
      [MESSAGE_CONSTANTS.SUCCESS.MESSAGE_FORWARDED]: 'Message forwarded successfully.',
      [MESSAGE_CONSTANTS.ERRORS.MESSAGE_FORWARD]: 'Failed to forward message.',
      [MESSAGE_CONSTANTS.ERRORS.SOCKET_CONNECTION]: 'Failed to connect to messaging service.',
      [MESSAGE_CONSTANTS.ERRORS.FRIENDS_LOAD]: 'Failed to load friends.',
      [MESSAGE_CONSTANTS.ERRORS.GROUP_VALIDATION]: 'Group name and at least one member are required.',
      [MESSAGE_CONSTANTS.ERRORS.LOAD_MORE]: 'Failed to load more conversations.',
      [MESSAGE_CONSTANTS.ERRORS.CONVERSATION_LOAD]: 'Failed to load conversations.',
    },
  };
  const lang = 'en';
  return messages[lang][key] || key;
};

const MemoizedConversationsList = React.memo(ConversationsList);
const MemoizedChatView = React.memo(ChatView);
const MemoizedGroupChatModal = React.memo(GroupChatModal);
const MemoizedForwardMessageModal = React.memo(ForwardMessageModal);

const MessagesPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    loadConversations,
    createNewConversation,
    deleteConv,
    archiveConv,
    unarchiveConv,
    muteConv,
    unmuteConv,
    pinConv,
    unpinConv,
    getOrCreateConversation,
    updateLastMessage,
    loading: convLoading,
    error: convError,
    clearError: clearConvError,
  } = useConversations({ token, userId: authData?.anonymous_id, onLogout: handleLogout, navigate });
  const {
    messages,
    setMessages,
    loadMessages,
    sendNewMessage,
    sendTypingIndicator,
    createNewPoll,
    voteInPoll,
    addMessageReaction,
    markRead,
    deleteMsg,
    editMsg,
    searchMsgs,
    pinMsg,
    unpinMsg,
    loading: messagesLoading,
    error: messagesError,
    clearError: clearMessagesError,
  } = useMessages({
    token,
    userId: authData?.anonymous_id,
    onLogout: handleLogout,
    navigate,
    updateLastMessage,
  });
  const { friends, getFriends } = useSocial(token, handleLogout, navigate);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [friendsFetched, setFriendsFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const socketRef = useRef(null);

  // Initialize socket.io
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    try {
      connectSocket(token);
      socketRef.current = getSocket();
    } catch (err) {
      showNotification(getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.SOCKET_CONNECTION), 'error');
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, isAuthenticated, showNotification]);

  // Handle real-time updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !authData?.anonymous_id) return;

    const handleNewMessage = throttle((message) => {
      if (!message?.message_id || !message?.conversation_id) {
        console.warn('Invalid message received:', message);
        return;
      }
      setMessages((prev) => {
        const validPrev = Array.isArray(prev) ? prev : [];
        if (validPrev.some((m) => m.message_id === message.message_id)) {
          return validPrev;
        }
        return [...validPrev, message].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
      });
      // Update conversation last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversation_id === message.conversation_id
            ? { ...conv, lastMessage: message }
            : conv
        )
      );
    }, MESSAGE_CONSTANTS.THROTTLE_MS);

    const handleConversationCreated = (newConv) => {
      if (!newConv?.conversation_id) {
        console.warn('Invalid conversation received:', newConv);
        return;
      }
      setConversations((prev) => {
        if (prev.some((c) => c.conversation_id === newConv.conversation_id)) {
          return prev;
        }
        return [newConv, ...prev];
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);
    };
  }, [socketRef, setMessages, setConversations, authData?.anonymous_id]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) {
      clearNotifications();
      return;
    }
    if (token) {
      loadConversations({ page: 1, limit: 20 })
        .then((data) => {
          setHasMore(data.conversations.length === 20);
        })
        .catch((err) => {
          showNotification(
            err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.CONVERSATION_LOAD),
            'error'
          );
        });
      if (!friendsFetched && friends.length === 0) {
        getFriends()
          .then(() => setFriendsFetched(true))
          .catch((err) => {
            showNotification(
              err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.FRIENDS_LOAD),
              'error'
            );
          });
      }
    }
  }, [
    isAuthenticated,
    token,
    loadConversations,
    getFriends,
    friendsFetched,
    friends,
    showNotification,
  ]);

  // Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (convLoading || !hasMore) return;
    try {
      const data = await loadConversations({ page: page + 1, limit: 20 });
      setPage((prev) => prev + 1);
      setHasMore(data.conversations.length === 20);
    } catch (err) {
      const errorMsg = err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.LOAD_MORE);
      setError(errorMsg);
      showNotification(errorMsg, 'error');
    }
  }, [convLoading, hasMore, loadConversations, page, showNotification]);

  // Handle typing events
  const handleTyping = useCallback(
    throttle(() => {
      if (selectedConversation?.conversation_id) {
        sendTypingIndicator(selectedConversation.conversation_id).catch((err) => {
          showNotification('Failed to send typing indicator', 'error');
        });
      }
    }, 1000),
    [selectedConversation, sendTypingIndicator, showNotification]
  );

  const clearNotifications = useCallback(() => {
    setSuccess('');
    setError('');
    clearMessagesError();
    clearConvError();
  }, [clearMessagesError, clearConvError]);

  const handleCreateGroup = useCallback(
    async (name, members) => {
      if (!name.trim() || members.length < 1) {
        const errorMsg = getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_VALIDATION);
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        return;
      }
      try {
        const group = await createNewConversation({
          type: 'group',
          name,
          members,
        });
        setSuccess(`${group.name} ${getLocalizedMessage(MESSAGE_CONSTANTS.SUCCESS.GROUP_CREATED)}`);
        setGroupModalOpen(false);
        setSelectedConversation(group);
      } catch (err) {
        const errorMsg = err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_CREATE);
        setError(errorMsg);
        showNotification(errorMsg, 'error');
      }
    },
    [createNewConversation, setSelectedConversation, showNotification]
  );

  const handleForwardMessage = useCallback((message) => {
    setForwardMessage(message);
    setForwardModalOpen(true);
  }, []);

  const handleForwardConfirm = useCallback(
    async (recipients) => {
      if (!forwardMessage || !recipients.length) {
        const errorMsg = 'No message or recipients selected';
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        return;
      }
      try {
        await Promise.all(
          recipients.map(async (recipientId) => {
            const conv = await getOrCreateConversation(recipientId);
            if (conv) {
              await sendNewMessage(
                conv.conversation_id,
                forwardMessage.content,
                forwardMessage.media,
                forwardMessage.replyTo,
                null,
                forwardMessage.message_id
              );
            }
          })
        );
        setSuccess(getLocalizedMessage(MESSAGE_CONSTANTS.SUCCESS.MESSAGE_FORWARDED));
        setForwardModalOpen(false);
        setForwardMessage(null);
      } catch (err) {
        const errorMsg = err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.MESSAGE_FORWARD);
        setError(errorMsg);
        showNotification(errorMsg, 'error');
      }
    },
    [forwardMessage, sendNewMessage, getOrCreateConversation, showNotification]
  );

  if (authLoading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box
        sx={{
          maxWidth: { xs: '100%', md: 1500 },
          mx: 'auto',
          p: { xs: 1, md: 2 },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          boxSizing: 'border-box',
        }}
        role="main"
        aria-label="Messages Page"
      >
        <ProfileHeader user={authData} isOwnProfile />
        {(error || convError || messagesError) && (
          <Alert
            severity="error"
            onClose={clearNotifications}
            sx={{ mt: 2, borderRadius: 1, mx: { xs: 1, md: 0 } }}
          >
            {error || convError || messagesError}
          </Alert>
        )}
        {success && (
          <Snackbar
            open={!!success}
            autoHideDuration={3000}
            onClose={clearNotifications}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              {success}
            </Alert>
          </Snackbar>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 2,
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            startIcon={<GroupAdd aria-hidden="true" />}
            onClick={() => setGroupModalOpen(true)}
            aria-label="Create new group chat"
            disabled={friends.length === 0 || convLoading}
            sx={{ minWidth: 'fit-content', borderRadius: 1, px: 3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Create Group
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 30%' },
              maxWidth: { md: '400px' },
              bgcolor: theme.palette.background.paper,
              borderRadius: 1,
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            aria-label="Conversations list"
          >
            <MemoizedConversationsList
              conversations={conversations}
              groupChats={conversations.filter((c) => c.type === 'group')}
              friends={friends}
              currentUserId={authData?.anonymous_id}
              onSelectConversation={setSelectedConversation}
              selectedConversation={selectedConversation}
              onDeleteConversation={deleteConv}
              onDeleteGroupChat={deleteConv}
              messages={messages}
              getOrCreateConversation={getOrCreateConversation}
              pinConv={pinConv}
              unpinConv={unpinConv}
              archiveConv={archiveConv}
              unarchiveConv={unarchiveConv}
              muteConv={muteConv}
              unmuteConv={unmuteConv}
              markRead={markRead}
              socket={socketRef.current}
              loadMoreConversations={loadMoreConversations}
              hasMore={hasMore}
              loading={convLoading}
            />
          </Box>
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 70%' },
              bgcolor: theme.palette.background.paper,
              borderRadius: 1,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            aria-label="Chat View"
          >
            {selectedConversation ? (
              <MemoizedChatView
                currentUserId={authData?.anonymous_id}
                conversation={selectedConversation}
                socket={socketRef.current}
                onSendMediaMessage={sendNewMessage}
                onMarkRead={markRead}
                onDeleteMessage={deleteMsg}
                onEditMessage={editMsg}
                onForwardMessage={handleForwardMessage}
                token={token}
                fetchMessagesList={loadMessages}
                friends={friends}
                messages={messages}
                setMessages={setMessages}
                onAddReaction={addMessageReaction}
                onCreatePoll={createNewPoll}
                onVotePoll={voteInPoll}
                onPinMessage={pinMsg}
                onUnpinMessage={unpinMsg}
                onTyping={handleTyping}
              />
            ) : (
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mt: 4, textAlign: 'center' }}
                aria-label="No conversation selected"
              >
                {getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.NO_CONVERSATION)}
              </Typography>
            )}
          </Box>
        </Box>
        <MemoizedGroupChatModal
          open={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          friends={friends}
          currentUserId={authData?.anonymous_id}
          onCreate={handleCreateGroup}
        />
        <MemoizedForwardMessageModal
          open={forwardModalOpen}
          onClose={() => {
            setForwardModalOpen(false);
            setForwardMessage(null);
          }}
          friends={friends}
          currentUserId={authData?.anonymous_id}
          onForward={handleForwardConfirm}
        />
      </Box>
    </AppLayout>
  );
};

export default React.memo(MessagesPage);