// src/components/Dialogs/ClassFormDialog.jsx
import React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { inputStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const ClassFormDialog = ({
  open,
  title,
  classData,
  setClass,
  onSave,
  onCancel,
  token,
  gates,
  disabled,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={classData.name}
            onChange={(e) => setClass({ ...classData, name: e.target.value })}
            sx={inputStyles}
            required
            disabled={disabled}
          />
          <TextField
            margin="normal"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={classData.description}
            onChange={(e) => setClass({ ...classData, description: e.target.value })}
            sx={inputStyles}
            disabled={disabled}
          />
          <FormControl fullWidth margin="normal" sx={inputStyles}>
            <InputLabel>Type</InputLabel>
            <Select
              value={classData.type}
              onChange={(e) => setClass({ ...classData, type: e.target.value })}
              label="Type"
              disabled={disabled}
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="group">Group</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" sx={inputStyles}>
            <InputLabel>Gate</InputLabel>
            <Select
              value={classData.gate_id || ""}
              onChange={(e) =>
                setClass({ ...classData, gate_id: e.target.value || null })
              }
              label="Gate"
              disabled={disabled}
            >
              <MenuItem value="">None</MenuItem>
              {gates.map((gate) => (
                <MenuItem key={gate.gate_id} value={gate.gate_id}>
                  {gate.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={classData.is_public}
                onChange={(e) => setClass({ ...classData, is_public: e.target.checked })}
                disabled={disabled}
              />
            }
            label="Public"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={onSave}
            sx={actionButtonStyles}
            disabled={disabled || !classData.name.trim()}
          >
            Save
          </Button>
          <Button
            variant="contained"
            onClick={onCancel}
            sx={cancelButtonStyle}
            disabled={disabled}
          >
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ClassFormDialog;