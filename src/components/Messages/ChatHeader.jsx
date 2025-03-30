import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, IconButton } from "@mui/material";
import { Settings } from "@mui/icons-material";

const headerStyles = {
  p: 2,
  borderBottom: "1px solid",
  borderColor: "grey.300",
  backgroundColor: "grey.50",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const ChatHeader = ({ recipient, isGroupChat, onSettingsOpen }) => (
  <Box sx={headerStyles}>
    <Typography variant="h6">
      {isGroupChat
        ? `Group: ${recipient?.name || "Unnamed Group"}`
        : `Chat with ${recipient?.username || `User (${recipient?.anonymous_id})`}`}
    </Typography>
    <IconButton onClick={onSettingsOpen} aria-label="settings">
      <Settings />
    </IconButton>
  </Box>
);

ChatHeader.propTypes = {
  recipient: PropTypes.object,
  isGroupChat: PropTypes.bool.isRequired,
  onSettingsOpen: PropTypes.func.isRequired,
};

export default ChatHeader;