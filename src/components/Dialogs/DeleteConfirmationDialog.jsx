import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
} from "@mui/material";
import { actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";
import PropTypes from "prop-types";

const DeleteConfirmationDialog = ({ open, onClose, onConfirm, message, disabled }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: theme.shape.borderRadiusMedium,
          p: { xs: 1, md: 2 },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{ color: "text.primary", fontSize: { xs: "0.875rem", md: "1rem" } }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            ...cancelButtonStyle,
            minWidth: { xs: "100%", sm: 120 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
          disabled={disabled}
          aria-label="Cancel deletion"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          sx={{
            ...actionButtonStyles,
            backgroundColor: "error.main",
            "&:hover": {
              backgroundColor: "error.dark",
            },
            minWidth: { xs: "100%", sm: 120 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
          disabled={disabled}
          aria-label="Confirm deletion"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeleteConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default React.memo(DeleteConfirmationDialog);