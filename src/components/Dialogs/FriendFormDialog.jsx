import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { inputStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const FriendFormDialog = ({ open, title, username, setUsername, onSave, onCancel }) => {
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
          <TextField
            autoFocus
            margin="normal"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={inputStyles}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onSave} sx={actionButtonStyles}>
            Send Request
          </Button>
          <Button variant="contained" onClick={onCancel} sx={cancelButtonStyle}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default FriendFormDialog;