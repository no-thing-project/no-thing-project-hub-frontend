import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  ThemeProvider,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../../config";
import { inputStyles, actionButtonStyles } from "../../../styles/BaseStyles";
import { useNotification } from "../../../context/NotificationContext";

const ResetPasswordForm = ({ theme, onLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const extractToken = () => {
      try {
        // Handle hash-based URL (e.g., #/reset-password?token=...)
        const hash = window.location.hash || "";
        const queryString = hash.includes("?") ? hash.split("?")[1] : "";
        const hashParams = new URLSearchParams(queryString);
        const searchParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = hashParams.get("token") || searchParams.get("token");

        if (tokenFromUrl) {
          setToken(tokenFromUrl);
          setIsLoading(false);
        } else {
          showNotification(
            "No reset token found in the URL. Please check the link or request a new one.",
            "error",
            { duration: 4000 }
          );
          setTimeout(() => navigate("/login", { replace: true }), 4000);
        }
      } catch (err) {
        showNotification(
          "Invalid URL format. Please check the link or request a new one.",
          "error",
          { duration: 4000 }
        );
        setTimeout(() => navigate("/login", { replace: true }), 4000);
      }
    };

    extractToken();
  }, [navigate, showNotification]);

  const validateInputs = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword) return "New password is required";
    if (!passwordRegex.test(newPassword))
      return "Password must contain at least 8 characters, uppercase, lowercase, and a number";
    if (newPassword.length > 128) return "Password cannot exceed 128 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    if (!token) return "Reset token is missing";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationError = validateInputs();
    if (validationError) {
      showNotification(validationError, "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/set-password`, {
        token,
        newPassword,
      });
      const {token: jwtToken, profile } = response.data;
      if (!jwtToken || !profile) {
        throw new Error("Invalid response: Missing token or profile");
      }
      localStorage.setItem("token", jwtToken);
      onLogin(jwtToken, profile);
      showNotification("Password successfully changed! Logging you in...", "success");
      setTimeout(() => navigate("/home", { replace: true }), 2000);
    } catch (err) {
      console.error("Error during reset password:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Network error, please try again";
      showNotification(errorMessage, "error");
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => navigate("/login", { replace: true });

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <Container
          maxWidth="sm"
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress aria-label="Loading reset password form" />
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: theme.spacing(5),
            borderRadius: theme.shape.borderRadiusMedium,
            backgroundColor: "background.paper",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: theme.custom.loginPaperMaxWidth,
            textAlign: "center",
          }}
        >
          <Box sx={{ textAlign: "center", mb: theme.spacing(3) }}>
            <Typography
              variant="h4"
              sx={{ color: "text.primary", fontWeight: 600 }}
            >
              Create New Password
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ color: "text.secondary", mt: 1 }}
            >
              Enter your new password to continue
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 2, textAlign: "left" }}
            aria-label="Reset password form"
          >
            <TextField
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                notched: false,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                      sx={{ color: "text.primary" }}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
              required
            />
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                notched: false,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      sx={{ color: "text.primary" }}
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
              required
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                mt: theme.spacing(3),
                gap: theme.spacing(3),
                alignItems: "center",
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth
                sx={actionButtonStyles}
                aria-label="Change password"
              >
                {isSubmitting ? "Changing Password..." : "Change Password"}
              </Button>
              <Button
                variant="text"
                onClick={handleBackToLogin}
                sx={{
                  color: "text.primary",
                  textTransform: "none",
                  fontSize: "0.875rem",
                  "&:hover": { textDecoration: "underline" },
                }}
                aria-label="Back to login"
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default ResetPasswordForm;