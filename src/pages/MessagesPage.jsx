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
    loading: convLoading,
    error: convError,
    clearError: clearConvError,
  } = useConversations({ token, userId: authData?.anonymous_id, handleLogout, navigate });
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
  } = useMessages({ token, userId: authData?.anonymous_id, handleLogout, navigate });
  const {
    uploads,
    uploadMediaFile,
    loading: uploadsLoading,
    error: uploadsError,
    clearError: clearUploadsError,
  } = useUploads({ token, userId: authData?.anonymous_id, handleLogout, navigate });
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

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
    const socketInstance = io('/messages', {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, isAuthenticated]);

  // Handle real-time message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (!message?.message_id || !message?.conversation_id) return;
      setMessages((prev) => {
        const validPrev = Array.isArray(prev) ? prev : [];
        return [message, ...validPrev.filter((m) => m?.message_id !== message.message_id)];
      });
      setConversations((prev) =>
        prev.map((conv) =>
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
        )
      );
    };

    socket.on('message', handleNewMessage);

    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket, setMessages, setConversations, authData?.anonymous_id]);

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
        getFriends().then(() => setFriendsFetched(true)).catch(() => setError('Failed to load friends'));
      }
    }
  }, [isAuthenticated, token, loadConversations, getFriends, clearNotifications, navigate, friendsFetched, friends]);

  useEffect(() => {
    if (selectedConversation?.conversation_id) {
      loadMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation, loadMessages]);

  const handleSelectConversation = useCallback(
    (conv) => {
      setSelectedConversation(conv);
      if (conv?.conversation_id) {
        loadMessages(conv.conversation_id);
      }
    },
    [loadMessages, setSelectedConversation]
  );

  const handleCreateGroup = useCallback(
    async (name, members) => {
      try {
        const group = await createNewConversation({
          type: 'group',
          name,
          members,
        });
        setSuccess(`Group ${group.name} created!`);
        setGroupModalOpen(false);
        await loadConversations();
        if (group?.conversation_id) {
          await loadMessages(group.conversation_id);
          setSelectedConversation(group);
        }
      } catch (err) {
        setError('Failed to create group');
        showNotification(err.message || 'Failed to create group', 'error');
      }
    },
    [createNewConversation, loadConversations, loadMessages, setSelectedConversation, showNotification]
  );

  const handleSendMessage = useCallback(
    async ({ conversationId, content, mediaFiles = [], replyTo }) => {
      if (!conversationId) {
        setError('No conversation selected');
        return;
      }
      try {
        const uploadedMedia = await Promise.all(
          mediaFiles.map(async (file) => {
            const { url, fileKey, contentType } = await uploadMediaFile(file);
            return { url, fileKey, type: contentType.split('/')[0] };
          })
        );
        const message = await sendNewMessage(conversationId, content, uploadedMedia, replyTo);
        setSuccess('Message sent!');
        return message;
      } catch (err) {
        setError('Failed to send message');
        showNotification(err.message || 'Failed to send message', 'error');
      }
    },
    [sendNewMessage, uploadMediaFile, showNotification]
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
      if (!forwardMessage || !recipients.length) return;
      try {
        await Promise.all(
          recipients.map(async (recipientId) => {
            const conv = await getOrCreateConversation(recipientId);
            await sendNewMessage(conv.conversation_id, forwardMessage.content, forwardMessage.media);
          })
        );
        setSuccess('Message forwarded!');
        setForwardModalOpen(false);
        setForwardMessage(null);
      } catch (err) {
        setError('Failed to forward message');
        showNotification(err.message || 'Failed to forward message', 'error');
      }
    },
    [forwardMessage, sendNewMessage, getOrCreateConversation, showNotification]
  );

  const filteredMessages = useMemo(() => {
    if (!selectedConversation?.conversation_id) return [];
    const validMessages = (messages || []).filter(
      (m) => m && m.message_id && m.conversation_id
    );
    return validMessages.filter((m) => m.conversation_id === selectedConversation.conversation_id);
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
                currentUserId={authData.anonymous_id}
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
          >
            {selectedConversation ? (
              <MemoizedChatView
                currentUserId={authData.anonymous_id}
                conversation={selectedConversation}
                onSendMessage={sendNewMessage}
                onSendMediaMessage={handleSendMessage}
                onMarkRead={markRead}
                onDeleteMessage={deleteMsg}
                onEditMessage={editMsg}
                onForwardMessage={handleForwardMessage}
                token={token}
                fetchMessagesList={loadMessages}
                pendingMediaList={uploads}
                setPendingMediaFile={uploadMediaFile}
                clearPendingMedia={() => {}} // Placeholder for future implementation
                friends={friends}
                messages={filteredMessages}
                setMessages={setMessages}
                searchMessages={searchMsgs}
                onAddReaction={addMessageReaction}
                onCreatePoll={createNewPoll}
                onVotePoll={voteInPoll}
                onPinMessage={pinMsg}
                onUnpinMessage={unpinMsg}
                onSendTyping={sendTypingIndicator}
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
        <Snackbar
          open={!!success || !!error}
          autoHideDuration={3000}
          onClose={clearNotifications}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={success ? 'success' : 'error'} onClose={clearNotifications}>
            {success || error}
          </Alert>
        </Snackbar>
        <GroupChatModal
          open={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          friends={friends}
          currentUserId={authData.anonymous_id}
          onCreate={handleCreateGroup}
        />
        <ForwardMessageModal
          open={forwardModalOpen}
          onClose={() => {
            setForwardModalOpen(false);
            setForwardMessage(null);
          }}
          friends={friends}
          currentUserId={authData.anonymous_id}
          onForward={handleForwardConfirm}
        />
      </Box>
    </AppLayout>
  );
};

export default React.memo(MessagesPage);