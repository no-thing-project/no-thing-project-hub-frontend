import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocial from "../hooks/useSocial";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { inputStyles } from "../styles/BaseStyles";
import { containerStyles } from "../styles/ProfileStyles";
import { buttonStyles } from "../styles/BoardSectionStyles";
import { useNotification } from "../context/NotificationContext";

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

  const [friendId, setFriendId] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && token && authData) {
      Promise.all([
        getFriends().catch((err) => {
          console.error("Failed to fetch friends:", err);
          showNotification(err.message || "Failed to load friends", "error");
        }),
        getPendingRequests().catch((err) => {
          console.error("Failed to fetch pending requests:", err);
          showNotification(err.message || "Failed to load pending requests", "error");
        }),
      ]);
    }
  }, [authLoading, isAuthenticated, token, authData, getFriends, getPendingRequests, showNotification]);

  const handleAddFriend = async () => {
    if (!friendId.trim()) {
      showNotification("Friend ID is required!", "error");
      return;
    }

    try {
      await addNewFriend(friendId);
      setSuccess("Friend request sent successfully!");
      setFriendId("");
      await getPendingRequests();
    } catch (err) {
      showNotification(err.message || "Failed to send friend request", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
  };

  const isLoading = authLoading || socialLoading;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !authData) {
    navigate("/login");
    return null;
  }
  if (socialError === "User not found") {
    showNotification("Profile not found. Please try again or check your profile ID.", "error");
  }

  return (
    <AppLayout
      currentUser={authData}
      onLogout={handleLogout}
      token={token}
      headerTitle="Friends"
    >
      <Container sx={containerStyles}>
        <Typography variant="h4" gutterBottom>
          Friends
        </Typography>

        {socialError && <Alert severity="error">{socialError}</Alert>}

        <Box sx={{ mb: 4 }}>
          <TextField
            label="Friend ID"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            sx={inputStyles}
            fullWidth
            margin="normal"
          />
          <Button sx={buttonStyles} onClick={handleAddFriend}>
            Add Friend
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6">Your Friends</Typography>
          <List>
            {friends.length > 0 ? (
              friends.map((friend) => (
                <ListItem key={friend.anonymous_id}>
                  <ListItemText primary={friend.username || friend.anonymous_id} />
                  <Button
                    sx={buttonStyles}
                    onClick={() => removeExistingFriend(friend.anonymous_id)}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))
            ) : (
              <Typography>No friends yet.</Typography>
            )}
          </List>
        </Box>

        <Box>
          <Typography variant="h6">Pending Friend Requests</Typography>
          <List>
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <ListItem key={request.anonymous_id}>
                  <ListItemText primary={request.username || request.anonymous_id} />
                  <Box>
                    <Button
                      sx={{ ...buttonStyles, mr: 1 }}
                      onClick={() => acceptFriend(request.anonymous_id).then(() => getFriends())}
                    >
                      Accept
                    </Button>
                    <Button
                      sx={buttonStyles}
                      onClick={() => rejectFriend(request.anonymous_id).then(() => getPendingRequests())}
                    >
                      Reject
                    </Button>
                  </Box>
                </ListItem>
              ))
            ) : (
              <Typography>No pending requests.</Typography>
            )}
          </List>
        </Box>
      </Container>
    </AppLayout>
  );
};

export default FriendsPage;