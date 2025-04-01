import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import { useNotification } from "../../context/NotificationContext";

const MODAL_STYLES = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
  width: { xs: "90%", md: "400px" },
};

const GroupChatModal = ({ open, onClose, friends, currentUserId, onCreate }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleSave = () => {
    if (!name.trim() || selectedMembers.length === 0) {
      showNotification("Please enter a name and select at least one member.", "error");
      return;
    }
    onCreate(name, selectedMembers);
    setName("");
    setSelectedMembers([]);
  };

  const handleMemberChange = (event) => setSelectedMembers(event.target.value);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={MODAL_STYLES}>
        <Typography variant="h6" gutterBottom>
          Create Group Chat
        </Typography>

        <TextField
          fullWidth
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body1">Select Members</Typography>
          <Select
            multiple
            value={selectedMembers}
            onChange={handleMemberChange}
            renderValue={(selected) =>
              selected
                .map(
                  (id) =>
                    friends.find((f) => f.anonymous_id === id)?.username ||
                    `User (${id})`
                )
                .join(", ")
            }
          >
            {friends.map((friend) => (
              <MenuItem key={friend.anonymous_id} value={friend.anonymous_id}>
                {friend.username || `User (${friend.anonymous_id})`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSave}>
          Create
        </Button>
      </Box>
    </Modal>
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

export default GroupChatModal;
