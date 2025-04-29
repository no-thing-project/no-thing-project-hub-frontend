import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  Tooltip,
  useTheme,
} from "@mui/material";
import { inputStyles, actionButtonStyles, cancelButtonStyle, selectStyles } from "../../styles/BaseStyles";
import { validateForm, validateField } from "../../utils/validations";
import PropTypes from "prop-types";

const ClassFormDialog = ({ open, title, classItem, setClass, onSave, onCancel, disabled, gates, fixedGateId }) => {
  const theme = useTheme();
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  const validationRules = useMemo(
    () => ({
      name: {
        value: classItem.name || "",
        rules: { required: true, minLength: 3, maxLength: 100 },
      },
      description: {
        value: classItem.description || "",
        rules: { maxLength: 1000 },
      },
      visibility: {
        value: classItem.visibility || "private",
        rules: { required: true, enum: ["public", "private"] },
      },
      gate_id: {
        value: classItem.gate_id || "",
        rules: { required: classItem.visibility === "public" && !fixedGateId },
      },
      "settings.max_boards": {
        value: classItem.settings?.max_boards || 100,
        rules: { required: true, minValue: 1, maxValue: 1000 },
      },
      "settings.max_members": {
        value: classItem.settings?.max_members || 50,
        rules: { required: true, minValue: 1, maxValue: 10000 },
      },
      "settings.board_creation_cost": {
        value: classItem.settings?.board_creation_cost || 50,
        rules: { required: true, minValue: 0 },
      },
      "settings.tweet_cost": {
        value: classItem.settings?.tweet_cost || 1,
        rules: { required: true, minValue: 0 },
      },
      "settings.auto_archive_after": {
        value: classItem.settings?.auto_archive_after || 30,
        rules: { required: true, minValue: 1 },
      },
    }),
    [classItem, fixedGateId]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      let newValue = type === "checkbox" ? checked : value;

      if (name.startsWith("settings.")) {
        const settingKey = name.split(".")[1];
        newValue = type === "number" ? Number(value) : checked;
        setClass((prev) => ({
          ...prev,
          settings: { ...prev.settings, [settingKey]: newValue },
        }));
      } else {
        setClass((prev) => ({
          ...prev,
          [name]: newValue,
          ...(name === "visibility" && { is_public: value === "public" }),
        }));
      }

      const fieldRules = validationRules[name]?.rules || {};
      const fieldErrors = validateField(name, newValue, fieldRules);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || null,
      }));
    },
    [setClass, validationRules]
  );

  const handleSave = useCallback(() => {
    const formErrors = validateForm(validationRules);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    onSave();
  }, [onSave, validationRules]);

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
      aria-labelledby="class-form-dialog-title"
      aria-describedby="class-form-dialog-description"
    >
      <DialogTitle id="class-form-dialog-title" sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 }, mt: 2 }}>
          <TextField
            label="Class Name"
            name="name"
            value={classItem.name || ""}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ maxLength: 100 }}
            inputRef={firstInputRef}
            aria-label="Class name"
          />
          <TextField
            label="Description"
            name="description"
            value={classItem.description || ""}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            error={!!errors.description}
            helperText={errors.description}
            sx={{ ...inputStyles, mt: 0 }}
            disabled={disabled}
            inputProps={{ maxLength: 1000 }}
            aria-label="Class description"
          />
          <FormControl
            fullWidth
            error={!!errors.visibility}
            disabled={disabled}
            sx={{ ...selectStyles, mt: 0 }}
          >
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select
              labelId="visibility-label"
              name="visibility"
              value={classItem.visibility || "private"}
              onChange={handleChange}
              label="Visibility"
              aria-label="Class visibility"
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
            {errors.visibility && <FormHelperText>{errors.visibility}</FormHelperText>}
          </FormControl>
          {classItem.visibility === "public" && !fixedGateId && (
            <FormControl
              fullWidth
              error={!!errors.gate_id}
              disabled={disabled || gates.length === 0}
              sx={{ ...selectStyles, mt: 0 }}
            >
              <InputLabel id="gate-label">Gate</InputLabel>
              <Select
                labelId="gate-label"
                name="gate_id"
                value={classItem.gate_id || ""}
                onChange={handleChange}
                label="Gate"
                aria-label="Select gate for public class"
              >
                {gates.length === 0 ? (
                  <MenuItem value="" disabled>
                    No gates available
                  </MenuItem>
                ) : (
                  gates.map((gate) => (
                    <MenuItem key={gate.gate_id} value={gate.gate_id}>
                      {gate.name}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.gate_id && <FormHelperText>{errors.gate_id}</FormHelperText>}
            </FormControl>
          )}
          {fixedGateId && classItem.visibility === "public" && (
            <TextField
              label="Gate"
              value={gates.find((g) => g.gate_id === fixedGateId)?.name || "Selected Gate"}
              fullWidth
              disabled
              sx={{ ...inputStyles, mt: 0 }}
              aria-label="Selected gate"
            />
          )}
          <Tooltip title="Maximum number of boards allowed in the class">
            <TextField
              label="Max Boards"
              name="settings.max_boards"
              type="number"
              value={classItem.settings?.max_boards || 100}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.max_boards"]}
              helperText={errors["settings.max_boards"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1, max: 1000 }}
              aria-label="Maximum boards"
            />
          </Tooltip>
          <Tooltip title="Points required to create a new board">
            <TextField
              label="Board Creation Cost"
              name="settings.board_creation_cost"
              type="number"
              value={classItem.settings?.board_creation_cost || 50}
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
          </Tooltip>
          <Tooltip title="Points required to post a tweet in the class">
            <TextField
              label="Tweet Cost"
              name="settings.tweet_cost"
              type="number"
              value={classItem.settings?.tweet_cost || 1}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.tweet_cost"]}
              helperText={errors["settings.tweet_cost"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 0 }}
              aria-label="Tweet cost"
            />
          </Tooltip>
          <Tooltip title="Maximum number of members allowed in the class">
            <TextField
              label="Max Members"
              name="settings.max_members"
              type="number"
              value={classItem.settings?.max_members || 50}
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
          </Tooltip>
          <Tooltip title="Days after which inactive boards are archived">
            <TextField
              label="Auto Archive After (days)"
              name="settings.auto_archive_after"
              type="number"
              value={classItem.settings?.auto_archive_after || 30}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.auto_archive_after"]}
              helperText={errors["settings.auto_archive_after"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1 }}
              aria-label="Auto archive after days"
            />
          </Tooltip>
          <FormControlLabel
            control={
              <Switch
                checked={classItem.settings?.ai_moderation_enabled || false}
                onChange={handleChange}
                name="settings.ai_moderation_enabled"
                disabled={disabled}
                aria-label="Enable AI moderation"
              />
            }
            label="Enable AI Moderation"
            sx={{ color: "text.primary" }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={classItem.settings?.allow_invites || false}
                onChange={handleChange}
                name="settings.allow_invites"
                disabled={disabled}
                aria-label="Allow invites"
              />
            }
            label="Allow Invites"
            sx={{ color: "text.primary" }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={classItem.settings?.require_approval || false}
                onChange={handleChange}
                name="settings.require_approval"
                disabled={disabled}
                aria-label="Require approval"
              />
            }
            label="Require Approval"
            sx={{ color: "text.primary" }}
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
          aria-label="Cancel class form"
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
          aria-label="Save class form"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ClassFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  classItem: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    visibility: PropTypes.string,
    gate_id: PropTypes.string,
    settings: PropTypes.shape({
      max_boards: PropTypes.number,
      max_members: PropTypes.number,
      board_creation_cost: PropTypes.number,
      tweet_cost: PropTypes.number,
      allow_invites: PropTypes.bool,
      require_approval: PropTypes.bool,
      ai_moderation_enabled: PropTypes.bool,
      auto_archive_after: PropTypes.number,
    }),
  }).isRequired,
  setClass: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  gates: PropTypes.arrayOf(
    PropTypes.shape({
      gate_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  fixedGateId: PropTypes.string,
};

export default React.memo(ClassFormDialog);