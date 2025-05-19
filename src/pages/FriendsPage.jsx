import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Alert, Snackbar } from '@mui/material';
import { Add } from '@mui/icons-material';
import AppLayout from '../components/Layout/AppLayout';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import useAuth from '../hooks/useAuth';
import useSocial from '../hooks/useSocial';
import { useNotification } from '../context/NotificationContext';
import { actionButtonStyles } from '../styles/BaseStyles';
import ProfileHeader from '../components/Headers/ProfileHeader';
import FriendFormDialog from '../components/Dialogs/FriendFormDialog';
import FriendsList from '../components/Friends/FriendsList';
import PendingRequestsList from '../components/Friends/PendingRequestsList';

const FriendsPage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { token, authData, isAuthenticated, handleLogout, loading: authLoading } = useAuth(navigate);
  const {
    friends,
    pendingRequests,
    loading: socialLoading,
    error: socialError,
    getFriends,
    getPendingRequests,
    addNewFriend,
    acceptFriend,
    rejectFriend,
    removeExistingFriend,
  } = useSocial(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [success, setSuccess] = useState('');

  const loadFriendsData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      showNotification('Authentication missing.', 'error');
      navigate('/login');
      return;
    }
    try {
      await Promise.all([getFriends(), getPendingRequests()]);
    } catch (err) {
      showNotification(err.message || 'Failed to load friends data', 'error');
    }
  }, [isAuthenticated, token, getFriends, getPendingRequests, showNotification, navigate]);

  useEffect(() => {
    if (!authLoading) {
      loadFriendsData();
    }
  }, [authLoading, loadFriendsData]);

  const handleOpenAddFriend = useCallback(() => {
    setUsername('');
    setCreateDialogOpen(true);
  }, []);

  const handleCancelAddFriend = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleAddFriend = useCallback(
    async (friendId) => {
      if (!friendId) {
        showNotification('User ID is required!', 'error');
        return;
      }
      try {
        await addNewFriend(friendId);
        setSuccess('Friend request sent successfully!');
        setCreateDialogOpen(false);
        setUsername('');
        await getPendingRequests();
      } catch (err) {
        showNotification(err.message || 'Failed to send friend request', 'error');
      }
    },
    [addNewFriend, getPendingRequests, showNotification]
  );

  const handleAcceptFriend = useCallback(
    async (friendId) => {
      try {
        await acceptFriend(friendId);
        setSuccess('Friend request accepted!');
        await Promise.all([getFriends(), getPendingRequests()]);
      } catch (err) {
        showNotification(err.message || 'Failed to accept friend request', 'error');
      }
    },
    [acceptFriend, getFriends, getPendingRequests, showNotification]
  );

  const handleRejectFriend = useCallback(
    async (friendId) => {
      try {
        await rejectFriend(friendId);
        setSuccess('Friend request rejected!');
        await getPendingRequests();
      } catch (err) {
        showNotification(err.message || 'Failed to reject friend request', 'error');
      }
    },
    [rejectFriend, getPendingRequests, showNotification]
  );

  const handleRemoveFriend = useCallback(
    async (friendId) => {
      try {
        await removeExistingFriend(friendId);
        setSuccess('Friend removed successfully!');
        await getFriends();
      } catch (err) {
        showNotification(err.message || 'Failed to remove friend', 'error');
      }
    },
    [removeExistingFriend, getFriends, showNotification]
  );

  const handleCloseSnackbar = useCallback(() => {
    setSuccess('');
  }, []);

  if (authLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, mx: 'auto', p: { xs: 1, md: 2 } }}>
        <ProfileHeader user={authData} isOwnProfile>
          <Button
            variant="contained"
            onClick={handleOpenAddFriend}
            startIcon={<Add />}
            sx={{ ...actionButtonStyles, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            aria-label="Add a new friend"
          >
            Add Friend
          </Button>
        </ProfileHeader>

        {socialError && (
          <Alert severity="error" sx={{ mt: 2, mx: { xs: 1, md: 0 } }}>
            {socialError}
          </Alert>
        )}

        <Box sx={{ my: 4 }}>
          <FriendsList friends={friends} onRemoveFriend={handleRemoveFriend} />
          <PendingRequestsList
            pendingRequests={pendingRequests}
            onAcceptFriend={handleAcceptFriend}
            onRejectFriend={handleRejectFriend}
          />
        </Box>

        <FriendFormDialog
          open={createDialogOpen}
          title="Add a New Friend"
          username={username}
          setUsername={setUsername}
          onSave={handleAddFriend}
          onCancel={handleCancelAddFriend}
          disabled={socialLoading}
          token={token}
        />

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
};

export default React.memo(FriendsPage);