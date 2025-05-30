import React from "react";
import { Box, CircularProgress } from "@mui/material";

const LoadingSpinner = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    }}
  >
    <CircularProgress size={60} sx={{ color: "#3E435D" }} />
  </Box>
);

export default LoadingSpinner;