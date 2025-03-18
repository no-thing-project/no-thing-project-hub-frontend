import React from "react";
import { Box, TextField, MenuItem, Typography } from "@mui/material";
import { fieldStyles } from "../../styles/ProfileStyles";

const ProfileField = ({
  label,
  value,
  field,
  isEditing,
  onChange,
  select = false,
  options = [],
  editSx = {},
}) => (
  <Box sx={fieldStyles.container}>
    <Typography variant="body2" sx={fieldStyles.label}>
      {label}
    </Typography>
    {isEditing ? (
      select ? (
        <TextField
          select
          fullWidth
          variant="outlined"
          size="small"
          value={value || ""}
          onChange={onChange(field)}
          sx={{ ...fieldStyles.input, ...editSx }}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={value || ""}
          onChange={onChange(field)}
          sx={{ ...fieldStyles.input, ...editSx }}
        />
      )
    ) : (
      <Typography variant="body2" sx={fieldStyles.value}>
        {value || "Not set"}
      </Typography>
    )}
  </Box>
);

export default ProfileField;