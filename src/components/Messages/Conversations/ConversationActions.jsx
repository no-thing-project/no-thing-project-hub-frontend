import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DoneAll, MoreVert } from '@mui/icons-material';

const ConversationActions = ({ item, onOpenMenu, onMarkRead, currentUserId, messages }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    {item.unreadCount > 0 && (
      <Tooltip title="Mark as read">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead();
          }}
          aria-label={`Mark ${item.name} as read`}
        >
          <DoneAll />
        </IconButton>
      </Tooltip>
    )}
    {!item.isFriend && (
      <IconButton
        edge="end"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu(e);
        }}
        aria-label={`More options for ${item.name}`}
      >
        <MoreVert />
      </IconButton>
    )}
  </Box>
);

ConversationActions.propTypes = {
  item: PropTypes.shape({
    conversation_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isFriend: PropTypes.bool,
    unreadCount: PropTypes.number,
  }).isRequired,
  onOpenMenu: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  messages: PropTypes.array.isRequired,
};

export default React.memo(ConversationActions);