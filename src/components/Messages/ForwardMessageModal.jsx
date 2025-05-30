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
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

const ForwardMessageModal = ({ open, onClose, friends, currentUserId, onForward }) => {
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleForward = () => {
    if (selectedRecipients.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }
    onForward(selectedRecipients);
    onClose();
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
    >
      <DialogTitle>Forward Message</DialogTitle>
      <DialogContent>
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
                  <IconButton onClick={() => setSearchQuery('')}>
                    <Clear />
                  </IconButton>
                )}
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <FormControl fullWidth>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Select Recipients
          </Typography>
          <Select
            multiple
            value={selectedRecipients}
            onChange={(e) => setSelectedRecipients(e.target.value)}
            renderValue={(selected) =>
              selected
                .map((id) => friends.find((f) => f.anonymous_id === id)?.username)
                .join(', ')
            }
            sx={{ bgcolor: 'white', borderRadius: 1 }}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleForward}
          variant="contained"
          sx={{ borderRadius: 1 }}
        >
          Forward
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ForwardMessageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  currentUserId: PropTypes.string.isRequired,
  onForward: PropTypes.func.isRequired,
};

export default React.memo(ForwardMessageModal);