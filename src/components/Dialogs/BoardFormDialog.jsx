import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
} from "@mui/material";
import PropTypes from "prop-types";
import { validateForm, validateField } from "../../utils/validations";
import {
  inputStyles,
  selectStyles,
  actionButtonStyles,
  cancelButtonStyle,
} from "../../styles/BaseStyles";

const BoardFormDialog = ({
  open,
  title,
  board,
  setBoard,
  onSave,
  onCancel,
  disabled,
  gates = [],
  classes = [],
  currentClass,
  initialClassId,
  fixedClassId,
  fixedGateId,
}) => {
  const theme = useTheme();
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  // Focus the first input when the dialog opens
  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [open]);

  // Initialize board.class_id and board.gate_id
  useEffect(() => {
    if (open) {
      setBoard((prev) => {
        const newState = { ...prev };
        // Apply fixedClassId and fixedGateId if provided (e.g., from ClassPage)
        if (fixedClassId) {
          newState.class_id = fixedClassId;
        } else if (currentClass && !prev.class_id && !prev.gate_id) {
          newState.class_id = initialClassId || currentClass.class_id || null;
        }
        if (fixedGateId !== undefined) {
          newState.gate_id = fixedGateId;
        } else if (currentClass && !prev.gate_id && !fixedClassId) {
          newState.gate_id =
            prev.class_id === currentClass.class_id ? currentClass.gate_id : null;
        }
        return newState;
      });
    }
  }, [open, currentClass, initialClassId, fixedClassId, fixedGateId, setBoard]);

  // Filter classes based on selected gate_id (or fixedGateId)
  const filteredClasses = useMemo(() => {
    if (fixedClassId) return classes.filter((cls) => cls.class_id === fixedClassId);
    if (!board.gate_id && !fixedGateId) return classes;
    const gateId = fixedGateId !== undefined ? fixedGateId : board.gate_id;
    return classes.filter((cls) => cls.gate_id === gateId || !cls.gate_id);
  }, [board.gate_id, classes, fixedClassId, fixedGateId]);

  // Determine if gate_id field should be disabled
  const isGateDisabled = useMemo(() => {
    if (fixedGateId !== undefined) return true; // Disable if fixedGateId is provided
    if (!board.class_id) return false;
    const selectedClass = classes.find((cls) => cls.class_id === board.class_id);
    return !!selectedClass; // Disable gate if any class is selected
  }, [board.class_id, classes, fixedGateId]);

  // Determine if class_id field should be disabled
  const isClassDisabled = useMemo(() => {
    if (fixedClassId) return true; // Disable if fixedClassId is provided
    if (!board.gate_id && fixedGateId === undefined) return false;
    return filteredClasses.length === 0; // Disable class if no classes match the gate
  }, [board.gate_id, filteredClasses, fixedClassId, fixedGateId]);

  // Validation rules
  const validationRules = useMemo(
    () => ({
      name: {
        value: board.name || "",
        rules: { required: true, minLength: 3, maxLength: 100 },
      },
      description: {
        value: board.description || "",
        rules: { maxLength: 1000 },
      },
      visibility: {
        value: board.visibility || "private",
        rules: { required: true, enum: ["public", "private"] },
      },
      type: {
        value: board.type || "personal",
        rules: { required: true, enum: ["personal", "group"] },
      },
      class_id: {
        value: board.class_id || "",
        rules: {
          required:
            board.visibility === "public" && !board.gate_id && classes.length > 0 && !fixedClassId,
        },
      },
      gate_id: {
        value: board.gate_id || "",
        rules: {
          required:
            board.visibility === "public" && !board.class_id && gates.length > 0 && fixedGateId === undefined,
        },
      },
      "settings.max_tweets": {
        value: board.settings?.max_tweets || 100,
        rules: { required: true, minValue: 1, maxValue: 10000 },
      },
      "settings.tweet_cost": {
        value: board.settings?.tweet_cost || 1,
        rules: { required: true, minValue: 0 },
      },
      "settings.max_members": {
        value: board.settings?.max_members || 50,
        rules: { required: true, minValue: 1, maxValue: 10000 },
      },
      "settings.ai_moderation_enabled": {
        value: board.settings?.ai_moderation_enabled || false,
        rules: {},
      },
    }),
    [board, gates, classes, fixedClassId, fixedGateId]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      let newValue = type === "checkbox" ? checked : value;

      // Prevent changes to class_id or gate_id if fixed
      if ((name === "class_id" && fixedClassId) || (name === "gate_id" && fixedGateId !== undefined)) {
        return;
      }

      if (name === "gate_id" || name === "class_id") {
        newValue = value || null; // Convert empty string to null
      }

      if (name.startsWith("settings.")) {
        const settingKey = name.split(".")[1];
        newValue = settingKey === "ai_moderation_enabled" ? newValue : Number(newValue) || 0;
        setBoard((prev) => ({
          ...prev,
          settings: { ...prev.settings, [settingKey]: newValue },
        }));
      } else {
        setBoard((prev) => {
          const newState = {
            ...prev,
            [name]: newValue,
            is_public: name === "visibility" ? value === "public" : prev.is_public,
          };
          // If class_id changes, update gate_id to match the selected class's gate_id
          if (name === "class_id" && classes.length > 0 && !fixedGateId) {
            const selectedClass = classes.find((cls) => cls.class_id === newValue);
            newState.gate_id = selectedClass?.gate_id || null;
          }
          // If gate_id changes, reset class_id if no matching classes
          if (name === "gate_id" && newValue && !fixedClassId) {
            const availableClasses = classes.filter(
              (cls) => cls.gate_id === newValue || !cls.gate_id
            );
            if (availableClasses.length === 0) {
              newState.class_id = null;
            } else if (prev.class_id) {
              const selectedClass = classes.find((cls) => cls.class_id === prev.class_id);
              if (selectedClass?.gate_id && selectedClass.gate_id !== newValue) {
                newState.class_id = null;
              }
            }
          }
          return newState;
        });
      }

      const fieldRules = validationRules[name]?.rules || {};
      const fieldErrors = validateField(name, newValue, fieldRules, {
        visibility: name === "visibility" ? value : board.visibility,
        class_id: name === "class_id" ? newValue : board.class_id,
        gate_id: name === "gate_id" ? newValue : board.gate_id,
      });
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || null,
        gate_id: validateField(
          "gate_id",
          name === "gate_id" ? newValue : board.gate_id,
          validationRules.gate_id.rules,
          {
            visibility: name === "visibility" ? value : board.visibility,
            class_id: name === "class_id" ? newValue : board.class_id,
          }
        )[0] || null,
        class_id: validateField(
          "class_id",
          name === "class_id" ? newValue : board.class_id,
          validationRules.class_id.rules,
          {
            visibility: name === "visibility" ? value : board.visibility,
            gate_id: name === "gate_id" ? newValue : board.gate_id,
          }
        )[0] || null,
      }));
    },
    [setBoard, board, validationRules, classes, fixedClassId, fixedGateId]
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
          p: { xs: 2, md: 3 },
        },
      }}
      aria-labelledby="board-form-dialog-title"
      aria-describedby="board-form-dialog-description"
    >
      <DialogTitle
        id="board-form-dialog-title"
        sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2, md: 3 },
            mt: 2,
          }}
        >
          <Tooltip title="Enter a unique name for the board" placement="right">
            <TextField
              label="Board Name"
              name="name"
              value={board.name || ""}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ maxLength: 100 }}
              inputRef={firstInputRef}
              aria-label="Board name"
              aria-describedby="name-tooltip"
            />
          </Tooltip>
          <Tooltip title="Provide a description of the board's purpose" placement="right">
            <TextField
              label="Description"
              name="description"
              value={board.description || ""}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              error={!!errors.description}
              helperText={errors.description}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ maxLength: 1000 }}
              aria-label="Board description"
              aria-describedby="description-tooltip"
            />
          </Tooltip>
          <Tooltip
            title="Public boards are visible to everyone; private boards are restricted to members"
            placement="right"
          >
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
                value={board.visibility || "private"}
                onChange={handleChange}
                label="Visibility"
                aria-label="Board visibility"
                aria-describedby="visibility-tooltip"
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
              {errors.visibility && <FormHelperText>{errors.visibility}</FormHelperText>}
            </FormControl>
          </Tooltip>
          <Tooltip
            title="Personal boards are managed by individuals; group boards allow collaboration"
            placement="right"
          >
            <FormControl
              fullWidth
              error={!!errors.type}
              disabled={disabled}
              sx={{ ...selectStyles, mt: 0 }}
            >
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={board.type || "personal"}
                onChange={handleChange}
                label="Type"
                aria-label="Board type"
                aria-describedby="type-tooltip"
              >
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="group">Group</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
          </Tooltip>
          {board.visibility === "public" && (
            <>
              {classes.length > 0 && (
                <Tooltip
                  title={
                    fixedClassId
                      ? "Class is fixed for this board"
                      : "Select a class to associate the board; required if no gate is selected"
                  }
                  placement="right"
                >
                  <FormControl
                    fullWidth
                    error={!!errors.class_id}
                    disabled={disabled || isClassDisabled}
                    sx={{ ...selectStyles, mt: 0 }}
                  >
                    <InputLabel id="class-label">Class</InputLabel>
                    <Select
                      labelId="class-label"
                      name="class_id"
                      value={board.class_id || ""}
                      onChange={handleChange}
                      label="Class"
                      aria-label="Select class for public board"
                      aria-describedby="class-tooltip"
                    >
                      <MenuItem value="">None</MenuItem>
                      {filteredClasses.map((cls) => (
                        <MenuItem key={cls.class_id} value={cls.class_id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.class_id && <FormHelperText>{errors.class_id}</FormHelperText>}
                  </FormControl>
                </Tooltip>
              )}
              {gates.length > 0 && (
                <Tooltip
                  title={
                    fixedGateId !== undefined
                      ? "Gate is fixed for this board"
                      : "Select a gate to restrict access; disabled if a class is selected"
                  }
                  placement="right"
                >
                  <FormControl
                    fullWidth
                    error={!!errors.gate_id}
                    disabled={disabled || isGateDisabled}
                    sx={{ ...selectStyles, mt: 0 }}
                  >
                    <InputLabel id="gate-label">Gate</InputLabel>
                    <Select
                      labelId="gate-label"
                      name="gate_id"
                      value={board.gate_id || ""}
                      onChange={handleChange}
                      label="Gate"
                      aria-label="Select gate for public board"
                      aria-describedby="gate-tooltip"
                    >
                      <MenuItem value="">None</MenuItem>
                      {gates.map((gate) => (
                        <MenuItem key={gate.gate_id} value={gate.gate_id}>
                          {gate.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.gate_id && <FormHelperText>{errors.gate_id}</FormHelperText>}
                  </FormControl>
                </Tooltip>
              )}
            </>
          )}
          <Tooltip title="Maximum number of tweets allowed on the board" placement="right">
            <TextField
              label="Max Tweets"
              name="settings.max_tweets"
              type="number"
              value={board.settings?.max_tweets || 100}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.max_tweets"]}
              helperText={errors["settings.max_tweets"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1, max: 10000 }}
              aria-label="Maximum tweets"
              aria-describedby="max-tweets-tooltip"
            />
          </Tooltip>
          <Tooltip title="Points required to post a tweet on the board" placement="right">
            <TextField
              label="Tweet Cost"
              name="settings.tweet_cost"
              type="number"
              value={board.settings?.tweet_cost || 1}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.tweet_cost"]}
              helperText={errors["settings.tweet_cost"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 0 }}
              aria-label="Tweet creation cost"
              aria-describedby="tweet-cost-tooltip"
            />
          </Tooltip>
          <Tooltip title="Maximum number of members allowed on the board" placement="right">
            <TextField
              label="Max Members"
              name="settings.max_members"
              type="number"
              value={board.settings?.max_members || 50}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.max_members"]}
              helperText={errors["settings.max_members"]}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1, max: 10000 }}
              aria-label="Maximum members"
              aria-describedby="max-members-tooltip"
            />
          </Tooltip>
          <Tooltip
            title="Enable AI to automatically moderate content on the board"
            placement="right"
          >
            <FormControlLabel
              control={
                <Switch
                  checked={board.settings?.ai_moderation_enabled || false}
                  onChange={handleChange}
                  name="settings.ai_moderation_enabled"
                  disabled={disabled}
                  aria-label="Enable AI moderation"
                  aria-describedby="ai-moderation-tooltip"
                />
              }
              label="Enable AI Moderation"
              sx={{ color: "text.primary" }}
            />
          </Tooltip>
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
          aria-label="Cancel board form"
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
          aria-label="Save board form"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

BoardFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  board: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    visibility: PropTypes.string,
    type: PropTypes.string,
    gate_id: PropTypes.string,
    class_id: PropTypes.string,
    settings: PropTypes.shape({
      max_tweets: PropTypes.number,
      tweet_cost: PropTypes.number,
      max_members: PropTypes.number,
      ai_moderation_enabled: PropTypes.bool,
    }),
    tags: PropTypes.array,
  }).isRequired,
  setBoard: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  gates: PropTypes.arrayOf(
    PropTypes.shape({
      gate_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  classes: PropTypes.arrayOf(
    PropTypes.shape({
      class_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      gate_id: PropTypes.string,
    })
  ),
  currentClass: PropTypes.shape({
    class_id: PropTypes.string,
    name: PropTypes.string,
    gate_id: PropTypes.string,
  }),
  initialClassId: PropTypes.string,
  fixedClassId: PropTypes.string, // New prop for fixed class_id
  fixedGateId: PropTypes.string, // New prop for fixed gate_id (can be null)
};

BoardFormDialog.defaultProps = {
  gates: [],
  classes: [],
  currentClass: null,
  fixedClassId: null,
  fixedGateId: undefined,
};

export default React.memo(BoardFormDialog);