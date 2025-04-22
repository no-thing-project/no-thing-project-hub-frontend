import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Skeleton,
} from '@mui/material';
import { Done, DoneAll } from '@mui/icons-material';
import { actionButtonStyles } from '../../styles/BaseStyles';

const MessagesList = ({ messages, currentUserId, onMarkRead, onDeleteMessage, isLoading }) => {
  const renderMessageStatus = useMemo(
    () => (msg) => {
      const isSentByCurrentUser = msg.sender_id === currentUserId;
      if (msg.is_read) {
        return <DoneAll sx={{ color: 'primary.main', fontSize: 16 }} />;
      }
      return isSentByCurrentUser ? (
        <Done sx={{ color: 'grey.600', fontSize: 16 }} />
      ) : (
        <Typography variant="caption">Unread</Typography>
      );
    },
    [currentUserId]
  );

  return (
    <Box sx={{ maxHeight: { xs: '50vh', md: '70vh' }, overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Your Messages
      </Typography>
      <Divider />
      {isLoading ? (
        <List>
          {[...Array(5)].map((_, i) => (
            <ListItem key={i} sx={{ py: 1 }}>
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="60%" />
            </ListItem>
          ))}
        </List>
      ) : (
        <List>
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isSentByCurrentUser = msg.sender_id === currentUserId;
              return (
                <ListItem
                  key={msg.message_id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    '&:hover': { backgroundColor: 'grey.100' },
                    backgroundColor: !msg.is_read && !isSentByCurrentUser ? 'grey.100' : 'inherit',
                    flexDirection: { xs: 'column', md: 'row' },
                  }}
                >
                  <ListItemText
                    primary={msg.content || 'Media message'}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">
                          From: {msg.sender_id} | To: {msg.receiver_id} |
                        </Typography>
                        {renderMessageStatus(msg)}
                      </Box>
                    }
                    primaryTypographyProps={{
                      fontWeight: !msg.is_read && !isSentByCurrentUser ? 600 : 400,
                      noWrap: true,
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: { xs: 1, md: 0 } }}>
                    {!msg.is_read && !isSentByCurrentUser && (
                      <Button
                        variant="contained"
                        onClick={() => onMarkRead(msg.message_id)}
                        sx={{ ...actionButtonStyles, minWidth: { xs: '100%', md: '120px' } }}
                        aria-label="Mark message as read"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => onDeleteMessage(msg.message_id)}
                      sx={{ ...actionButtonStyles, minWidth: { xs: '100%', md: '100px' } }}
                      aria-label="Delete message"
                    >
                      Delete
                    </Button>
                  </Box>
                </ListItem>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No messages yet. Start a conversation!
            </Typography>
          )}
        </List>
      )}
    </Box>
  );
};

MessagesList.propTypes = {
  messages: PropTypes.array.isRequired,
  currentUserId: PropTypes.string.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onDeleteMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

MessagesList.defaultProps = {
  isLoading: false,
};

export default React.memo