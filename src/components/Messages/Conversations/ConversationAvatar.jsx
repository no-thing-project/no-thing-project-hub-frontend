import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Badge } from '@mui/material';
import { Group, Person, Archive, NotificationsOff, PushPin } from '@mui/icons-material';

const ConversationAvatar = ({ item, currentUserId }) => (
  <Badge
    overlap="circular"
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    badgeContent={
      item.isArchived ? (
        <Archive fontSize="small" color="action" />
      ) : item.mutedBy.includes(currentUserId) ? (
        <NotificationsOff fontSize="small" color="action" />
      ) : item.pinnedBy.includes(currentUserId) ? (
        <PushPin fontSize="small" color="primary" />
      ) : null
    }
  >
    <Avatar
      sx={{
        bgcolor: item.isGroup
          ? 'secondary.main'
          : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        width: 40,
        height: 40,
      }}
    >
      {item.isGroup ? <Group /> : item.isFriend ? <Person /> : <Person />}
    </Avatar>
  </Badge>
);

ConversationAvatar.propTypes = {
  item: PropTypes.shape({
    isGroup: PropTypes.bool,
    isFriend: PropTypes.bool,
    pinnedBy: PropTypes.arrayOf(PropTypes.string),
    mutedBy: PropTypes.arrayOf(PropTypes.string),
    isArchived: PropTypes.bool,
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default React.memo(ConversationAvatar);