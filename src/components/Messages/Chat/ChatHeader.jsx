import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Skeleton,
  Chip,
  Alert,
} from '@mui/material';
import { Settings } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const ChatHeader = ({ recipient, isGroupChat, onSettingsOpen, socket, friends, currentUserId }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const avatarRef = useRef(null);
  const socketListenerId = useRef(`chatheader-${uuidv4()}`);

  const displayName = useMemo(() => {
    if (isGroupChat) {
      if (recipient?.name) return recipient.name;
      const participantNames = recipient?.participants
        ?.filter((id) => id !== currentUserId)
        .map((id) => friends.find((f) => f.anonymous_id === id)?.username || 'Unknown')
        .filter(Boolean);
      return participantNames?.length > 0 ? participantNames.join(', ') : 'Unnamed Group';
    }
    const friend = friends.find(
      (f) => recipient?.participants?.includes(f.anonymous_id) && f.anonymous_id !== currentUserId
    );
    return friend?.username || recipient?.username || 'Unknown User';
  }, [isGroupChat, recipient, friends, currentUserId]);

  const avatarSrc = useMemo(() => recipient?.profile_image || null, [recipient]);
  const avatarAlt = `Avatar for ${displayName}`;

  const handleOnlineStatus = useCallback(
    ({ userId, status }) => {
      if (!isGroupChat && recipient?.anonymous_id === userId) {
        setIsOnline(status);
        setIsLoading(false);
      }
    },
    [isGroupChat, recipient?.anonymous_id]
  );

  const handleTypingStatus = useCallback(
    ({ userId, status }) => {
      if (!isGroupChat && recipient?.anonymous_id === userId) {
        setIsTyping(status);
      }
    },
    [isGroupChat, recipient?.anonymous_id]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && avatarSrc) {
          const img = new Image();
          img.src = avatarSrc;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (avatarRef.current) observer.observe(avatarRef.current);
    return () => observer.disconnect();
  }, [avatarSrc]);

  useEffect(() => {
    if (!socket || isGroupChat || !recipient?.anonymous_id) {
      setIsLoading(false);
      return;
    }

    socket.emit('check_online', recipient.anonymous_id);
    socket.on(`online_status_${socketListenerId.current}`, handleOnlineStatus);
    socket.on(`typing_status_${socketListenerId.current}`, handleTypingStatus);
    socket.on('connect_error', (err) => {
      setError('Connection error. Retrying...');
      console.error('Socket connect error:', err);
    });

    return () => {
      socket.off(`online_status_${socketListenerId.current}`, handleOnlineStatus);
      socket.off(`typing_status_${socketListenerId.current}`, handleTypingStatus);
      socket.off('connect_error');
    };
  }, [socket, isGroupChat, recipient?.anonymous_id, handleOnlineStatus, handleTypingStatus]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!recipient) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="text" width={150} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'primary.main',
        color: 'white',
        borderBottom: '1px solid',
        borderColor: 'grey.300',
      }}
      aria-label="Chat Header"
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1, width: '100%' }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          ref={avatarRef}
        >
          {isLoading ? (
            <Skeleton variant="circular" width={40} height={40} />
          ) : (
            <Avatar
              src={avatarSrc}
              alt={avatarAlt}
              sx={{ width: 40, height: 40 }}
              imgProps={{ loading: 'lazy' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
          )}
        </motion.div>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            {displayName}
          </Typography>
          {isGroupChat ? (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Group Chat ({recipient?.participants?.length || 0} members)
            </Typography>
          ) : isLoading ? (
            <Skeleton variant="text" width={60} sx={{ mt: 0.5 }} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Chip
                label={isTyping ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
                size="small"
                color={isTyping ? 'warning' : isOnline ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </motion.div>
          )}
        </Box>
      </Box>
      <IconButton
        onClick={onSettingsOpen}
        color="inherit"
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
    name: PropTypes.string,
    username: PropTypes.string,
    profile_image: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
  }),
  isGroupChat: PropTypes.bool.isRequired,
  onSettingsOpen: PropTypes.func.isRequired,
  socket: PropTypes.object,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default React.memo(ChatHeader);