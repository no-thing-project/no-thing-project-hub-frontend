// src/components/Forms/ResetPasswordForm/ResetPasswordForm.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  ThemeProvider,
  Snackbar,
  Alert,
  Box,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../../config";

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center" },
  paper: { p: 4, borderRadius: 3, width: "100%" },
  title: { textAlign: "center", mb: 3 },
  button: { mt: 2, py: 1.5, borderRadius: "8px", textTransform: "none" },
  backButton: { textTransform: "none", fontSize: "14px" },
};

const ResetPasswordForm = ({ theme, onLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const tokenFromUrl = searchParams.get("token") || hashParams.get("token");

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      console.log("Token extracted from URL:", tokenFromUrl);
    } else {
      setError("Token is missing in URL");
      console.error("No token found in URL");
    }
  }, []);

  const validateInputs = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword) return "New password is required";
    if (!passwordRegex.test(newPassword))
      return "Password must contain at least 8 characters, uppercase, lowercase, and a number";
    if (newPassword.length > 128) return "Password cannot exceed 128 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    if (!token) return "Token not found";
    if (token.length < 32) return "Token must be at least 32 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      console.log("Sending reset password request with:", { token, newPassword });
      const response = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/set-password`, {
        token,
        newPassword,
      });
      console.log("Response from server:", response.data);

      const { token: jwtToken, profile } = response.data; // Adjust based on actual API response
      if (!jwtToken || !profile) throw new Error("Invalid reset password response");

      setSuccess("Password successfully changed! Logging you in...");
      localStorage.setItem("token", jwtToken);
      onLogin(jwtToken, profile);
      setTimeout(() => navigate("/profile", { replace: true }), 2000);
    } catch (err) {
      console.error("Error during reset password:", err.response?.data || err);
      setError(
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Network error, please try again"
      );
    }
  };

  const handleBackToLogin = () => navigate("/login", { replace: true });
  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" sx={styles.container}>
        <Paper elevation={3} sx={styles.paper}>
          <Typography variant="h5" sx={styles.title}>
            Create Password
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" fullWidth sx={styles.button}>
              Change Password
            </Button>
          </form>
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="text"
              color="primary"
              onClick={handleBackToLogin}
              sx={styles.backButton}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Container>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default ResetPasswordForm;