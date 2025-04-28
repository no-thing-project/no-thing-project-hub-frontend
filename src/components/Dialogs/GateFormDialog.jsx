import React, { useState, useCallback } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
} from "@mui/material";
import { inputStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";
import { validateForm, validateField } from "../../utils/validations";

const GateFormDialog = ({ open, title, gate, setGate, onSave, onCancel, disabled }) => {
  const [errors, setErrors] = useState({});

  const validationRules = {
    name: {
      value: gate.name,
      rules: { required: true, minLength: 3, maxLength: 100 },
    },
    description: {
      value: gate.description,
      rules: { maxLength: 1000 },
    },
    visibility: {
      value: gate.visibility,
      rules: { required: true },
    },
    "settings.class_creation_cost": {
      value: gate.settings.class_creation_cost,
      rules: { required: true, minValue: 0 },
    },
    "settings.board_creation_cost": {
      value: gate.settings.board_creation_cost,
      rules: { required: true, minValue: 0 },
    },
    "settings.max_members": {
      value: gate.settings.max_members,
      rules: { required: true, minValue: 1, maxValue: 10000 },
    },
  };

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      let newValue = type === "checkbox" ? checked : value;

      if (name.startsWith("settings.")) {
        const settingKey = name.split(".")[1];
        newValue = type === "number" ? Number(value) : checked;
        setGate((prev) => ({
          ...prev,
          settings: { ...prev.settings, [settingKey]: newValue },
        }));
      } else if (name === "visibility") {
        setGate((prev) => ({
          ...prev,
          visibility: value,
          is_public: value === "public",
        }));
      } else {
        setGate((prev) => ({
          ...prev,
          [name]: newValue,
        }));
      }

      const fieldRules = validationRules[name] || {};
      const fieldErrors = validateField(name, newValue, fieldRules.rules || {});
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || null,
      }));
    },
    [setGate]
  );

  const handleSave = () => {
    const formErrors = validateForm(validationRules);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setGate((prev) => ({
      ...prev,
      is_public: prev.visibility === "public", 
    }));
    onSave();
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Name"
            name="name"
            type="text"
            fullWidth
            variant="outlined"
            value={gate.name}
            onChange={handleChange}
            sx={inputStyles}
            required
            disabled={disabled}
            error={!!errors.name}
            helperText={errors.name || "Enter a unique gate name"}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            margin="normal"
            label="Description"
            name="description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={gate.description}
            onChange={handleChange}
            sx={inputStyles}
            disabled={disabled}
            error={!!errors.description}
            helperText={errors.description}
            inputProps={{ maxLength: 1000 }}
          />
          <FormControl fullWidth margin="normal" sx={inputStyles} error={!!errors.visibility}>
            <InputLabel>Visibility</InputLabel>
            <Select
              name="visibility"
              value={gate.visibility}
              onChange={handleChange}
              label="Visibility"
              disabled={disabled}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            {errors.visibility && <FormHelperText>{errors.visibility}</FormHelperText>}
          </FormControl>
          <TextField
            margin="normal"
            label="Class Creation Cost"
            name="settings.class_creation_cost"
            type="number"
            fullWidth
            variant="outlined"
            value={gate.settings.class_creation_cost}
            onChange={handleChange}
            sx={inputStyles}
            disabled={disabled}
            error={!!errors["settings.class_creation_cost"]}
            helperText={errors["settings.class_creation_cost"]}
            inputProps={{ min: 0 }}
          />
          <TextField
            margin="normal"
            label="Board Creation Cost"
            name="settings.board_creation_cost"
            type="number"
            fullWidth
            variant="outlined"
            value={gate.settings.board_creation_cost}
            onChange={handleChange}
            sx={inputStyles}
            disabled={disabled}
            error={!!errors["settings.board_creation_cost"]}
            helperText={errors["settings.board_creation_cost"]}
            inputProps={{ min: 0 }}
          />
          <TextField
            margin="normal"
            label="Max Members"
            name="settings.max_members"
            type="number"
            fullWidth
            variant="outlined"
            value={gate.settings.max_members}
            onChange={handleChange}
            sx={inputStyles}
            disabled={disabled}
            error={!!errors["settings.max_members"]}
            helperText={errors["settings.max_members"]}
            inputProps={{ min: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                name="settings.ai_moderation_enabled"
                checked={gate.settings.ai_moderation_enabled}
                onChange={handleChange}
                disabled={disabled}
              />
            }
            label="Enable AI Moderation"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={actionButtonStyles}
            disabled={disabled || Object.keys(errors).some((key) => errors[key])}
            aria-label="Save gate"
          >
            Save
          </Button>
          <Button
            variant="contained"
            onClick={onCancel}
            sx={cancelButtonStyle}
            disabled={disabled}
            aria-label="Cancel"
          >
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(GateFormDialog);