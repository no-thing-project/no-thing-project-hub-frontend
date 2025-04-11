import React, { useState, useCallback, useEffect, memo } from "react";
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
  CircularProgress,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import { useGates } from "../../hooks/useGates"; 
import { useClasses } from "../../hooks/useClasses";
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
  errorMessage: externalError,
  availableGates: initialGates = [],
  availableClasses: initialClasses = [],
  token,
  onLogout,
  navigate,
}) => {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [localTags, setLocalTags] = useState(board.tags?.join(", ") || "");

  // Fetch gates and classes dynamically
  const { gates, fetchGatesList, loading: gatesLoading } = useGates(token, onLogout, navigate);
  const { classes, fetchClassesList, loading: classesLoading } = useClasses(token, onLogout, navigate);

  useEffect(() => {
    if (open && token) {
      fetchGatesList();
      fetchClassesList();
    }
  }, [open, token, fetchGatesList, fetchClassesList]);

  const availableGates = gates.length > 0 ? gates : initialGates;
  const availableClasses = classes.length > 0 ? classes : initialClasses;

  const validateField = useCallback((name, value, updatedBoard) => {
    const numValue = Number(value);
    const checks = {
      name: () => !value.trim() ? "Board name is required" : "",
      "settings.tweet_cost": () => numValue < 0 || numValue > 100 ? "Must be 0-100" : "",
      "settings.like_cost": () => numValue < 0 || numValue > 100 ? "Must be 0-100" : "",
      "settings.points_to_creator": () => numValue < 0 || numValue > 100 ? "Must be 0-100" : "",
      "settings.max_members": () => numValue < 1 ? "Must be at least 1" : "",
      "settings.tweets_limit_trigger": () => numValue < 11 ? "Must be at least 11" : "",
      type: () =>
        value === "group" &&
        updatedBoard.visibility === "public" &&
        !updatedBoard.gate_id &&
        !updatedBoard.class_id
          ? "Public group board requires a gate or class"
          : "",
    };
    return checks[name] ? checks[name]() : "";
  }, []);

  const handleChange = useCallback(
    (field) => (e) => {
      const value =
        field.startsWith("settings.") || field === "tweets_limit_trigger"
          ? Number(e.target.value) || 0
          : field === "tags"
          ? e.target.value
          : e.target.value;

      const newBoard =
        field.startsWith("settings.")
          ? {
              ...board,
              settings: { ...board.settings, [field.split(".")[1]]: value },
            }
          : { ...board, [field]: value };

      if (field === "tags") {
        setLocalTags(value);
        newBoard.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
      }

      setBoard(newBoard);
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, newBoard),
        type: validateField("type", newBoard.type, newBoard),
        visibility: validateField("visibility", newBoard.visibility, newBoard),
      }));
    },
    [board, setBoard, validateField]
  );

  const isFormValid = useCallback(() => {
    const requiredFields = ["name"];
    const hasRequired = requiredFields.every((field) => board[field]?.trim());
    const noErrors = Object.values(errors).every((err) => !err);
    return hasRequired && noErrors;
  }, [board, errors]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      setErrors({});
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || "Failed to save" }));
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      setIsSaving(false);
      setLocalTags(board.tags?.join(", ") || "");
    }
  }, [open, board.tags]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="board-form-dialog-title"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={dialogVariants}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <DialogTitle id="board-form-dialog-title">{title}</DialogTitle>
          <DialogContent>
            <TextField
              label="Board Name"
              fullWidth
              variant="outlined"
              value={board.name || ""}
              onChange={handleChange("name")}
              sx={inputStyles}
              error={!!errors.name || !!externalError}
              helperText={errors.name || externalError}
              required
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Description"
              fullWidth
              variant="outlined"
              value={board.description || ""}
              onChange={handleChange("description")}
              sx={{ ...inputStyles, mt: 2 }}
              multiline
              rows={2}
              inputProps={{ maxLength: 500 }}
            />
            <FormControl fullWidth margin="normal" error={!!errors.visibility}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={board.visibility || "private"}
                onChange={handleChange("visibility")}
                sx={selectStyles}
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
              </Select>
              <FormHelperText>{errors.visibility}</FormHelperText>
            </FormControl>
            <FormControl fullWidth margin="normal" error={!!errors.type}>
              <InputLabel>Type</InputLabel>
              <Select
                value={board.type || "personal"}
                onChange={handleChange("type")}
                sx={selectStyles}
              >
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="group">Group</MenuItem>
              </Select>
              <FormHelperText>{errors.type}</FormHelperText>
            </FormControl>

            {(board.visibility === "public" || board.type === "group") && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Gate</InputLabel>
                  <Select
                    value={board.gate_id || ""}
                    onChange={handleChange("gate_id")}
                    sx={selectStyles}
                    disabled={gatesLoading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {availableGates.map((gate) => (
                      <MenuItem key={gate.gate_id} value={gate.gate_id}>
                        {gate.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {gatesLoading && <FormHelperText>Loading gates...</FormHelperText>}
                </FormControl>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={board.class_id || ""}
                    onChange={handleChange("class_id")}
                    sx={selectStyles}
                    disabled={classesLoading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {availableClasses.map((cls) => (
                      <MenuItem key={cls.class_id} value={cls.class_id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {classesLoading && <FormHelperText>Loading classes...</FormHelperText>}
                </FormControl>
              </>
            )}

            <TextField
              label="Tags (comma-separated)"
              fullWidth
              variant="outlined"
              value={localTags}
              onChange={handleChange("tags")}
              sx={{ ...inputStyles, mt: 2 }}
              helperText="Separate tags with commas"
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {board.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => {
                    const newTags = board.tags.filter((t) => t !== tag);
                    setBoard({ ...board, tags: newTags });
                    setLocalTags(newTags.join(", "));
                  }}
                />
              ))}
            </Box>

            <TextField
              label="Tweet Cost"
              type="number"
              fullWidth
              value={board.settings?.tweet_cost ?? 1}
              onChange={handleChange("settings.tweet_cost")}
              sx={{ ...inputStyles, mt: 2 }}
              error={!!errors["settings.tweet_cost"]}
              helperText={errors["settings.tweet_cost"] || "Cost in points (0-100)"}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Like Cost"
              type="number"
              fullWidth
              value={board.settings?.like_cost ?? 1}
              onChange={handleChange("settings.like_cost")}
              sx={{ ...inputStyles, mt: 2 }}
              error={!!errors["settings.like_cost"]}
              helperText={errors["settings.like_cost"] || "Cost in points (0-100)"}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Points to Creator"
              type="number"
              fullWidth
              value={board.settings?.points_to_creator ?? 1}
              onChange={handleChange("settings.points_to_creator")}
              sx={{ ...inputStyles, mt: 2 }}
              error={!!errors["settings.points_to_creator"]}
              helperText={errors["settings.points_to_creator"] || "Points per action (0-100)"}
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              label="Max Members"
              type="number"
              fullWidth
              value={board.settings?.max_members ?? 11}
              onChange={handleChange("settings.max_members")}
              sx={{ ...inputStyles, mt: 2 }}
              error={!!errors["settings.max_members"]}
              helperText={errors["settings.max_members"] || "Max number of members"}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Tweet Limit Trigger"
              type="number"
              fullWidth
              value={board.settings?.tweets_limit_trigger ?? 111}
              onChange={handleChange("settings.tweets_limit_trigger")}
              sx={{ ...inputStyles, mt: 2 }}
              error={!!errors["settings.tweets_limit_trigger"]}
              helperText={errors["settings.tweets_limit_trigger"] || "Tweets before limit"}
              inputProps={{ min: 11 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={actionButtonStyles}
              disabled={!isFormValid() || isSaving || gatesLoading || classesLoading}
              aria-label="Save board"
            >
              {isSaving ? <CircularProgress size={24} /> : "Save"}
            </Button>
            <Button
              variant="contained"
              onClick={onCancel}
              sx={cancelButtonStyle}
              disabled={isSaving}
              aria-label="Cancel"
            >
              Cancel
            </Button>
          </DialogActions>
        </Box>
      </motion.div>
    </Dialog>
  );
};

export default memo(BoardFormDialog);