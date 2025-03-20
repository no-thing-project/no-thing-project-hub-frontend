// src/pages/NotFoundPage.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Typography, Box, Button } from "@mui/material";

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message || "The page you are looking for was not found.";

  return (
    <Box sx={{ padding: 4, textAlign: "center" }}>
      <Typography variant="h4" color="error" gutterBottom>
        404 - Not Found
      </Typography>
      <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
        {message}
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/home")}
        sx={{ mr: 1 }}
        aria-label="Go to Home"
      >
        Go to Home
      </Button>
      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        aria-label="Go Back"
      >
        Go Back
      </Button>
    </Box>
  );
};

export default NotFoundPage;