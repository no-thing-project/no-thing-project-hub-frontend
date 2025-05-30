import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

const GroupChatModal = ({ open, onClose, friends, currentUserId, onCreate }) => {
  const theme = useTheme();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = () => {
    if (!groupName.trim()) {
      alert('Please enter a group name.');
      return;
    }
    if (selectedMembers.length === 0) {
      alert('Please select at least one member.');
      return;
    }
    onCreate(groupName, selectedMembers);
    setGroupName('');
    setSelectedMembers([]);
  };

  const handleMemberChange = (event) => {
    setSelectedMembers(event.target.value);
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.anonymous_id !== currentUserId &&
      (friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.anonymous_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-group-title"
    >
      <DialogTitle id="create-group-title">Create Group Chat</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          sx={{ mb: 2, bgcolor: 'white', borderRadius: 1 }}
          aria-label="Group name"
        />
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2, bgcolor: 'white', borderRadius: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchQuery && (
                  <IconButton onClick={() => setSearchQuery('')} aria-label="Clear search">
                    <Clear />
                  </IconButton>
                )}
                <Search aria-hidden="true" />
              </InputAdornment>
            ),
          }}
          aria-label="Search friends for group"
        />
        <FormControl fullWidth>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Select Members
          </Typography>
          <Select
            multiple
            value={selectedMembers}
            onChange={handleMemberChange}
            renderValue={(selected) =>
              selected
                .map((id) => friends.find((f) => f.anonymous_id === id)?.username)
                .join(', ')
            }
            sx={{ bgcolor: 'white', borderRadius: 1 }}
            aria-label="Select group members"
          >
            {filteredFriends.map((friend) => (
              <MenuItem key={friend.anonymous_id} value={friend.anonymous_id}>
                {friend.username || `User (${friend.anonymous_id})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel group creation">
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          aria-label="Create group"
          sx={{ borderRadius: 1 }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GroupChatModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default React.memo(GroupChatModal);