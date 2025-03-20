// src/components/Modals/CreateModal.jsx
import React, { useState, useEffect, useCallback } from "react";
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
import { fetchGates, fetchGateById, createGate } from "../../utils/gatesApi";
import { fetchClasses, fetchClassesByGate, createClassInGate } from "../../utils/classesApi";
import { createBoardInClass, createBoard } from "../../utils/boardsApi";

/**
 * @typedef {Object} Gate
 * @property {string} _id
 * @property {string} gate_id
 * @property {string} name
 */

/**
 * @typedef {Object} Class
 * @property {string} _id
 * @property {string} class_id
 * @property {string} name
 * @property {string} gate_id
 */

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.entityType - "gate", "class", or "board"
 * @param {string} props.token
 * @param {() => void} props.onSuccess
 * @param {string} [props.gateId] - Gate ID (if creating a class/board inside a gate)
 * @param {string} [props.classId] - Class ID (if creating a board inside a class)
 */
const CreateModal = React.memo(({ open, onClose, entityType, token, onSuccess, gateId, classId }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({ name: "" });
  const [gates, setGates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedGate, setSelectedGate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch gates and classes when the modal opens
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all gates for dropdowns
        const fetchedGates = await fetchGates(token);
        setGates(fetchedGates);

        // If creating a class on ClassesPage or a board on BoardsPage, fetch all classes
        if (entityType === "class" && !gateId) {
          const allClasses = await fetchClasses(token);
          setClasses(allClasses);
        } else if (entityType === "board" && !classId) {
          const allClasses = await fetchClasses(token);
          setClasses(allClasses);
        }

        // If creating a class/board inside a gate, fetch the gate details
        if (gateId && (entityType === "class" || entityType === "board")) {
          const gateData = await fetchGateById(gateId, token);
          setSelectedGate(gateData);
          setFormData((prev) => ({ ...prev, gate_id: gateId }));

          // If creating a board inside a gate but not a class, fetch classes for that gate
          if (entityType === "board" && gateId && !classId) {
            const gateClasses = await fetchClassesByGate(gateId, token);
            setClasses(gateClasses);
          }
        }

        // If creating a board inside a class, pre-fill the class
        if (classId && entityType === "board") {
          setFormData((prev) => ({ ...prev, class_id: classId }));
        }
      } catch (err) {
        setError("Failed to load options");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchOptions();
      // Reset form data when modal opens
      setFormData({ name: "", gate_id: gateId || "", class_id: classId || "" });
    }
  }, [open, entityType, token, gateId, classId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      switch (entityType) {
        case "gate":
          if (!formData.name) throw new Error("Gate name is required");
          result = await createGate({ name: formData.name }, token);
          break;
        case "class":
          if (!formData.name) throw new Error("Class name is required");
          if (!formData.gate_id) throw new Error("Gate is required");
          result = await createClassInGate(formData.gate_id, { name: formData.name }, token);
          break;
        case "board":
          if (!formData.name) throw new Error("Board name is required");
          if (classId) {
            // Creating a board inside a class
            result = await createBoardInClass(classId, { name: formData.name }, token);
          } else {
            // Creating a board on BoardsPage (no specific class)
            result = await createBoard(
              {
                name: formData.name,
                class_id: formData.class_id || undefined,
                gate_id: formData.gate_id || undefined,
              },
              token
            );
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
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          />
        );
      case "class":
        return (
          <>
            <TextField
              label="Class Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />
            {gateId ? (
              <TextField
                label="Gate"
                value={selectedGate?.name || "Loading..."}
                fullWidth
                margin="normal"
                disabled
              />
            ) : (
              <FormControl fullWidth margin="normal" disabled={loading}>
                <InputLabel>Gate</InputLabel>
                <Select
                  name="gate_id"
                  value={formData.gate_id}
                  onChange={handleChange}
                  label="Gate"
                  required
                >
                  <MenuItem value="">
                    <em>Select a Gate</em>
                  </MenuItem>
                  {gates.map((gate) => (
                    <MenuItem key={gate._id} value={gate._id}>
                      {gate.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        );
      case "board":
        return (
          <>
            <TextField
              label="Board Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={loading}
            />
            {gateId && (
              <TextField
                label="Gate"
                value={selectedGate?.name || "Loading..."}
                fullWidth
                margin="normal"
                disabled
              />
            )}
            {classId ? (
              <TextField
                label="Class"
                value={
                  classes.find((cls) => cls._id === classId)?.name || "Loading..."
                }
                fullWidth
                margin="normal"
                disabled
              />
            ) : (
              <>
                {!gateId && (
                  <FormControl fullWidth margin="normal" disabled={loading}>
                    <InputLabel>Gate (Optional)</InputLabel>
                    <Select
                      name="gate_id"
                      value={formData.gate_id}
                      onChange={(e) => {
                        handleChange(e);
                        // Fetch classes for the selected gate
                        if (e.target.value) {
                          fetchClassesByGate(e.target.value, token).then(setClasses);
                        } else {
                          fetchClasses(token).then(setClasses);
                        }
                      }}
                      label="Gate (Optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {gates.map((gate) => (
                        <MenuItem key={gate._id} value={gate._id}>
                          {gate.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControl fullWidth margin="normal" disabled={loading}>
                  <InputLabel>Class (Optional)</InputLabel>
                  <Select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    label="Class (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="create-entity-modal">
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
        <Typography id="create-entity-modal" variant="h6" gutterBottom>
          Create {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
        </Typography>
        {error && <Typography color="error" gutterBottom>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          {getFormFields()}
          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Button
              onClick={onClose}
              variant="outlined"
              fullWidth
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Box>
    </Modal>
  );
});

CreateModal.displayName = "CreateModal";

export default CreateModal;