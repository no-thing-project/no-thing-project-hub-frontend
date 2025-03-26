import React from "react";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

const PendingRequestsList = ({ pendingRequests, onAcceptFriend, onRejectFriend }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Pending Friend Requests
      </Typography>
      <Divider />
      <List>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <ListItem
              key={request.anonymous_id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 1,
                "&:hover": { backgroundColor: "background.hover" },
              }}
            >
              <ListItemText
                primary={request.username || `User (${request.anonymous_id})`} // Відображаємо username
                primaryTypographyProps={{ variant: "body1", fontWeight: 500 }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => onAcceptFriend(request.anonymous_id)}
                  sx={{ ...actionButtonStyles, minWidth: "100px" }}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => onRejectFriend(request.anonymous_id)}
                  sx={{ ...actionButtonStyles, minWidth: "100px" }}
                >
                  Reject
                </Button>
              </Box>
            </ListItem>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No pending requests at the moment.
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default PendingRequestsList;