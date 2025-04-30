import React, { useState, useCallback, useMemo } from "react";
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
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { validateForm, validateField } from "../../utils/validations";
import {
  inputStyles,
  selectStyles,
  actionButtonStyles,
  cancelButtonStyle,
} from "../../styles/BaseStyles";

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const BoardFormDialog = ({
  open,
  title,
  board,
  setBoard,
  onSave,
  onCancel,
  disabled,
  gates,
  classes,
}) => {
  const theme = useTheme();
  const [errors, setErrors] = useState({});

  const validationRules = useMemo(
    () => ({
      name: {
        value: board.name,
        rules: { required: true, minLength: 3, maxLength: 100 },
      },
      description: {
        value: board.description,
        rules: { maxLength: 1000 },
      },
      visibility: {
        value: board.visibility,
        rules: { required: true },
      },
      type: {
        value: board.type,
        rules: { required: true },
      },
      "settings.max_tweets": {
        value: board.settings.max_tweets,
        rules: { required: true, minValue: 1 },
      },
      "settings.tweet_cost": {
        value: board.settings.tweet_cost,
        rules: { required: true, minValue: 0 },
      },
      "settings.max_members": {
        value: board.settings.max_members,
        rules: { required: true, minValue: 1 },
      },
      gate_id: {
        value: board.gate_id,
        rules: {
          required: board.visibility === "public" && !board.class_id,
        },
      },
      class_id: {
        value: board.class_id,
        rules: {
          required: board.visibility === "public" && !board.gate_id,
        },
      },
    }),
    [board]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, checked } = e.target;
      let newValue = name === "settings.ai_moderation_enabled" ? checked : value;

      if (name === "gate_id" || name === "class_id") {
        newValue = value || null; // Convert empty string to null
      } else if (name.startsWith("settings.")) {
        const settingKey = name.split(".")[1];
        newValue = settingKey === "ai_moderation_enabled" ? newValue : Number(newValue) || 0;
        setBoard((prev) => ({
          ...prev,
          settings: { ...prev.settings, [settingKey]: newValue },
        }));
      } else {
        setBoard((prev) => ({
          ...prev,
          [name]: newValue,
        }));
      }

      if (name !== "settings.ai_moderation_enabled" && !name.startsWith("settings.")) {
        setBoard((prev) => ({
          ...prev,
          [name]: newValue,
        }));
      }

      const fieldRules = validationRules[name]?.rules || {};
      const fieldErrors = validateField(name, newValue, fieldRules);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[0] || null,
        gate_id: validateField("gate_id", name === "gate_id" ? newValue : board.gate_id, validationRules.gate_id.rules, {
          visibility: name === "visibility" ? value : board.visibility,
          class_id: name === "class_id" ? value : board.class_id,
        }),
        class_id: validateField("class_id", name === "class_id" ? newValue : board.class_id, validationRules.class_id.rules, {
          visibility: name === "visibility" ? value : board.visibility,
          gate_id: name === "gate_id" ? value : board.gate_id,
        }),
      }));
    },
    [setBoard, board, validationRules]
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
      aria-labelledby="board-form-dialog-title"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={dialogVariants}
        transition={{ duration: 0.3 }}
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
              gap: { xs: 1.5, md: 2 },
              mt: 2,
            }}
          >
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
              aria-label="Board name"
            />
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
                value={board.visibility || "private"}
                onChange={handleChange}
                label="Visibility"
                aria-label="Board visibility"
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
              {errors.visibility && <FormHelperText>{errors.visibility}</FormHelperText>}
            </FormControl>
            <FormControl
              fullWidth
              error={!!errors.type}
              disabled={disabled}
              sx={{ ...selectStyles, mt: 0 }}
            >
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={board.type || "personal"}
                onChange={handleChange}
                label="Type"
                aria-label="Board type"
              >
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="group">Group</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
            {board.visibility === "public" && (
              <>
                <FormControl
                  fullWidth
                  error={!!errors.gate_id}
                  disabled={disabled}
                  sx={{ ...selectStyles, mt: 0 }}
                >
                  <InputLabel>Gate</InputLabel>
                  <Select
                    name="gate_id"
                    value={board.gate_id || ""}
                    onChange={handleChange}
                    label="Gate"
                    aria-label="Board gate"
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
                <FormControl
                  fullWidth
                  error={!!errors.class_id}
                  disabled={disabled}
                  sx={{ ...selectStyles, mt: 0 }}
                >
                  <InputLabel>Class</InputLabel>
                  <Select
                    name="class_id"
                    value={board.class_id || ""}
                    onChange={handleChange}
                    label="Class"
                    aria-label="Board class"
                  >
                    <MenuItem value="">None</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls.class_id} value={cls.class_id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.class_id && <FormHelperText>{errors.class_id}</FormHelperText>}
                </FormControl>
              </>
            )}
            <TextField
              label="Max Tweets"
              name="settings.max_tweets"
              type="number"
              value={board.settings.max_tweets || 100}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.max_tweets"]}
              helperText={errors["settings.max_tweets"] || "Maximum number of tweets"}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1 }}
              aria-label="Maximum tweets"
            />
            <TextField
              label="Tweet Creation Cost"
              name="settings.tweet_cost"
              type="number"
              value={board.settings.tweet_cost || 1}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.tweet_cost"]}
              helperText={errors["settings.tweet_cost"] || "Cost in points (0 or more)"}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 0 }}
              aria-label="Tweet creation cost"
            />
            <TextField
              label="Max Members"
              name="settings.max_members"
              type="number"
              value={board.settings.max_members || 50}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors["settings.max_members"]}
              helperText={errors["settings.max_members"] || "Maximum number of members"}
              sx={{ ...inputStyles, mt: 0 }}
              disabled={disabled}
              inputProps={{ min: 1 }}
              aria-label="Maximum members"
            />
            <FormControlLabel
              control={
                <Switch
                  name="settings.ai_moderation_enabled"
                  checked={board.settings.ai_moderation_enabled || false}
                  onChange={handleChange}
                  disabled={disabled}
                  aria-label="Enable AI moderation"
                />
              }
              label="Enable AI Moderation"
              sx={{ mt: 1 }}
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
            aria-label="Cancel"
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
            aria-label="Save board"
          >
            Save
          </Button>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};

BoardFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  board: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
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
  }).isRequired,
  setBoard: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  gates: PropTypes.arrayOf(
    PropTypes.shape({
      gate_id: PropTypes.string,
      name: PropTypes.string,
    })
  ).isRequired,
  classes: PropTypes.arrayOf(
    PropTypes.shape({
      class_id: PropTypes.string,
      name: PropTypes.string,
    })
  ).isRequired,
};

export default React.memo(BoardFormDialog);