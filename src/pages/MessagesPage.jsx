import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Snackbar,
  Typography,
  Button,
  useTheme,
  IconButton,
} from '@mui/material';
import { GroupAdd, ArrowBack } from '@mui/icons-material';
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

    const handleNewMessage = (message) => {
      if (!message?.message_id || !message?.conversation_id) return;
      setMessages((prev) => {
        const validPrev = Array.isArray(prev) ? prev : [];
        if (validPrev.some((m) => m.message_id === message.message_id)) return validPrev;
        return [...validPrev, message].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.conversation_id === message.conversation_id ? { ...conv, lastMessage: message } : conv
        )
      );
    };

    const handleConversationCreated = (newConv) => {
      if (!newConv?.conversation_id) return;
      setConversations((prev) => {
        if (prev.some((c) => c.conversation_id === newConv.conversation_id)) return prev;
        return [newConv, ...prev];
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.CONVERSATION_CREATED, handleConversationCreated);
    };
  }, [authData?.anonymous_id, setConversations, setMessages]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) {
      clearNotifications();
      return;
    }
    if (token) {
      loadConversations({ page: 1, limit: 20 })
        .then((data) => setHasMore(data.conversations.length === 20))
        .catch((err) =>
          showNotification(
            err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.CONVERSATION_LOAD),
            'error'
          )
        );
      if (!friendsFetched && !friends.length) {
        getFriends()
          .then(() => setFriendsFetched(true))
          .catch((err) =>
            showNotification(
              err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.FRIENDS_LOAD),
              'error'
            )
          );
      }
    }
  }, [isAuthenticated, token, loadConversations, getFriends, friendsFetched, friends, showNotification]);

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

  const clearNotifications = useCallback(() => {
    setSuccess('');
    setError('');
    clearMessagesError();
    clearConvError();
  }, [clearMessagesError, clearConvError]);

  const handleCreateGroup = useCallback(
    async (name, members) => {
      if (!name?.trim() || !members?.length) {
        const errorMsg = getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_VALIDATION);
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        return;
      }
      try {
        const group = await createNewConversation({ type: 'group', name, members });
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
      if (!forwardMessage || !recipients?.length) {
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
    [forwardMessage, getOrCreateConversation, sendNewMessage, showNotification]
  );

  if (authLoading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box
        sx={{
          height: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme.palette.background.default,
          p: { xs: 1, sm: 2 },
        }}
        role="main"
        aria-label="Messages Page"
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mb: 1,
            gap: 1,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            startIcon={<GroupAdd />}
            onClick={() => setGroupModalOpen(true)}
            aria-label="Create new group chat"
            disabled={!friends.length || convLoading}
            sx={{
              borderRadius: 1,
              px: { xs: 2, sm: 3 },
              py: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minWidth: { xs: 120, sm: 140 },
            }}
          >
            Create Group
          </Button>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 0, sm: 1, md: 2 },
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: theme.shadows[2],
          }}
        >
          <Box
            sx={{
              display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
              flex: { xs: '1 1 100%', md: '0 0 30%' },
              maxWidth: { md: 400 },
              bgcolor: theme.palette.background.paper,
              borderRadius: { xs: 0, md: 1 },
              overflowY: 'auto',
              flexDirection: 'column',
            }}
            aria-label="Conversations list"
          >
            <MemoizedConversationsList
              conversations={conversations}
              friends={friends}
              currentUserId={authData?.anonymous_id}
              onSelectConversation={setSelectedConversation}
              selectedConversation={selectedConversation}
              onDeleteConversation={deleteConv}
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
              display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
              flex: { xs: '1 1 100%', md: '1 1 70%' },
              bgcolor: theme.palette.background.paper,
              borderRadius: { xs: 0, md: 1 },
              overflow: 'hidden',
              flexDirection: 'column',
              position: 'relative',
            }}
            aria-label="Chat View"
          >
            {selectedConversation && (
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  p: 1,
                  bgcolor: theme.palette.background.paper,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <IconButton
                  onClick={() => setSelectedConversation(null)}
                  aria-label="Back to conversations list"
                  sx={{ mr: 1 }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {selectedConversation.name || selectedConversation.recipient?.username || 'Chat'}
                </Typography>
              </Box>
            )}
            {selectedConversation ? (
              <MemoizedChatView
                currentUserId={authData?.anonymous_id}
                conversation={selectedConversation}
                socket={socketRef.current}
                onSendMessage={sendNewMessage}
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
                onTyping={sendTypingIndicator}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              />
            ) : (
              <Typography variant="h6" color="text.secondary" sx={{ mt: 4, textAlign: 'center', flex: 1 }}>
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
          sx={{
            maxHeight: { xs: '100vh', sm: '80vh' },
            maxWidth: { xs: '100%', sm: 600 },
            width: '100%',
            mx: 'auto',
            overflowY: { xs: 'auto', sm: 'hidden' },
          }}
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
          sx={{
            maxHeight: { xs: '100vh', sm: '80vh' },
            maxWidth: { xs: '100%', sm: 600 },
            width: '100%',
            mx: 'auto',
            overflowY: { xs: 'auto', sm: 'hidden' },
          }}
        />
      </Box>
    </AppLayout>
  );
};

export default React.memo(MessagesPage);