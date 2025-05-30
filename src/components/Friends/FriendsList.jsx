import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

const FriendsList = ({ friends, onRemoveFriend }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Your Friends
      </Typography>
      <Divider />
      <List>
        {friends.length > 0 ? (
          friends.map((friend) => (
            <ListItem
              key={friend.anonymous_id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1,
                "&:hover": { backgroundColor: "background.hover" },
              }}
            >
              <ListItemText
                primary={friend.username || `User (${friend.anonymous_id})`} // Відображаємо username
                primaryTypographyProps={{ variant: "body1", fontWeight: 500 }}
              />
              <Button
                variant="outlined"
                color="error"
                onClick={() => onRemoveFriend(friend.anonymous_id)}
                sx={{ ...actionButtonStyles, minWidth: "100px" }}
              >
                Remove
              </Button>
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No friends yet. Add someone to get started!
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default FriendsList;