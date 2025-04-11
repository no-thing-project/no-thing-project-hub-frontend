import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import { inputStyles, selectStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const ClassFormDialog = ({ open, title, classData, setClass, onSave, onCancel, token, gates = [] }) => {
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setClass({ ...classData, [field]: value });
    setErrors((prev) => ({
      ...prev,
      [field]: field === "name" && !value.trim() ? "Class name is required" : "",
    }));
  };

  const isFormValid = () => {
    return classData.name.trim() && Object.values(errors).every((err) => !err);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <Box sx={{ p: 2 }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Class Name"
            fullWidth
            variant="outlined"
            value={classData.name}
            onChange={handleChange("name")}
            sx={inputStyles}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            margin="normal"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={classData.description}
            onChange={handleChange("description")}
            sx={inputStyles}
            helperText={`${classData.description.length}/500`}
            inputProps={{ maxLength: 500 }}
          />
          <FormControl fullWidth margin="normal" sx={selectStyles}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={classData.visibility}
              onChange={handleChange("visibility")}
              label="Visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="restricted">Restricted</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            <FormHelperText>
              {classData.visibility === "public"
                ? "Visible to everyone"
                : classData.visibility === "restricted"
                ? "Visible to gate members"
                : "Visible only to creator"}
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal" sx={selectStyles}>
            <InputLabel>Type</InputLabel>
            <Select
              value={classData.type}
              onChange={handleChange("type")}
              label="Type"
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="group">Group</MenuItem>
            </Select>
            <FormHelperText>
              {classData.type === "personal"
                ? "Managed by creator only"
                : "Collaborative class with members"}
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal" sx={selectStyles}>
            <InputLabel>Gate (optional)</InputLabel>
            <Select
              value={classData.gate_id || ""}
              onChange={handleChange("gate_id")}
              label="Gate (optional)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {gates.map((gate) => (
                <MenuItem key={gate.gate_id} value={gate.gate_id}>
                  {gate.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {classData.gate_id ? "Linked to a specific gate" : "Not linked to any gate"}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} sx={cancelButtonStyle}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={!isFormValid()}
            sx={actionButtonStyles}
          >
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ClassFormDialog;