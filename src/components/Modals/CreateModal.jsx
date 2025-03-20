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
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGates } from "../../hooks/useGates";
import { useClasses } from "../../hooks/useClasses";
import { useBoards } from "../../hooks/useBoards";

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
 * @param {() => void} props.onLogout
 * @param {import("react-router-dom").NavigateFunction} props.navigate
 * @param {string} [props.gateId] - Gate ID (if creating a class/board inside a gate)
 * @param {string} [props.classId] - Class ID (if creating a board inside a class)
 */
const CreateModal = React.memo(
  ({ open, onClose, entityType, token, onSuccess, onLogout, navigate, gateId, classId }) => {
    const theme = useTheme();

    // Initialize hooks
    const {
      gates,
      gate,
      fetchGatesList,
      fetchGate,
      createNewGate,
      loading: gatesLoading,
      error: gatesError,
    } = useGates(token, onLogout, navigate);

    const {
      classes,
      fetchAllClasses,
      fetchClassesByGateId,
      fetchClass,
      createNewClass,
      loading: classesLoading,
      error: classesError,
    } = useClasses(token, onLogout, navigate);

    const {
      createNewBoard,
      loading: boardsLoading,
      error: boardsError,
    } = useBoards(token, gateId, classId, null, onLogout, navigate);

    const [formData, setFormData] = useState({
      name: "",
      gate_id: gateId || "",
      class_id: classId || "",
      is_public: true, // Default visibility for boards
    });
    const [selectedGate, setSelectedGate] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch gates and classes when the modal opens
    useEffect(() => {
      const fetchOptions = async () => {
        setLoading(true);
        setError(null);
        try {
          const controller = new AbortController();
          const signal = controller.signal;

          // Fetch all gates for dropdowns
          await fetchGatesList(signal);

          // If creating a class on ClassesPage or a board on BoardsPage, fetch all classes
          if (entityType === "class" && !gateId) {
            await fetchAllClasses(signal);
          } else if (entityType === "board" && !classId) {
            await fetchAllClasses(signal);
          }

          // If creating a class/board inside a gate, fetch the gate details
          if (gateId && (entityType === "class" || entityType === "board")) {
            const gateData = await fetchGate(gateId, signal);
            setSelectedGate(gateData);
            setFormData((prev) => ({ ...prev, gate_id: gateId }));

            // If creating a board inside a gate but not a class, fetch classes for that gate
            if (entityType === "board" && gateId && !classId) {
              await fetchClassesByGateId(gateId, signal);
            }
          }

          // If creating a board inside a class, fetch the class details
          if (classId && entityType === "board") {
            const classData = await fetchClass(classId, signal);
            setSelectedClass(classData);
            setFormData((prev) => ({ ...prev, class_id: classId }));
          }

          return () => controller.abort();
        } catch (err) {
          if (err.name !== "AbortError") {
            setError("Failed to load options");
          }
        } finally {
          setLoading(false);
        }
      };

      if (open) {
        fetchOptions();
        // Reset form data when modal opens
        setFormData({
          name: "",
          gate_id: gateId || "",
          class_id: classId || "",
          is_public: true,
        });
        setSelectedGate(null);
        setSelectedClass(null);
      }
    }, [
      open,
      entityType,
      gateId,
      classId,
      fetchGatesList,
      fetchGate,
      fetchAllClasses,
      fetchClassesByGateId,
      fetchClass,
    ]);

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
            result = await createNewGate({ name: formData.name });
            break;
          case "class":
            if (!formData.name) throw new Error("Class name is required");
            if (!formData.gate_id) throw new Error("Gate is required");
            result = await createNewClass(formData.gate_id, { name: formData.name });
            break;
          case "board":
            if (!formData.name) throw new Error("Board name is required");
            result = await createNewBoard({
              name: formData.name,
              class_id: formData.class_id || undefined,
              gate_id: formData.gate_id || undefined,
              is_public: formData.is_public,
            });
            break;
          default:
            throw new Error("Invalid entity type");
        }
        onSuccess(result);
        onClose();
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || err.message || "Failed to create entity");
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
              disabled={loading || gatesLoading}
              inputProps={{ "aria-label": "Gate Name" }}
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
                disabled={loading || classesLoading}
                inputProps={{ "aria-label": "Class Name" }}
              />
              {gateId ? (
                <TextField
                  label="Gate"
                  value={selectedGate?.name || "Loading..."}
                  fullWidth
                  margin="normal"
                  disabled
                  inputProps={{ "aria-label": "Selected Gate" }}
                />
              ) : (
                <FormControl
                  fullWidth
                  margin="normal"
                  disabled={loading || gatesLoading}
                >
                  <InputLabel id="gate-select-label">Gate</InputLabel>
                  <Select
                    labelId="gate-select-label"
                    name="gate_id"
                    value={formData.gate_id}
                    onChange={handleChange}
                    label="Gate"
                    required
                    inputProps={{ "aria-label": "Select Gate" }}
                  >
                    <MenuItem value="">
                      <em>Select a Gate</em>
                    </MenuItem>
                    {gates.map((gate) => (
                      <MenuItem key={gate.gate_id} value={gate.gate_id}>
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
                disabled={loading || boardsLoading}
                inputProps={{ "aria-label": "Board Name" }}
              />
              {gateId && (
                <TextField
                  label="Gate"
                  value={selectedGate?.name || "Loading..."}
                  fullWidth
                  margin="normal"
                  disabled
                  inputProps={{ "aria-label": "Selected Gate" }}
                />
              )}
              {classId ? (
                <TextField
                  label="Class"
                  value={selectedClass?.name || "Loading..."}
                  fullWidth
                  margin="normal"
                  disabled
                  inputProps={{ "aria-label": "Selected Class" }}
                />
              ) : (
                <>
                  {!gateId && (
                    <FormControl
                      fullWidth
                      margin="normal"
                      disabled={loading || gatesLoading}
                    >
                      <InputLabel id="gate-select-label">Gate (Optional)</InputLabel>
                      <Select
                        labelId="gate-select-label"
                        name="gate_id"
                        value={formData.gate_id}
                        onChange={(e) => {
                          handleChange(e);
                          // Fetch classes for the selected gate
                          if (e.target.value) {
                            fetchClassesByGateId(e.target.value);
                          } else {
                            fetchAllClasses();
                          }
                        }}
                        label="Gate (Optional)"
                        inputProps={{ "aria-label": "Select Gate (Optional)" }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {gates.map((gate) => (
                          <MenuItem key={gate.gate_id} value={gate.gate_id}>
                            {gate.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <FormControl
                    fullWidth
                    margin="normal"
                    disabled={loading || classesLoading}
                  >
                    <InputLabel id="class-select-label">Class (Optional)</InputLabel>
                    <Select
                      labelId="class-select-label"
                      name="class_id"
                      value={formData.class_id}
                      onChange={handleChange}
                      label="Class (Optional)"
                      inputProps={{ "aria-label": "Select Class (Optional)" }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls.class_id} value={cls.class_id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              <FormControl
                fullWidth
                margin="normal"
                disabled={loading || boardsLoading}
              >
                <InputLabel id="visibility-select-label">Visibility</InputLabel>
                <Select
                  labelId="visibility-select-label"
                  name="is_public"
                  value={formData.is_public}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, is_public: e.target.value }))
                  }
                  label="Visibility"
                  inputProps={{ "aria-label": "Select Board Visibility" }}
                >
                  <MenuItem value={true}>Public</MenuItem>
                  <MenuItem value={false}>Private</MenuItem>
                </Select>
              </FormControl>
            </>
          );
        default:
          return null;
      }
    };

    // Combine errors from hooks and local state
    const combinedError = error || gatesError || classesError || boardsError;
    const combinedLoading = loading || gatesLoading || classesLoading || boardsLoading;

    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="create-entity-modal"
        aria-describedby="create-entity-modal-description"
      >
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
          <Typography
            id="create-entity-modal-description"
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2 }}
          >
            Fill in the details to create a new {entityType}.
          </Typography>
          {combinedError && (
            <Typography color="error" gutterBottom>
              {combinedError}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            {getFormFields()}
            <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={combinedLoading}
                fullWidth
                startIcon={combinedLoading ? <CircularProgress size={20} /> : null}
                aria-label={`Create ${entityType}`}
              >
                {combinedLoading ? "Creating..." : "Create"}
              </Button>
              <Button
                onClick={onClose}
                variant="outlined"
                fullWidth
                disabled={combinedLoading}
                aria-label="Cancel"
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
    );
  }
);

CreateModal.displayName = "CreateModal";

export default CreateModal;