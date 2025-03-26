import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { inputStyles, selectStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const MessageFormDialog = ({
  open,
  title,
  recipientId,
  setRecipientId,
  newMessage,
  setNewMessage,
  friends,
  onSave,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <Box
        sx={{
          maxWidth: 500,
          margin: "0 auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            fullWidth
            variant="outlined"
            displayEmpty
            sx={selectStyles}
            renderValue={(selected) => {
              if (!selected) return <em>Select a friend</em>;
              const friend = friends.find((f) => f.anonymous_id === selected);
              return friend ? friend.username || friend.anonymous_id : selected;
            }}
          >
            <MenuItem value="" disabled>
              <em>Select a friend</em>
            </MenuItem>
            {friends.map((friend) => (
              <MenuItem key={friend.anonymous_id} value={friend.anonymous_id}>
                {friend.username || friend.anonymous_id}
              </MenuItem>
            ))}
          </Select>
          <TextField
            margin="normal"
            label="Message"
            type="text"
            fullWidth
            variant="outlined"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={inputStyles}
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onSave} sx={actionButtonStyles}>
            Send
          </Button>
          <Button variant="contained" onClick={onCancel} sx={cancelButtonStyle}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default MessageFormDialog;