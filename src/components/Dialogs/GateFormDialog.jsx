import React, { useState, useCallback, useMemo } from "react";
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
  useTheme,
} from "@mui/material";
import { inputStyles, actionButtonStyles, cancelButtonStyle, selectStyles } from "../../styles/BaseStyles";
import { validateForm, validateField } from "../../utils/validations";
import PropTypes from "prop-types";

const GateFormDialog = ({ open, title, gate, setGate, onSave, onCancel, disabled }) => {
  const theme = useTheme();
  const [errors, setErrors] = useState({});

  const validationRules = useMemo(
    () => ({
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
    }),
    [gate]
  );

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

      const fieldRules = validationRules[name]?.rules || {};
      const fieldErrors = validateField(name, newValue, fieldRules);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || null,
      }));
    },
    [setGate, validationRules]
  );

  const handleSave = useCallback(() => {
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
  }, [onSave, setGate, validationRules]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: theme.shape.borderRadiusMedium,
          p: { xs: 1, md: 2 },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 }, mt: 2 }}>
          <TextField
            label="Gate Name"
            name="name"
            value={gate.name || ""}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ maxLength: 100 }}
            aria-label="Gate name"
          />
          <TextField
            label="Description"
            name="description"
            value={gate.description || ""}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            error={!!errors.description}
            helperText={errors.description}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ maxLength: 1000 }}
            aria-label="Gate description"
          />
          <FormControl
            fullWidth
            error={!!errors.visibility}
            disabled={disabled}
            sx={{ ...selectStyles, mt: 0 }}
          >
            <InputLabel>Visibility</InputLabel>
            <Select
              name="visibility"
              value={gate.visibility || "public"}
              onChange={handleChange}
              label="Visibility"
              aria-label="Gate visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            {errors.visibility && <FormHelperText>{errors.visibility}</FormHelperText>}
          </FormControl>
          <TextField
            label="Class Creation Cost"
            name="settings.class_creation_cost"
            type="number"
            value={gate.settings.class_creation_cost || 0}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors["settings.class_creation_cost"]}
            helperText={errors["settings.class_creation_cost"]}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ min: 0 }}
            aria-label="Class creation cost"
          />
          <TextField
            label="Board Creation Cost"
            name="settings.board_creation_cost"
            type="number"
            value={gate.settings.board_creation_cost || 0}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors["settings.board_creation_cost"]}
            helperText={errors["settings.board_creation_cost"]}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ min: 0 }}
            aria-label="Board creation cost"
          />
          <TextField
            label="Max Members"
            name="settings.max_members"
            type="number"
            value={gate.settings.max_members || 1000}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors["settings.max_members"]}
            helperText={errors["settings.max_members"]}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ min: 1, max: 10000 }}
            aria-label="Maximum members"
          />
          <FormControlLabel
            control={
              <Switch
                checked={gate.settings.ai_moderation_enabled || false}
                onChange={handleChange}
                name="settings.ai_moderation_enabled"
                disabled={disabled}
              />
            }
            label="Enable AI Moderation"
            sx={{ color: "text.primary" }}
            aria-label="Enable AI moderation"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onCancel}
          sx={{
            ...cancelButtonStyle,
            minWidth: { xs: "100%", sm: 150 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
          disabled={disabled}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          sx={{
            ...actionButtonStyles,
            minWidth: { xs: "100%", sm: 150 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
          disabled={disabled}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

GateFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  gate: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    visibility: PropTypes.string,
    settings: PropTypes.shape({
      class_creation_cost: PropTypes.number,
      board_creation_cost: PropTypes.number,
      max_members: PropTypes.number,
      ai_moderation_enabled: PropTypes.bool,
    }),
  }).isRequired,
  setGate: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default React.memo(GateFormDialog);