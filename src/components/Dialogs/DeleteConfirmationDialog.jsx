// DeleteConfirmationDialog.js
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";
import { cancelButtonStyle, deleteButtonStyle } from "../../styles/BaseStyles";

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this board? This action cannot be undone.",
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
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
          <Typography>{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={onConfirm}
            autoFocus
            sx={deleteButtonStyle}
          >
            Delete
          </Button>
          <Button variant="contained" onClick={onClose} sx={cancelButtonStyle}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
