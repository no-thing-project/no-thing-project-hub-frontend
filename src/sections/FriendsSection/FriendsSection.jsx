// src/components/Sections/FriendsSection.jsx
import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
} from "@mui/material";
import { buttonStyles } from "../../styles";

const FriendsSection = ({
  friends,
  pendingRequests,
  addNewFriend,
  acceptFriend,
  rejectFriend,
  removeExistingFriend,
}) => {
  const handleAddFriend = () => {
    const friendId = prompt("Enter friend's anonymous ID:");
    if (friendId) addNewFriend(friendId);
  };

  return (
    <Box>
      <Typography variant="h6">Friends</Typography>
      <List>
        {friends.map((friend) => (
          <ListItem key={friend.anonymous_id}>
            <ListItemText primary={friend.username || friend.anonymous_id} />
            <Button
              sx={buttonStyles}
              onClick={() => removeExistingFriend(friend.anonymous_id)}
            >
              Remove
            </Button>
          </ListItem>
        ))}
      </List>
      <Button sx={buttonStyles} onClick={handleAddFriend}>
        Add Friend
      </Button>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Pending Requests
      </Typography>
      <List>
        {pendingRequests.map((request) => (
          <ListItem key={request.anonymous_id}>
            <ListItemText primary={request.username || request.anonymous_id} />
            <Box>
              <Button
                sx={{ ...buttonStyles, mr: 1 }}
                onClick={() => acceptFriend(request.anonymous_id)}
              >
                Accept
              </Button>
              <Button
                sx={buttonStyles}
                onClick={() => rejectFriend(request.anonymous_id)}
              >
                Reject
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FriendsSection;