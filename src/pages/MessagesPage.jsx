import React, { useState, useCallback, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Alert,
  Snackbar,
  Typography,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { GroupAdd, Search } from '@mui/icons-material';
import AppLayout from '../components/Layout/AppLayout';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useMessages from '../hooks/useMessages';
import useSocial from '../hooks/useSocial';
import { useNotification } from '../context/NotificationContext';
import ProfileHeader from '../components/Headers/ProfileHeader';
import ConversationsList from '../components/Messages/ConversationsList';
import ChatView from '../components/Messages/ChatView';
import GroupChatModal from '../components/Messages/GroupChatModal';

// State reducer for complex interactions
const initialState = {
  selectedConversation: null, // Store full conversation object
  searchQuery: '',
  groupModalOpen: false,
  success: '',
  error: '',
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SELECT_CONVERSATION':
      console.log('Selected conversation:', action.payload); // Debug log
      return { ...state, selectedConversation: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_GROUP_MODAL':
      return { ...state, groupModalOpen: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, error: '' };
    case 'SET_ERROR':
      return { ...state, error: action.payload, success: '' };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, success: '', error: '' };
    default:
      return state;
  }
};

/**
 * Messages page component
 * @returns {JSX.Element}
 */
const MessagesPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    conversations,
    groupChats,
    messages,
    setMessages,
    loading: messagesLoading,
    error: messagesError,
    pendingMedia,
    sendNewMessage,
    sendMediaMessage,
    addPendingMedia,
    clearPendingMedia,
    fetchConversationMessages,
    markRead,
    deleteMsg,
    editMsg,
    searchMsgs,
    createNewConversation,
    updateConv,
    archiveConv,
    unarchiveConv,
    muteConv,
    unmuteConv,
    pinConv,
    unpinConv,
    deleteConv,
    createNewGroupChat,
    updateGroup,
    addMembers,
    removeMembers,
    deleteGroup,
    uploadMediaFile,
    fetchMediaFile,
    deleteMediaFile,
    getOrCreateConversation,
  } = useMessages(token, authData?.anonymous_id, handleLogout, navigate);
  const { friends, getFriends, loading: socialLoading } = useSocial(token, handleLogout, navigate);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [friendsFetched, setFriendsFetched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Clear state on authentication change
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'SELECT_CONVERSATION', payload: null });
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    }
  }, [isAuthenticated]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (state.searchQuery && state.selectedConversation) {
        setIsSearching(true);
        handleSearch(state.selectedConversation).finally(() => setIsSearching(false));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [state.searchQuery, state.selectedConversation]);

  // Load friends
  useEffect(() => {
    if (!isAuthenticated || !token || socialLoading || friendsFetched || friends.length > 0) return;
    const fetchFriends = async () => {
      try {
        await getFriends();
        setFriendsFetched(true);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load friends list' });
        showNotification('Failed to load friends list', 'error');
      }
    };
    fetchFriends();
  }, [isAuthenticated, token, socialLoading, friends, friendsFetched, getFriends, showNotification]);

  // Create new conversation
  const handleCreateConversation = useCallback(
    async (friendId) => {
      try {
        const newConv = await getOrCreateConversation(friendId);
        dispatch({ type: 'SELECT_CONVERSATION', payload: newConv });
        dispatch({ type: 'SET_SUCCESS', payload: 'New chat created!' });
        await fetchConversationMessages(newConv.conversation_id, { page: 1, limit: 20 });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create chat' });
        showNotification(err.message || 'Failed to create chat', 'error');
      }
    },
    [getOrCreateConversation, fetchConversationMessages, showNotification]
  );

  const handleMarkRead = useCallback(
    async (messageId) => {
      try {
        await markRead(messageId);
        dispatch({ type: 'SET_SUCCESS', payload: 'Message marked as read!' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to mark as read' });
        showNotification(err.message || 'Failed to mark as read', 'error');
      }
    },
    [markRead, showNotification]
  );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        await deleteMsg(messageId);
        dispatch({ type: 'SET_SUCCESS', payload: 'Message deleted!' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete message' });
        showNotification(err.message || 'Failed to delete message', 'error');
      }
    },
    [deleteMsg, showNotification]
  );

  const handleEditMessage = useCallback(
    async (messageId, newContent) => {
      try {
        await editMsg(messageId, newContent);
        dispatch({ type: 'SET_SUCCESS', payload: 'Message edited!' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to edit message' });
        showNotification(err.message || 'Failed to edit message', 'error');
      }
    },
    [editMsg, showNotification]
  );

  const handleCreateGroup = useCallback(
    async (name, members) => {
      try {
        const group = await createNewGroupChat(name, members);
        const groupConv = { conversation_id: `group:${group.group_id}`, ...group, isGroup: true };
        dispatch({ type: 'SELECT_CONVERSATION', payload: groupConv });
        dispatch({ type: 'SET_SUCCESS', payload: `Group ${group.name} created!` });
        dispatch({ type: 'TOGGLE_GROUP_MODAL', payload: false });
        await fetchConversationMessages(`group:${group.group_id}`, { page: 1, limit: 20 });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create group' });
        showNotification(err.message || 'Failed to create group', 'error');
      }
    },
    [createNewGroupChat, fetchConversationMessages, showNotification]
  );

  const handleSendMessage = useCallback(
    async ({ conversationId, content, mediaFiles = [], replyTo }) => {
      try {
        await sendMediaMessage(conversationId, content, mediaFiles, replyTo);
        dispatch({ type: 'SET_SUCCESS', payload: 'Message sent!' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
        showNotification(err.message || 'Failed to send message', 'error');
      }
    },
    [sendMediaMessage, showNotification]
  );

  const handleSearch = useCallback(
    async (conversation) => {
      try {
        const conversationId = conversation.isGroup ? `group:${conversation.group_id}` : conversation.conversation_id;
        const results = await searchMsgs(conversationId, state.searchQuery);
        setMessages(results?.messages || []);
        return results;
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to search messages' });
        showNotification(err.message || 'Failed to search messages', 'error');
      }
    },
    [state.searchQuery, searchMsgs, setMessages, showNotification]
  );

  const recipient = useMemo(() => {
    if (!state.selectedConversation) {
      console.log('No conversation selected'); // Debug log
      return null;
    }
    console.log('Recipient computed:', state.selectedConversation); // Debug log
    return state.selectedConversation;
  }, [state.selectedConversation]);

  const filteredMessages = useMemo(() => {
    if (!state.selectedConversation) return [];
    const { conversation_id, isGroup, group_id } = state.selectedConversation;
    return messages.filter((m) =>
      isGroup ? m.group_id === group_id : m.conversation_id === conversation_id
    );
  }, [messages, state.selectedConversation]);

  if (authLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box
        sx={{
          maxWidth: { xs: '100%', md: 1500 },
          margin: '0 auto',
          p: { xs: 1, md: 2 },
        }}
        role="main"
        aria-label="Messages Page"
      >
        <ProfileHeader user={authData} isOwnProfile />
        {(messagesError || state.error) && (
          <Alert severity="error" onClose={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })} sx={{ mt: 2 }}>
            {state.error || messagesError}
          </Alert>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            gap: 2,
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Search messages..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
            sx={{ flexGrow: 1 }}
            InputProps={{
              endAdornment: isSearching ? <CircularProgress size={20} /> : <Search aria-hidden="true" />,
            }}
            aria-label="Search messages"
          />
          <Button
            variant="contained"
            startIcon={<GroupAdd />}
            onClick={() => dispatch({ type: 'TOGGLE_GROUP_MODAL', payload: true })}
            aria-label="Create new group chat"
            disabled={friends.length === 0}
          >
            Create Group Chat
          </Button>
        </Box>
        {!friendsFetched && socialLoading && (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', my: 2 }}>
            Loading friends...
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
          }}
        >
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 30%' },
              maxWidth: { md: '400px' },
            }}
            aria-label="Conversations list"
          >
            {messagesLoading ? (
              <CircularProgress aria-label="Loading conversations" />
            ) : (
              <ConversationsList
                conversations={conversations}
                groupChats={groupChats}
                friends={friends}
                currentUserId={authData.anonymous_id}
                onSelectConversation={(conv) => dispatch({ type: 'SELECT_CONVERSATION', payload: conv })}
                selectedConversation={state.selectedConversation}
                onDeleteGroupChat={deleteGroup}
                onDeleteConversation={deleteConv}
                messages={messages}
                getOrCreateConversation={getOrCreateConversation}
                pinConv={pinConv}
                unpinConv={unpinConv}
                archiveConv={archiveConv}
                unarchiveConv={unarchiveConv}
                muteConv={muteConv}
                unmuteConv={unmuteConv}
              />
            )}
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 70%' } }}>
            {state.selectedConversation ? (
              <ChatView
                currentUserId={authData.anonymous_id}
                recipient={recipient}
                onSendMessage={sendNewMessage}
                onSendMediaMessage={handleSendMessage}
                onMarkRead={handleMarkRead}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                token={token}
                fetchMessagesList={fetchConversationMessages}
                pendingMediaList={pendingMedia}
                setPendingMediaFile={addPendingMedia}
                clearPendingMedia={clearPendingMedia}
                isGroupChat={state.selectedConversation.isGroup}
                friends={friends}
                messages={filteredMessages}
                setMessages={setMessages}
                searchMessages={handleSearch}
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
          open={!!state.success || !!state.error}
          autoHideDuration={3000}
          onClose={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={state.success ? 'success' : 'error'}
            onClose={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
          >
            {state.success || state.error}
          </Alert>
        </Snackbar>
        <GroupChatModal
          open={state.groupModalOpen}
          onClose={() => dispatch({ type: 'TOGGLE_GROUP_MODAL', payload: false })}
          friends={friends}
          currentUserId={authData.anonymous_id}
          onCreate={handleCreateGroup}
        />
      </Box>
    </AppLayout>
  );
};

export default React.memo(MessagesPage);
