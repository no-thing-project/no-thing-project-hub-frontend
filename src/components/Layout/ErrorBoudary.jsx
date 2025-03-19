// src/components/ErrorBoundary.jsx
import React from "react";
import { Typography, Box } from "@mui/material";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            Something went wrong.
          </Typography>
          <Typography>{this.state.error?.message || "Unknown error"}</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;