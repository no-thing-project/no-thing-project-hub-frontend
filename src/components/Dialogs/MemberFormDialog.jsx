import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  FormHelperText,
  Autocomplete,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { inputStyles, actionButtonStyles, cancelButtonStyle, selectStyles } from "../../styles/BaseStyles";
import { validateField, validateForm } from "../../utils/validations";
import { debounce } from "lodash";
import { useNotification } from "../../context/NotificationContext";
import { useSocial } from "../../hooks/useSocial";
import PropTypes from "prop-types";

const MemberFormDialog = ({
  open,
  title,
  gateId,
  classId,
  boardId,
  token,
  onSave,
  onCancel,
  disabled,
  members,
  addMember,
  removeMember,
  updateMemberRole,
}) => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const { searchUsersByUsername, loading: searchLoading } = useSocial(token, () => {}, () => {});
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("viewer");
  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);

  const validRoles = ["viewer", "moderator", "admin", "owner"];

  // Determine the context (gate, class, or board) based on provided IDs
  const context = useMemo(() => {
    if (gateId) return { type: "gate", id: gateId, name: "Gate" };
    if (classId) return { type: "class", id: classId, name: "Class" };
    if (boardId) return { type: "board", id: boardId, name: "Board" };
    return { type: null, id: null, name: "Unknown" };
  }, [gateId, classId, boardId]);

  const validationRules = useMemo(
    () => ({
      username: {
        value: username,
        rules: { required: true, minLength: 3, maxLength: 50 },
      },
      role: {
        value: role,
        rules: { required: true, validRoles },
      },
    }),
    [username, role]
  );

  const debouncedSearchUsers = useMemo(
    () =>
      debounce(async (query) => {
        if (!query || query.length < 3) {
          setUserSuggestions([]);
          return;
        }
        try {
          const users = await searchUsersByUsername(query, { limit: 10 });
          const suggestions = users.map((user) => ({
            username: user.username || user.anonymous_id || "Unknown",
            anonymous_id: user.anonymous_id,
          }));
          setUserSuggestions(suggestions);
          if (!suggestions.length) {
            showNotification(`No users found for this ${context.name.toLowerCase()}`, "info");
          }
        } catch (err) {
          console.error("Search users error:", err);
          showNotification("Failed to fetch user suggestions", "error");
          setUserSuggestions([]);
        }
      }, 300),
    [searchUsersByUsername, showNotification, context.name]
  );

  const handleUsernameChange = useCallback(
    (event, newValue) => {
      const value = newValue || "";
      setUsername(value);

      const fieldErrors = validateField("username", value, validationRules.username.rules);
      setErrors((prev) => ({
        ...prev,
        username: fieldErrors[0] || null,
      }));

      if (value.length >= 3) {
        debouncedSearchUsers(value);
      } else {
        setUserSuggestions([]);
      }
    },
    [debouncedSearchUsers, validationRules]
  );

  const handleRoleChange = useCallback(
    (e) => {
      const { value } = e.target;
      setRole(value);

      const fieldErrors = validateField("role", value, validationRules.role.rules);
      setErrors((prev) => ({
        ...prev,
        role: fieldErrors[0] || null,
      }));
    },
    [validationRules]
  );

  const handleAddMember = useCallback(async () => {
    const formErrors = validateForm(validationRules);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const selectedUser = userSuggestions.find((user) => user.username === username);
    if (!selectedUser) {
      showNotification("Please select a valid user from the suggestions", "error");
      setErrors((prev) => ({
        ...prev,
        username: "Invalid user selected",
      }));
      return;
    }

    if (!context.id) {
      showNotification(`No valid ${context.name.toLowerCase()} ID provided`, "error");
      return;
    }

    try {
      await addMember(context.id, { username: selectedUser.username, role });
      setUsername("");
      setRole("viewer");
      setErrors({});
      setUserSuggestions([]);
      showNotification(`Member added to ${context.name.toLowerCase()} successfully!`, "success");
      onSave();
    } catch (err) {
      console.error(`Add ${context.name.toLowerCase()} member error:`, err);
      showNotification(err.message || `Failed to add member to ${context.name.toLowerCase()}`, "error");
    }
  }, [context, username, role, userSuggestions, addMember, showNotification, validationRules, onSave]);

  const handleRemoveMember = useCallback(
    async (username) => {
      if (!context.id) {
        showNotification(`No valid ${context.name.toLowerCase()} ID provided`, "error");
        return;
      }

      try {
        await removeMember(context.id, username);
        showNotification(`Member removed from ${context.name.toLowerCase()} successfully!`, "success");
      } catch (err) {
        console.error(`Remove ${context.name.toLowerCase()} member error:`, err);
        showNotification(err.message || `Failed to remove member from ${context.name.toLowerCase()}`, "error");
      }
    },
    [context, removeMember, showNotification]
  );

  const handleUpdateRole = useCallback(
    async (username, newRole) => {
      if (!context.id) {
        showNotification(`No valid ${context.name.toLowerCase()} ID provided`, "error");
        return;
      }

      try {
        await updateMemberRole(context.id, username, newRole);
        showNotification(`Member role updated in ${context.name.toLowerCase()} successfully!`, "success");
      } catch (err) {
        console.error(`Update ${context.name.toLowerCase()} role error:`, err);
        showNotification(err.message || `Failed to update member role in ${context.name.toLowerCase()}`, "error");
      }
    },
    [context, updateMemberRole, showNotification]
  );

  useEffect(() => {
    if (!open) {
      setUsername("");
      setRole("viewer");
      setUserSuggestions([]);
      setErrors({});
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: theme.shape.borderRadiusMedium,
          p: { xs: 1, md: 2 },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
        {title || `Manage ${context.name} Members`}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, md: 2 },
            mb: { xs: 2, md: 3 },
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Autocomplete
            freeSolo={false}
            options={userSuggestions}
            getOptionLabel={(option) => option.username || ""}
            inputValue={username}
            onInputChange={handleUsernameChange}
            loading={searchLoading}
            sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label="Username"
                type="text"
                variant="outlined"
                sx={{ ...inputStyles, mt: 0 }}
                required
                disabled={disabled}
                error={!!errors.username}
                helperText={errors.username || `Search for a user to add to the ${context.name.toLowerCase()}`}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            aria-label={`Search for a user to add to ${context.name.toLowerCase()}`}
          />
          <FormControl
            sx={{ minWidth: { xs: "100%", sm: 150 }, mt: 0, ...selectStyles }}
            error={!!errors.role}
          >
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={handleRoleChange}
              label="Role"
              disabled={disabled}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
          </FormControl>
          <Button
            variant="contained"
            onClick={handleAddMember}
            sx={{
              ...actionButtonStyles,
              minWidth: { xs: "100%", sm: 120 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
            disabled={disabled || Object.keys(errors).some((key) => errors[key])}
            aria-label={`Add member to ${context.name.toLowerCase()}`}
          >
            Add
          </Button>
        </Box>

        <Typography
          variant="h6"
          sx={{ mb: 2, fontSize: { xs: "1.25rem", md: "1.5rem" } }}
        >
          Current {context.name} Members
        </Typography>
        {members?.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: theme.shape.borderRadiusSmall }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                    Username
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                    Joined At
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.anonymous_id || member._id}>
                    <TableCell>
                      <Chip
                        label={member.username || "Unknown"}
                        size="small"
                        sx={{
                          bgcolor: "background.paper",
                          fontSize: { xs: "0.75rem", md: "0.875rem" },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl sx={{ minWidth: { xs: 100, sm: 120 }, ...selectStyles }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.username, e.target.value)}
                          label="Role"
                          disabled={disabled || member.role === "owner"}
                          size="small"
                        >
                          <MenuItem value="viewer">Viewer</MenuItem>
                          <MenuItem value="moderator">Moderator</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                          {member.role === "owner" && (
                            <MenuItem value="owner" disabled>Owner</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                      {member.joined_at
                        ? new Date(member.joined_at).toLocaleDateString()
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {member.role !== "owner" && (
                        <IconButton
                          onClick={() => handleRemoveMember(member.username)}
                          disabled={disabled}
                          aria-label={`Remove member ${member.username || "Unknown"} from ${context.name.toLowerCase()}`}
                        >
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No members in this {context.name.toLowerCase()} yet.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={onCancel}
          sx={{
            ...cancelButtonStyle,
            minWidth: { xs: "100%", sm: 150 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
          disabled={disabled}
          aria-label="Close"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MemberFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  gateId: PropTypes.string,
  classId: PropTypes.string,
  boardId: PropTypes.string,
  token: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  members: PropTypes.array.isRequired,
  addMember: PropTypes.func.isRequired,
  removeMember: PropTypes.func.isRequired,
  updateMemberRole: PropTypes.func.isRequired,
};

export default React.memo(MemberFormDialog);