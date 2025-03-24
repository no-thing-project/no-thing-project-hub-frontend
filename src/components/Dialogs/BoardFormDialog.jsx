// BoardFormDialog.js
import React from "react";
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Button } from "@mui/material";
import { inputStyles, selectStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const BoardFormDialog = ({ open, title, board, setBoard, onSave, onCancel, errorMessage }) => {
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
            label="Board Name"
            type="text"
            fullWidth
            variant="outlined"
            value={board.name}
            onChange={(e) => setBoard({ ...board, name: e.target.value })}
            sx={inputStyles}
            required
            error={!!errorMessage && errorMessage.includes("Board")}
          />
          <TextField
            margin="normal"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={board.description}
            onChange={(e) => setBoard({ ...board, description: e.target.value })}
            sx={inputStyles}
          />
          <Select
            margin="normal"
            value={board.visibility}
            onChange={(e) => setBoard({ ...board, visibility: e.target.value })}
            fullWidth
            variant="outlined"
            sx={selectStyles}
          >
            <MenuItem value="Public">Public</MenuItem>
            <MenuItem value="Private">Private</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onSave} sx={actionButtonStyles}>
            Save
          </Button>
          <Button variant="contained" onClick={onCancel} sx={cancelButtonStyle}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default BoardFormDialog;
