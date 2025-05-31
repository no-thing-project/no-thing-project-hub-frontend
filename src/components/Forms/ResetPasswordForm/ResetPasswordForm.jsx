import React, { useState, useEffect, useCallback } from "react";
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
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const extractToken = () => {
      try {
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

  const validateInputs = useCallback(() => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword) return "New password is required";
    if (!passwordRegex.test(newPassword))
      return "Password must contain at least 8 characters, uppercase, lowercase, and a number";
    if (newPassword.length > 128) return "Password cannot exceed 128 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    if (!token) return "Reset token is missing";
    return null;
  }, [newPassword, confirmPassword, token]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setIsResettingPassword(true);

      const validationError = validateInputs();
      if (validationError) {
        showNotification(validationError, "error");
        setIsSubmitting(false);
        setIsResettingPassword(false);
        return;
      }

      try {
        const response = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/set-password`, {
          token,
          newPassword,
        });
        const { token: jwtToken, profile } = response.data;
        if (!jwtToken || !profile) {
          throw new Error("Invalid response: Missing token or profile");
        }
        localStorage.setItem("token", jwtToken);
        onLogin(jwtToken, profile);
        showNotification("Password successfully changed! Redirecting...", "success");
        setTimeout(() => navigate("/home", { replace: true }), 2000);
      } catch (err) {
        console.error("Error during reset password:", err.response?.data || err);
        const errorMessage =
          err.response?.data?.errors?.[0] ||
          err.response?.data?.message ||
          "Network error, please try again";
        showNotification(errorMessage, "error");
        setIsSubmitting(false);
        setIsResettingPassword(false);
      }
    },
    [newPassword, confirmPassword, token, navigate, onLogin, showNotification, validateInputs]
  );

  const handleBackToLogin = useCallback(() => navigate("/login", { replace: true }), [navigate]);

  const handleKeyDown = useCallback(
    (e, callback) => {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        callback();
      }
    },
    [isSubmitting]
  );

  if (isLoading || isResettingPassword) {
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
          <Box sx={{ textAlign: "center" }} aria-live="polite" aria-busy="true">
            <CircularProgress aria-label="Loading" sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {isLoading ? "Loading reset password form…" : "Resetting password…"}
            </Typography>
          </Box>
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
              onKeyDown={(e) => handleKeyDown(e, () => handleSubmit(e))}
              InputProps={{
                notched: false,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      name="password-visibility"
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
              onKeyDown={(e) => handleKeyDown(e, () => handleSubmit(e))}
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