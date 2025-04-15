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
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { ExpandMore, ExpandLess, PersonAdd, Remove as RemoveIcon } from "@mui/icons-material";
import PropTypes from "prop-types";
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
  token,
  onLogout,
  navigate,
  userRole,
}) => {
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [localTags, setLocalTags] = useState(board.tags?.join(", ") || "");
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("viewer");

  const isEditable = userRole === "owner" || userRole === "editor";
  const { gates, fetchGatesList, loading: gatesLoading } = useGates(token, onLogout, navigate);
  const { classes, fetchClassesList, loading: classesLoading } = useClasses(token, onLogout, navigate);

  useEffect(() => {
    if (open && token && isEditable) {
      fetchGatesList();
      fetchClassesList();
    }
    if (open) {
      setLocalTags(board.tags?.join(", ") || "");
    }
  }, [open, token, isEditable, fetchGatesList, fetchClassesList, board.tags]);

  const validateField = useCallback((name, value, updatedBoard) => {
    const numValue = Number(value);
    const checks = {
      name: () => (!value.trim() ? "Board name is required" : ""),
      visibility: () => (!value ? "Visibility is required" : ""),
      type: () =>
        value === "group" && updatedBoard.visibility === "public" && !updatedBoard.gate_id && !updatedBoard.class_id
          ? "Public group board requires a gate or class"
          : "",
      "settings.tweet_cost": () => (numValue < 0 || numValue > 100 ? "Must be 0-100" : ""),
      "settings.like_cost": () => (numValue < 0 || numValue > 100 ? "Must be 0-100" : ""),
      "settings.points_to_creator": () => (numValue < 0 || numValue > 100 ? "Points to creator must be 0-100" : ""),
      "settings.max_members": () => (numValue < 1 ? "Must be at least 1" : ""),
      "settings.tweets_limit_trigger": () => (numValue < 11 ? "Must be at least 11" : ""),
    };
    return checks[name] ? checks[name]() : "";
  }, []);

  const handleChange = useCallback(
    (field) => (e) => {
      if (!isEditable) return;
      const value =
        field.startsWith("settings.") || field === "tweets_limit_trigger"
          ? Number(e.target.value) || 0
          : field === "tags"
          ? e.target.value
          : e.target.value;

      const newBoard =
        field.startsWith("settings.")
          ? { ...board, settings: { ...board.settings, [field.split(".")[1]]: value } }
          : { ...board, [field]: value };

      if (field === "tags") {
        setLocalTags(value);
        newBoard.tags = value.split(",").map((t) => t.trim()).filter(Boolean);
      }

      if (field === "visibility") {
        newBoard.is_public = value === "public";
      }

      setBoard(newBoard);
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, newBoard),
        type: validateField("type", newBoard.type, newBoard),
        visibility: validateField("visibility", newBoard.visibility, newBoard),
      }));
    },
    [board, setBoard, isEditable, validateField]
  );

  const handleAddMember = useCallback(() => {
    if (!isEditable || !newMemberId.trim()) return;
    const newMember = {
      anonymous_id: newMemberId.trim(),
      role: newMemberRole,
    };
    setBoard((prev) => ({
      ...prev,
      members: [...(prev.members || []), newMember],
    }));
    setNewMemberId("");
    setNewMemberRole("viewer");
  }, [isEditable, newMemberId, newMemberRole, setBoard]);

  const handleRemoveMember = useCallback(
    (anonymous_id) => {
      if (!isEditable) return;
      setBoard((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.anonymous_id !== anonymous_id),
      }));
    },
    [isEditable, setBoard]
  );

  const isFormValid = useCallback(() => {
    if (!isEditable) return false;
    const requiredFields = ["name", "visibility", "type"];
    const hasRequired = requiredFields.every((field) => board[field]?.trim());
    const noErrors = Object.values(errors).every((err) => !err);
    return hasRequired && noErrors;
  }, [board, errors, isEditable]);

  const handleSave = useCallback(async () => {
    if (!isEditable) return;
    setIsSaving(true);
    try {
      await onSave();
      setErrors({});
      onCancel();
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || "Failed to save" }));
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onCancel, isEditable]);

  const toggleMoreOptions = () => setShowMoreOptions((prev) => !prev);
  const toggleMembers = () => setShowMembers((prev) => !prev);

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
        <Box sx={{ p: 2 }}>
          <DialogTitle id="board-form-dialog-title">{title}</DialogTitle>
          <DialogContent>
            {isEditable ? (
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
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Board Name</Typography>
                <Typography>{board.name || "N/A"}</Typography>
              </Box>
            )}
            {isEditable ? (
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
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography>{board.description || "No description"}</Typography>
              </Box>
            )}
            {isEditable ? (
              <FormControl fullWidth margin="normal" error={!!errors.visibility}>
                <InputLabel>Visibility</InputLabel>
                <Select
                  value={board.visibility || "private"}
                  onChange={handleChange("visibility")}
                  sx={selectStyles}
                >
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="public">Public</MenuItem>
                </Select>
                <FormHelperText>{errors.visibility}</FormHelperText>
              </FormControl>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Visibility</Typography>
                <Typography>{board.visibility || "Private"}</Typography>
              </Box>
            )}
            {isEditable ? (
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
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Type</Typography>
                <Typography>{board.type || "Personal"}</Typography>
              </Box>
            )}

            {(board.type === "group" || board.visibility === "public") && (
              <>
                {isEditable ? (
                  <Tooltip title="Select a Gate if this board is tied to a specific gate">
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Gate</InputLabel>
                      <Select
                        value={board.gate_id || ""}
                        onChange={handleChange("gate_id")}
                        sx={selectStyles}
                        disabled={gatesLoading}
                      >
                        <MenuItem value="">None</MenuItem>
                        {gates.map((gate) => (
                          <MenuItem key={gate.gate_id} value={gate.gate_id}>
                            {gate.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {gatesLoading && <FormHelperText>Loading gates...</FormHelperText>}
                    </FormControl>
                  </Tooltip>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Gate</Typography>
                    <Typography>{board.gate_name || "None"}</Typography>
                  </Box>
                )}
                {isEditable ? (
                  <Tooltip title="Select a Class if this board is tied to a specific class">
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Class</InputLabel>
                      <Select
                        value={board.class_id || ""}
                        onChange={handleChange("class_id")}
                        sx={selectStyles}
                        disabled={classesLoading}
                      >
                        <MenuItem value="">None</MenuItem>
                        {classes.map((cls) => (
                          <MenuItem key={cls.class_id} value={cls.class_id}>
                            {cls.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {classesLoading && <FormHelperText>Loading classes...</FormHelperText>}
                    </FormControl>
                  </Tooltip>
                  ) : (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Class</Typography>
                    <Typography>{board.class_name || "None"}</Typography>
                  </Box>
                )}
              </>
            )}

            {board.type === "group" && (
              <Box sx={{ mt: 2 }}>
                <Button
                  onClick={toggleMembers}
                  endIcon={showMembers ? <ExpandLess /> : <ExpandMore />}
                  disabled={!isEditable}
                >
                  Manage Members
                </Button>
                <Collapse in={showMembers}>
                  <List>
                    {board.members?.length > 0 ? (
                      board.members.map((member) => (
                        <ListItem key={member.anonymous_id}>
                          <ListItemText primary={member.anonymous_id} secondary={member.role} />
                          {isEditable && (
                            <IconButton
                              onClick={() => handleRemoveMember(member.anonymous_id)}
                              aria-label={`Remove member ${member.anonymous_id}`}
                            >
                              <RemoveIcon />
                            </IconButton>
                          )}
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No members" />
                      </ListItem>
                    )}
                    {isEditable && (
                      <ListItem>
                        <IconButton disabled aria-label="Add member">
                          <PersonAdd />
                        </IconButton>
                        <TextField
                          label="Add Member (Anonymous ID)"
                          value={newMemberId}
                          onChange={(e) => setNewMemberId(e.target.value)}
                          sx={{ ...inputStyles, mr: 2 }}
                        />
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            sx={selectStyles}
                          >
                            <MenuItem value="viewer">Viewer</MenuItem>
                            <MenuItem value="editor">Editor</MenuItem>
                          </Select>
                        </FormControl>
                        <Button onClick={handleAddMember} disabled={!newMemberId.trim()}>
                          Add
                        </Button>
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Button
                onClick={toggleMoreOptions}
                endIcon={showMoreOptions ? <ExpandLess /> : <ExpandMore />}
                disabled={!isEditable}
              >
                More Options
              </Button>
              <Collapse in={showMoreOptions}>
                <Box sx={{ mt: 2 }}>
                  {isEditable ? (
                    <>
                      <TextField
                        label="Tags (comma-separated)"
                        fullWidth
                        variant="outlined"
                        value={localTags}
                        onChange={handleChange("tags")}
                        sx={inputStyles}
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
                    </>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Tags</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {board.tags?.length > 0 ? (
                          board.tags.map((tag) => <Chip key={tag} label={tag} size="small" />)
                        ) : (
                          <Typography>No tags</Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  {isEditable ? (
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
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Tweet Cost</Typography>
                      <Typography>{board.settings?.tweet_cost ?? 1}</Typography>
                    </Box>
                  )}
                  {isEditable ? (
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
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Like Cost</Typography>
                      <Typography>{board.settings?.like_cost ?? 1}</Typography>
                    </Box>
                  )}
                  {isEditable ? (
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
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Points to Creator</Typography>
                      <Typography>{board.settings?.points_to_creator ?? 1}</Typography>
                    </Box>
                  )}
                  {isEditable ? (
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
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Max Members</Typography>
                      <Typography>{board.settings?.max_members ?? 11}</Typography>
                    </Box>
                  )}
                  {isEditable ? (
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
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Tweet Limit Trigger</Typography>
                      <Typography>{board.settings?.tweets_limit_trigger ?? 111}</Typography>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          </DialogContent>
          <DialogActions>
            {isEditable ? (
              <>
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
              </>
            ) : (
              <Button
                variant="contained"
                onClick={onCancel}
                sx={cancelButtonStyle}
                aria-label="Close"
              >
                Close
              </Button>
            )}
          </DialogActions>
        </Box>
      </motion.div>
    </Dialog>
  );
};

BoardFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  board: PropTypes.object.isRequired,
  setBoard: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  token: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  userRole: PropTypes.string.isRequired,
};

export default memo(BoardFormDialog);