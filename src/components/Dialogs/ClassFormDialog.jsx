import React from "react";
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Button } from "@mui/material";
import { inputStyles, selectStyles, actionButtonStyles, cancelButtonStyle } from "../../styles/BaseStyles";

const ClassFormDialog = ({ open, title, classData, setClass, onSave, onCancel, errorMessage }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <Box
        sx={{
          maxWidth: 500,
          margin: "0 auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Class Name"
            type="text"
            fullWidth
            variant="outlined"
            value={classData.name}
            onChange={(e) => setClass({ ...classData, name: e.target.value })}
            sx={inputStyles}
            required
            error={!!errorMessage && errorMessage.includes("Class")}
          />
          <TextField
            margin="normal"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={classData.description}
            onChange={(e) => setClass({ ...classData, description: e.target.value })}
            sx={inputStyles}
            multiline
            rows={3}
          />
          <Select
            margin="normal"
            value={classData.visibility}
            onChange={(e) => setClass({ ...classData, visibility: e.target.value })}
            fullWidth
            variant="outlined"
            sx={selectStyles}
          >
            <MenuItem value="Public">Public</MenuItem>
            <MenuItem value="Private">Private</MenuItem>
          </Select>
          {!!errorMessage && (
            <Box sx={{ color: "error.main", mt: 1 }}>{errorMessage}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onSave} sx={actionButtonStyles}>
            Save
          </Button>
          <Button variant="contained" onClick={onCancel} sx={cancelButtonStyle}>
            Cancel
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ClassFormDialog;