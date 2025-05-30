import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from "@mui/material";
import { actionButtonStyles } from "../../styles/BaseStyles";

// Стилі як константи
const listItemStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  py: 1,
  "&:hover": { backgroundColor: "background.hover" },
};

const buttonContainerStyles = {
  display: "flex",
  gap: 1,
};

// Компоненти для кнопок
const AcceptButton = ({ onClick }) => (
  <Button
    variant="contained"
    onClick={onClick}
    sx={{ ...actionButtonStyles, minWidth: "100px" }}
  >
    Accept
  </Button>
);

const RejectButton = ({ onClick }) => (
  <Button
    variant="outlined"
    color="error"
    onClick={onClick}
    sx={{ ...actionButtonStyles, minWidth: "100px" }}
  >
    Reject
  </Button>
);

const CancelButton = ({ onClick }) => (
  <Button
    variant="outlined"
    color="warning"
    onClick={onClick}
    sx={{ ...actionButtonStyles, minWidth: "100px" }}
  >
    Cancel
  </Button>
);

const PendingRequestsList = ({ pendingRequests, onAcceptFriend, onRejectFriend }) => {
  const hasPendingRequests = pendingRequests.length > 0;

  const renderRequestActions = (request) => {
    const { direction, anonymous_id } = request;
    const isIncoming = direction === "incoming";

    return (
      <Box sx={buttonContainerStyles}>
        {isIncoming ? (
          <>
            <AcceptButton onClick={() => onAcceptFriend(anonymous_id)} />
            <RejectButton onClick={() => onRejectFriend(anonymous_id)} />
          </>
        ) : (
          <CancelButton onClick={() => onRejectFriend(anonymous_id)} />
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Pending Friend Requests
      </Typography>
      <Divider />
      <List>
        {hasPendingRequests ? (
          pendingRequests.map((request) => {
            const { anonymous_id, username, direction } = request;
            const displayName = username || `User (${anonymous_id})`;
            const statusText = direction === "outgoing" ? "Sent by you" : "Received";

            return (
              <ListItem key={anonymous_id} sx={listItemStyles}>
                <ListItemText
                  primary={displayName}
                  secondary={statusText}
                  primaryTypographyProps={{ variant: "body1", fontWeight: 500 }}
                />
                {renderRequestActions(request)}
              </ListItem>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No pending requests at the moment.
          </Typography>
        )}
      </List>
    </Box>
  );
};

PendingRequestsList.propTypes = {
  pendingRequests: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
      direction: PropTypes.oneOf(["incoming", "outgoing"]).isRequired,
    })
  ).isRequired,
  onAcceptFriend: PropTypes.func.isRequired,
  onRejectFriend: PropTypes.func.isRequired,
};

export default PendingRequestsList;