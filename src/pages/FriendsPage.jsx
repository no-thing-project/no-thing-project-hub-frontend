// src/pages/FriendsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocial from "../hooks/useSocial";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
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
  Snackbar,
} from "@mui/material";
import { inputStyles } from "../styles/BaseStyles";
import { containerStyles } from "../styles/ProfileStyles";
import { buttonStyles } from "../styles/BoardSectionStyles";

const FriendsPage = () => {
  const navigate = useNavigate();
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
  const [errorMessage, setErrorMessage] = useState("");

  // Початкове завантаження друзів і запитів
  useEffect(() => {
    if (!authLoading && isAuthenticated && token && authData) {
      Promise.all([
        getFriends().catch((err) => {
          console.error("Failed to fetch friends:", err);
          setErrorMessage(err.message || "Failed to load friends");
        }),
        getPendingRequests().catch((err) => {
          console.error("Failed to fetch pending requests:", err);
          setErrorMessage(err.message || "Failed to load pending requests");
        }),
      ]);
    }
  }, [authLoading, isAuthenticated, token, authData, getFriends, getPendingRequests]);

  const handleAddFriend = async () => {
    if (!friendId.trim()) {
      setErrorMessage("Friend ID is required!");
      return;
    }

    try {
      await addNewFriend(friendId);
      setSuccess("Friend request sent successfully!");
      setFriendId("");
      await getPendingRequests(); // Оновлюємо список запитів
    } catch (err) {
      setErrorMessage(err.message || "Failed to send friend request");
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess("");
    setErrorMessage("");
  };

  const isLoading = authLoading || socialLoading;

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated || !authData) {
    navigate("/login");
    return null;
  }
  if (socialError === "User not found") {
    return <ErrorMessage message="Profile not found. Please try again or check your profile ID." />;
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

        {/* Форма для додавання друга */}
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

        {/* Список друзів */}
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

        {/* Запити на дружбу */}
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

        {/* Повідомлення про успіх або помилку */}
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
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    </AppLayout>
  );
};

export default FriendsPage;