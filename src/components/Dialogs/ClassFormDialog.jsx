// src/components/Dialogs/ClassFormDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ClassFormDialog = ({ open, title, classData, setClass, onSave, onCancel }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          value={classData.name}
          onChange={(e) => setClass((prev) => ({ ...prev, name: e.target.value }))}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={classData.description}
          onChange={(e) => setClass((prev) => ({ ...prev, description: e.target.value }))}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Visibility</InputLabel>
          <Select
            value={classData.visibility}
            onChange={(e) => setClass((prev) => ({ ...prev, visibility: e.target.value }))}
          >
            <MenuItem value="Public">Public</MenuItem>
            <MenuItem value="Private">Private</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassFormDialog;