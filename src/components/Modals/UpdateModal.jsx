// src/components/Modals/UpdateModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useGates } from "../../hooks/useGates";
import { useClasses } from "../../hooks/useClasses";
import { useBoards } from "../../hooks/useBoards";

const UpdateModal = ({
  open,
  onClose,
  entityType,
  entityData,
  token,
  onSuccess,
  onLogout,
  navigate,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize hooks based on entity type
  const { updateGate } = useGates(token, onLogout, navigate);
  const { updateClass } = useClasses(token, onLogout, navigate);
  const { updateExistingBoard } = useBoards(
    token,
    null,
    null,
    null,
    onLogout,
    navigate
  );

  // Set initial form data when the modal opens
  useEffect(() => {
    if (entityData) {
      setFormData({
        name: entityData.name || "",
        description: entityData.description || "",
        is_public: entityData.is_public !== undefined ? entityData.is_public : true,
      });
    }
  }, [entityData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      setError(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} name is required`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let updatedEntity;
      const payload = {
        name: formData.name,
        description: formData.description,
        is_public: formData.is_public,
      };

      switch (entityType) {
        case "gate":
          updatedEntity = await updateGate(entityData.gate_id, payload);
          break;
        case "class":
          updatedEntity = await updateClass(entityData.class_id, payload);
          break;
        case "board":
          updatedEntity = await updateExistingBoard(entityData.board_id, payload);
          break;
        default:
          throw new Error("Invalid entity type");
      }

      if (updatedEntity) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0] ||
          `Failed to update ${entityType}. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    entityType,
    entityData,
    updateGate,
    updateClass,
    updateExistingBoard,
    onSuccess,
    onClose,
  ]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          error={!!error && !formData.name.trim()}
          helperText={error && !formData.name.trim() ? "Name is required" : ""}
          disabled={loading}
        />
        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          disabled={loading}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="visibility-label">Visibility</InputLabel>
          <Select
            labelId="visibility-label"
            name="is_public"
            value={formData.is_public}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                is_public: e.target.value,
              }))
            }
            label="Visibility"
            disabled={loading}
          >
            <MenuItem value={true}>Public</MenuItem>
            <MenuItem value={false}>Private</MenuItem>
          </Select>
        </FormControl>
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateModal;