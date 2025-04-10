import React, { useState, useCallback } from "react";
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
} from "@mui/material";
import { motion } from "framer-motion";
import { inputStyles, selectStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const BoardFormDialog = ({ open, title, board, setBoard, onSave, onCancel, errorMessage }) => {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((name, value) => {
    if (name === "name" && !value.trim()) {
      return "Board name is required";
    }
    if (["tweet_cost", "like_cost", "points_to_creator"].includes(name) && (value < 0 || value > 100)) {
      return "Value must be between 0 and 100";
    }
    if (name === "max_members" && value < 1) {
      return "Max members must be at least 1";
    }
    if (name === "type" && board.is_personal && board.is_group) {
      return "Board cannot be both personal and group";
    }
    return "";
  }, [board.is_personal, board.is_group]);

  const handleChange = useCallback(
    (field) => (e) => {
      let value =
        field.includes("settings.")
          ? Number(e.target.value)
          : field === "tags"
          ? e.target.value.split(", ").filter(Boolean)
          : e.target.value;

      let newBoard;
      if (field === "type") {
        const isGroup = value === "group";
        newBoard = { ...board, is_group: isGroup, is_personal: !isGroup };
      } else if (field.includes("settings.")) {
        newBoard = {
          ...board,
          settings: { ...board.settings, [field.split(".")[1]]: value },
        };
      } else {
        newBoard = { ...board, [field]: value };
      }

      setBoard(newBoard);
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
        type: validateField("type", newBoard.is_group ? "group" : "personal"),
      }));
    },
    [board, setBoard, validateField]
  );

  const isFormValid = useCallback(() => {
    return (
      board.name.trim() &&
      !errors.name &&
      !errors["settings.tweet_cost"] &&
      !errors["settings.like_cost"] &&
      !errors["settings.points_to_creator"] &&
      !errors["settings.max_members"] &&
      !errors.type &&
      !(board.is_personal && board.is_group)
    );
  }, [board, errors]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={dialogVariants}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
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
              onChange={handleChange("name")}
              sx={inputStyles}
              required
              error={!!errors.name || (!!errorMessage && errorMessage.includes("Board"))}
              helperText={errors.name || (errorMessage && errorMessage.includes("Board") ? errorMessage : "")}
            />
            <TextField
              margin="normal"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              value={board.description || ""}
              onChange={handleChange("description")}
              sx={inputStyles}
            />
            <FormControl fullWidth margin="normal" error={!!errors.visibility}>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={board.visibility}
                onChange={handleChange("visibility")}
                sx={selectStyles}
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
              <FormHelperText>{errors.visibility}</FormHelperText>
            </FormControl>
            <FormControl fullWidth margin="normal" error={!!errors.type}>
              <InputLabel>Type</InputLabel>
              <Select
                value={board.is_group ? "group" : "personal"}
                onChange={handleChange("type")}
                sx={selectStyles}
              >
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="group">Group</MenuItem>
              </Select>
              <FormHelperText>{errors.type}</FormHelperText>
            </FormControl>
            <TextField
              margin="normal"
              label="Tags (comma-separated)"
              type="text"
              fullWidth
              variant="outlined"
              value={board.tags?.join(", ") || ""}
              onChange={handleChange("tags")}
              sx={inputStyles}
            />
            <TextField
              margin="normal"
              label="Tweet Cost"
              type="number"
              fullWidth
              variant="outlined"
              value={board.settings?.tweet_cost || 1}
              onChange={handleChange("settings.tweet_cost")}
              sx={inputStyles}
              inputProps={{ min: 0, max: 100 }}
              error={!!errors["settings.tweet_cost"]}
              helperText={errors["settings.tweet_cost"]}
            />
            <TextField
              margin="normal"
              label="Like Cost"
              type="number"
              fullWidth
              variant="outlined"
              value={board.settings?.like_cost || 1}
              onChange={handleChange("settings.like_cost")}
              sx={inputStyles}
              inputProps={{ min: 0, max: 100 }}
              error={!!errors["settings.like_cost"]}
              helperText={errors["settings.like_cost"]}
            />
            <TextField
              margin="normal"
              label="Points to Creator"
              type="number"
              fullWidth
              variant="outlined"
              value={board.settings?.points_to_creator || 1}
              onChange={handleChange("settings.points_to_creator")}
              sx={inputStyles}
              inputProps={{ min: 0, max: 100 }}
              error={!!errors["settings.points_to_creator"]}
              helperText={errors["settings.points_to_creator"]}
            />
            <TextField
              margin="normal"
              label="Max Members"
              type="number"
              fullWidth
              variant="outlined"
              value={board.settings?.max_members || 11}
              onChange={handleChange("settings.max_members")}
              sx={inputStyles}
              inputProps={{ min: 1 }}
              error={!!errors["settings.max_members"]}
              helperText={errors["settings.max_members"]}
            />
            <TextField
              margin="normal"
              label="Gate ID (optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={board.gate_id || ""}
              onChange={handleChange("gate_id")}
              sx={inputStyles}
            />
            <TextField
              margin="normal"
              label="Class ID (optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={board.class_id || ""}
              onChange={handleChange("class_id")}
              sx={inputStyles}
            />
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={onSave}
              sx={actionButtonStyles}
              disabled={!isFormValid()}
              aria-label="Save board"
            >
              Save
            </Button>
            <Button
              variant="contained"
              onClick={onCancel}
              sx={cancelButtonStyle}
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

export default BoardFormDialog;