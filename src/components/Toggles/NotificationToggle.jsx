import React from "react";
import { FormControlLabel, Switch } from "@mui/material";
import { toggleStyles } from "../../styles/BaseStyles";

const NotificationToggle = ({ label, checked, onChange, disabled = false }) => (
  <FormControlLabel
    labelPlacement="start"
    sx={toggleStyles.formControl}
    control={
      <Switch
        checked={checked}
        onChange={onChange}
        sx={toggleStyles.switch}
        disabled={disabled}
      />
    }
    label={label}
  />
);

export default NotificationToggle;