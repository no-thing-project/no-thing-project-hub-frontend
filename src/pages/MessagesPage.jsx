import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import io from 'socket.io-client';
import { throttle } from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useMessages from '../hooks/useMessages';
import useConversations from '../hooks/useConversations';
import useUploads from '../hooks/useUploads';
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
    },
  };
  const lang = 'en';
  return messages[lang][key] || key;
};

const MemoizedConversationsList = React.memo(ConversationsList);
const MemoizedChatView = React.memo(ChatView);

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
  } = useMessages({ token, userId: authData?.anonymous_id, onLogout: handleLogout, navigate, updateLastMessage });
  const {
    uploads,
    uploadMediaFile,
    clearUploads,
    loading: uploadsLoading,
    error: uploadsError,
    clearError: clearUploadsError,
  } = useUploads({ token, userId: authData?.anonymous_id, onLogout: handleLogout, navigate });
  const { friends, getFriends } = useSocial(token, handleLogout, navigate);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [friendsFetched, setFriendsFetched] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize socket.io
  useEffect(() => {
    if (!token || !isAuthenticated) return;
  
    connectSocket(token);
    const socketInstance = getSocket();
    setSocket(socketInstance);
  
    return () => {
      socketInstance?.disconnect();
    };
  }, [token, isAuthenticated]);
  

  // Handle real-time message updates
  useEffect(() => {
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
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.conversation_id === message.conversation_id
            ? {
                ...conv,
                lastMessage: message,
                unreadCount:
                  message.sender_id !== authData.anonymous_id && !message.is_read
                    ? (conv.unreadCount || 0) + 1
                    : conv.unreadCount,
              }
            : conv
        );
        return [...updated].sort((a, b) => {
          const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp) : 0;
          const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp) : 0;
          return bTime - aTime;
        });
      });
    }, MESSAGE_CONSTANTS.THROTTLE_MS);

    socket.on(SOCKET_EVENTS.MESSAGE, handleNewMessage);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE, handleNewMessage);
    };
  }, [socket, setMessages, setConversations, authData?.anonymous_id]);

  // Handle typing events
  const handleTyping = useCallback(
    throttle(() => {
      if (selectedConversation?.conversation_id) {
        sendTypingIndicator(selectedConversation.conversation_id).catch((err) =>
          console.error('Typing indicator error:', err)
        );
      }
    }, 1000),
    [selectedConversation, sendTypingIndicator]
  );

  const clearNotifications = useCallback(() => {
    setSuccess('');
    setError('');
    clearMessagesError();
    clearConvError();
    clearUploadsError();
  }, [clearMessagesError, clearConvError, clearUploadsError]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearNotifications();
      navigate('/login');
    } else if (token) {
      loadConversations();
      if (!friendsFetched && friends.length === 0) {
        getFriends()
          .then(() => setFriendsFetched(true))
          .catch((err) => {
            console.error('Failed to load friends:', err);
            setError(getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.FRIENDS_LOAD));
          });
      }
    }
  }, [isAuthenticated, token, loadConversations, getFriends, clearNotifications, navigate, friendsFetched, friends]);

  useEffect(() => {
    if (selectedConversation?.conversation_id) {
      loadMessages(selectedConversation.conversation_id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, loadMessages, setMessages]);

  const handleSelectConversation = useCallback(
    (conv) => {
      setSelectedConversation(conv);
      if (conv?.conversation_id) {
        loadMessages(conv.conversation_id);
      } else {
        setMessages([]);
      }
    },
    [loadMessages, setSelectedConversation, setMessages]
  );

  const handleCreateGroup = useCallback(
    async (name, members) => {
      if (!name.trim() || members.length < 1) {
        setError(getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_VALIDATION));
        return;
      }
      try {
        const group = await createNewConversation({
          type: 'group',
          name,
          members,
        });
        if (group) {
          setSuccess(`${group.name} ${getLocalizedMessage(MESSAGE_CONSTANTS.SUCCESS.GROUP_CREATED)}`);
          setGroupModalOpen(false);
          await loadConversations();
          setSelectedConversation(group);
        }
      } catch (err) {
        console.error('Group creation error:', err);
        setError(getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_CREATE));
        showNotification(err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.GROUP_CREATE), 'error');
      }
    },
    [createNewConversation, loadConversations, setSelectedConversation, showNotification]
  );

  const handleForwardMessage = useCallback(
    (message) => {
      setForwardMessage(message);
      setForwardModalOpen(true);
    },
    []
  );

  const handleForwardConfirm = useCallback(
    async (recipients) => {
      if (!forwardMessage || !recipients.length) {
        setError('No message or recipients selected');
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
                forwardMessage.selectedText
              );
            }
          })
        );
        setSuccess(getLocalizedMessage(MESSAGE_CONSTANTS.SUCCESS.MESSAGE_FORWARDED));
        setForwardModalOpen(false);
        setForwardMessage(null);
      } catch (err) {
        console.error('Message forward error:', err);
        setError(getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.MESSAGE_FORWARD));
        showNotification(err.message || getLocalizedMessage(MESSAGE_CONSTANTS.ERRORS.MESSAGE_FORWARD), 'error');
      }
    },
    [forwardMessage, sendNewMessage, getOrCreateConversation, showNotification]
  );

  const filteredMessages = useMemo(() => {
    if (!selectedConversation?.conversation_id) return [];
    const validMessages = (messages || []).filter(
      (m) => m && m.message_id && m.conversation_id === selectedConversation.conversation_id
    );
    return validMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [messages, selectedConversation]);

  if (authLoading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box
        sx={{
          maxWidth: { xs: '100%', md: 1500 },
          margin: '0 auto',
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
        {(messagesError || convError || uploadsError || error) && (
          <Alert
            severity="error"
            onClose={clearNotifications}
            sx={{ mt: 2, borderRadius: 1 }}
          >
            {error || messagesError || convError || uploadsError}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            onClose={clearNotifications}
            sx={{ mt: 2, borderRadius: 1 }}
          >
            {success}
          </Alert>
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
            disabled={friends.length === 0}
            sx={{ minWidth: 'fit-content', borderRadius: 1, px: 3 }}
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
            {(convLoading || messagesLoading || uploadsLoading) ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress aria-label="Loading conversations" />
              </Box>
            ) : (
              <MemoizedConversationsList
                conversations={conversations}
                groupChats={conversations.filter((c) => c.type === 'group')}
                friends={friends}
                currentUserId={authData?.anonymous_id}
                onSelectConversation={handleSelectConversation}
                selectedConversation={selectedConversation}
                onDeleteGroupChat={deleteConv}
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
                socket={socket}
              />
            )}
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
                socket={socket}
                onSendMediaMessage={sendNewMessage}
                onMarkRead={markRead}
                onDeleteMessage={deleteMsg}
                onEditMessage={editMsg}
                onForwardMessage={handleForwardMessage}
                token={token}
                fetchMessagesList={loadMessages}
                pendingMediaList={uploads}
                setPendingMediaFile={uploadMediaFile}
                clearPendingMedia={clearUploads}
                friends={friends}
                messages={filteredMessages}
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
                Select a conversation to start chatting
              </Typography>
            )}
          </Box>
        </Box>
        <GroupChatModal
          open={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          friends={friends}
          currentUserId={authData?.anonymous_id}
          onCreate={handleCreateGroup}
        />
        <ForwardMessageModal
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