import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, IconButton } from "@mui/material";
import { Settings } from "@mui/icons-material";

const HEADER_STYLES = {
  p: 2,
  borderBottom: "1px solid",
  borderColor: "grey.300",
  backgroundColor: "grey.50",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const ChatHeader = ({ recipient, isGroupChat, onSettingsOpen }) => {
  const displayName = isGroupChat
    ? `Group: ${recipient?.name || "Unnamed Group"}`
    : `Chat with ${recipient?.username || recipient?.anonymous_id || "Unknown User"}`;

  return (
    <Box sx={HEADER_STYLES}>
      <Typography variant="h6">{displayName}</Typography>
      <IconButton onClick={onSettingsOpen} aria-label="settings">
        <Settings />
      </IconButton>
    </Box>
  );
};

ChatHeader.propTypes = {
  recipient: PropTypes.object,
  isGroupChat: PropTypes.bool.isRequired,
  onSettingsOpen: PropTypes.func.isRequired,
};

ChatHeader.defaultProps = {
  recipient: {},
};

export default ChatHeader;
