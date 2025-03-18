// src/components/Layout/ErrorMessage.jsx
import React from "react";
import { Typography, Box } from "@mui/material";

const ErrorMessage = ({ message }) => {
  return (
    <Box sx={{ padding: 2, textAlign: "center" }}>
      <Typography variant="h6" color="error">
        {message}
      </Typography>
    </Box>
  );
};

export default ErrorMessage;