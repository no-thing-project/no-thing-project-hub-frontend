import React from "react";
import { Box } from "@mui/material";

const ErrorMessage = ({ message }) => (
  <Box sx={{ p: 3 }}>
    <Typography color="error">Error: {message}</Typography>
  </Box>
);

export default ErrorMessage;