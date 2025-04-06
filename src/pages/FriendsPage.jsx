import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Alert, Snackbar } from "@mui/material";
import { Add } from "@mui/icons-material";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useSocial from "../hooks/useSocial";
import { useNotification } from "../context/NotificationContext";
import { actionButtonStyles } from "../styles/BaseStyles";
import ProfileHeader from "../components/Headers/ProfileHeader";
import FriendFormDialog from "../components/Dialogs/FriendFormDialog";
import FriendsList from "../components/Friends/FriendsList";
import PendingRequestsList from "../components/Friends/PendingRequestsList";

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
    searchUsersByUsername,
  } = useSocial(token, handleLogout, navigate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [username, setUsername] = useState(""); // Змінюємо friendId на username
  const [success, setSuccess] = useState("");

  const loadFriendsData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      showNotification("Authentication missing.", "error");
      return;
    }
    try {
      await Promise.all([getFriends(), getPendingRequests()]);
    } catch (err) {
      showNotification(err.message || "Failed to load friends data", "error");
    }
  }, [isAuthenticated, token, getFriends, getPendingRequests, showNotification]);

  useEffect(() => {
    if (!authLoading) {
      loadFriendsData();
    }
  }, [authLoading, loadFriendsData]);

  const handleOpenAddFriend = () => {
    setUsername("");
    setCreateDialogOpen(true);
  };

  const handleCancelAddFriend = () => {
    setCreateDialogOpen(false);
  };

  const handleAddFriend = async () => {
    if (!username.trim()) {
      showNotification("Username is required!", "error");
      return;
    }
    try {
      // Шукаємо користувача за username
      const users = await searchUsersByUsername(username);
      if (!users.length) {
        showNotification("User not found!", "error");
        return;
      }
      const friendId = users[0].anonymous_id; // Беремо перший результат
      await addNewFriend(friendId);
      setSuccess("Friend request sent successfully!");
      setCreateDialogOpen(false);
      setUsername("");
      await getPendingRequests();
    } catch (err) {
      showNotification(err.message || "Failed to send friend request", "error");
    }
  };

  const handleAcceptFriend = async (friendId) => {
    try {
      await acceptFriend(friendId);
      setSuccess("Friend request accepted!");
      await Promise.all([getFriends(), getPendingRequests()]);
    } catch (err) {
      showNotification(err.message || "Failed to accept friend request", "error");
    }
  };

  const handleRejectFriend = async (friendId) => {
    try {
      await rejectFriend(friendId);
      setSuccess("Friend request rejected!");
      await getPendingRequests();
    } catch (err) {
      showNotification(err.message || "Failed to reject friend request", "error");
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeExistingFriend(friendId);
      setSuccess("Friend removed successfully!");
      await getFriends();
    } catch (err) {
      showNotification(err.message || "Failed to remove friend", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  if (authLoading || socialLoading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token} >
      <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
        <ProfileHeader user={authData} isOwnProfile={true}>
          <Button
            variant="contained"
            onClick={handleOpenAddFriend}
            startIcon={<Add />}
            sx={actionButtonStyles}
          >
            Add Friend
          </Button>
        </ProfileHeader>

        {socialError && (
          <Alert severity="error" sx={{ mt: 2 }}>
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
          username={username} // Змінюємо friendId на username
          setUsername={setUsername}
          onSave={handleAddFriend}
          onCancel={handleCancelAddFriend}
        />

        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
    </AppLayout>
  );
};

export default FriendsPage;