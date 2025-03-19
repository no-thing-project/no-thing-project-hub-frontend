// src/components/CreateModal/CreateModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { createGate, fetchGates } from "../../utils/gatesApi";
import { createClassInGate, fetchClassesByGate } from "../../utils/classesApi";
import { createBoardInClass, createBoardInGate } from "../../utils/boardsApi";


const CreateModal = ({ open, onClose, entityType, token, onSuccess }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({});
  const [gates, setGates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const fetchedGates = await fetchGates(token);
        setGates(fetchedGates);
        if (entityType === "board") {
          const allClasses = await fetchClassesByGate(token);
          setClasses(allClasses);
        }
      } catch (err) {
        setError("Failed to load options");
      }
    };
    if (open) fetchOptions();
  }, [entityType, token, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name) setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      switch (entityType) {
        case "gate":
          result = await createGate({ name: formData.name }, token);
          break;
        case "class":
          result = formData.gate_id
            await createClassInGate(formData.gate_id, { name: formData.name }, token)
          break;
        case "board":
          if (formData.gatgate_ideId) {
            result = await createBoardInGate(formData.gate_id, { name: formData.name }, token);
          } else if (formData.class_id) {
            result = await createBoardInClass(formData.class_id, { name: formData.name }, token);
          } else {
            result = await createBoardInGate({ name: formData.name }, token);
          }
          break;
        default:
          throw new Error("Invalid entity type");
      }
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity");
    } finally {
      setLoading(false);
    }
  };

  const getFormFields = () => {
    switch (entityType) {
      case "gate":
        return (
          <TextField
            label="Gate Name"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        );
      case "class":
        return (
          <>
            <TextField
              label="Class Name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Gate (Optional)</InputLabel>
              <Select name="gate_id" value={formData.gate_id || ""} onChange={handleChange} label="Gate (Optional)">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {gates.map((gate) => (
                  <MenuItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      case "board":
        return (
          <>
            <TextField
              label="Board Name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Gate (Optional)</InputLabel>
              <Select name="gate_id" value={formData.gate_id || ""} onChange={handleChange} label="Gate (Optional)">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {gates.map((gate) => (
                  <MenuItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Class (Optional)</InputLabel>
              <Select name="class_id" value={formData.class_id || ""} onChange={handleChange} label="Class (Optional)">
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 400 },
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Create {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
        </Typography>
        {error && <Typography color="error" gutterBottom>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          {getFormFields()}
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
              {loading ? "Creating..." : "Create"}
            </Button>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" fullWidth>
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
};

export default CreateModal;