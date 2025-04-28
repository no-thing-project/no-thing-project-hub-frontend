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
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { inputStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";
import { validateField, validateForm } from "../../utils/validations";
import { debounce } from "lodash";
import { useNotification } from "../../context/NotificationContext";
import { useSocial } from "../../hooks/useSocial";

const MemberFormDialog = ({
  open,
  title,
  gateId,
  token,
  onSave,
  onCancel,
  disabled,
  members,
  addMember,
  removeMember,
  updateMemberRole,
}) => {
  const { showNotification } = useNotification();
  const { searchUsersByUsername, loading: searchLoading } = useSocial(token, () => {}, () => {});
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("viewer");
  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);

  const validRoles = ["viewer", "moderator", "admin", "owner"];

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
          console.log("Search users response:", users);
          const suggestions = users.map((user) => ({
            username: user.username || user.anonymous_id || "Unknown",
            anonymous_id: user.anonymous_id,
          }));
          setUserSuggestions(suggestions);
          if (!suggestions.length) {
            showNotification("No users found for this query", "info");
          }
        } catch (err) {
          console.error("Search users error:", err);
          showNotification("Failed to fetch user suggestions", "error");
          setUserSuggestions([]);
        }
      }, 300),
    [searchUsersByUsername, showNotification]
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

    try {
      console.log("Adding member:", { gateId, username: selectedUser.username, role });
      await addMember(gateId, { username: selectedUser.username, role });
      setUsername("");
      setRole("viewer");
      setErrors({});
      setUserSuggestions([]);
      showNotification("Member added successfully!", "success");
    } catch (err) {
      console.error("Add member error:", err);
      showNotification(err.message || "Failed to add member", "error");
    }
  }, [gateId, username, role, userSuggestions, addMember, showNotification, validationRules]);

  const handleRemoveMember = useCallback(
    async (memberId) => {
      try {
        console.log("Removing member:", { gateId, memberId });
        await removeMember(gateId, memberId);
        showNotification("Member removed successfully!", "success");
      } catch (err) {
        console.error("Remove member error:", err);
        showNotification(err.message || "Failed to remove member", "error");
      }
    },
    [gateId, removeMember, showNotification]
  );

  const handleUpdateRole = useCallback(
    async (memberId, newRole) => {
      try {
        console.log("Updating role:", { gateId, memberId, newRole });
        await updateMemberRole(gateId, memberId, newRole);
        showNotification("Member role updated successfully!", "success");
      } catch (err) {
        console.error("Update role error:", err);
        showNotification(err.message || "Failed to update member role", "error");
      }
    },
    [gateId, updateMemberRole, showNotification]
  );

  useEffect(() => {
    if (!open) {
      setUsername("");
      setRole("viewer");
      setUserSuggestions([]);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    console.log("Members data:", members);
  }, [members]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column" }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New Member
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Autocomplete
              freeSolo={false}
              options={userSuggestions}
              getOptionLabel={(option) => option.username || ""}
              inputValue={username}
              onInputChange={handleUsernameChange}
              loading={searchLoading}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  autoFocus
                  label="Username"
                  type="text"
                  variant="outlined"
                  sx={inputStyles}
                  required
                  disabled={disabled}
                  error={!!errors.username}
                  helperText={errors.username || "Type to search for a user"}
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
              aria-label="Search for a user to add"
            />
            <FormControl sx={{ minWidth: 150 }} error={!!errors.role}>
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
              sx={actionButtonStyles}
              disabled={disabled || Object.keys(errors).some((key) => errors[key])}
              aria-label="Add member"
            >
              Add
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Current Members
          </Typography>
          {members?.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.anonymous_id || member._id}>
                      <TableCell>
                        <Chip
                          label={
                            member.username ||
                            member.anonymous_id ||
                            "Unknown"
                          }
                          size="small"
                          sx={{ bgcolor: "background.paper" }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.anonymous_id,
                                e.target.value
                              )
                            }
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
                      <TableCell>
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {member.role !== "owner" && (
                          <IconButton
                            onClick={() =>
                              handleRemoveMember(member.anonymous_id)
                            }
                            disabled={disabled}
                            aria-label={`Remove member ${
                              member.username || member.anonymous_id || "Unknown"
                            }`}
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
              No members yet.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={onCancel}
            sx={cancelButtonStyle}
            disabled={disabled}
            aria-label="Close"
          >
            Close
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(MemberFormDialog);