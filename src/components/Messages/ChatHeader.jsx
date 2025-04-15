import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Settings } from '@mui/icons-material';

/**
 * ChatHeader component for displaying conversation details
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const ChatHeader = ({ recipient, isGroupChat, onSettingsOpen }) => {
  // Determine display name and avatar
  const displayName = isGroupChat
    ? recipient?.name || 'Group Chat'
    : recipient?.username || 'Unknown User';
  const avatarSrc = recipient?.profile_image || null;
  const avatarAlt = `Avatar for ${displayName}`;

  // Fallback if recipient is undefined
  if (!recipient) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: { xs: 1, md: 2 },
          bgcolor: 'primary.main',
          color: 'white',
        }}
        aria-label="Loading conversation header"
      >
        <CircularProgress size={24} color="inherit" aria-label="Loading" />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: { xs: 1, md: 2 },
        bgcolor: 'primary.main',
        color: 'white',
        borderBottom: '1px solid',
        borderColor: 'grey.300',
      }}
      aria-label={`Conversation with ${displayName}`}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={avatarSrc}
          alt={avatarAlt}
          sx={{ width: 40, height: 40 }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 'medium' }}>
            {displayName}
          </Typography>
          {isGroupChat && (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Group Chat
            </Typography>
          )}
        </Box>
      </Box>
      <IconButton
        onClick={onSettingsOpen}
        color="inherit"
        aria-label="Open chat settings"
        sx={{ p: 1 }}
      >
        <Settings />
      </IconButton>
    </Box>
  );
};

ChatHeader.propTypes = {
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
    profile_image: PropTypes.string,
  }),
  isGroupChat: PropTypes.bool.isRequired,
  onSettingsOpen: PropTypes.func.isRequired,
};

export default React.memo(ChatHeader);