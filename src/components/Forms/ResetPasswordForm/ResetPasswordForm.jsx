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
import { inputStyles, actionButtonStyles } from "../../../styles/BaseStyles";

const ResetPasswordForm = ({ theme, onLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.split("?")[1] || ""
      );
      const tokenFromUrl =
        searchParams.get("token") || hashParams.get("token");

      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        console.log("Token extracted from URL:", tokenFromUrl);
      } else {
        setError(
          "No reset token found in the URL. Please check the link or request a new one."
        );
        console.error("No token found in URL");
      }
    } catch (err) {
      setError(
        "Invalid URL format. Please check the link or request a new one."
      );
      console.error("Error parsing URL:", err);
    }
  }, []);

  const validateInputs = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword) return "New password is required";
    if (!passwordRegex.test(newPassword))
      return "Password must contain at least 8 characters, uppercase, lowercase, and a number";
    if (newPassword.length > 128)
      return "Password cannot exceed 128 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    if (!token) return "Reset token is missing";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Sending reset password request with:", {
        token,
        newPassword,
      });
      const response = await axios.post(
        `${config.REACT_APP_HUB_API_URL}/api/v1/auth/set-password`,
        {
          token,
          newPassword,
        }
      );
      console.log("Response from server:", response.data);

      const { token: jwtToken, profile } = response.data;
      if (!jwtToken || !profile) {
        throw new Error(
          "Invalid reset password response: Missing token or profile"
        );
      }

      onLogin(jwtToken, profile);
      localStorage.setItem("token", jwtToken);
      setSuccess("Password successfully changed! Logging you in...");
    } catch (err) {
      console.error(
        "Error during reset password:",
        err.response?.data || err
      );
      const errorMessage =
        err.response?.status === 400
          ? "Invalid or expired reset token. Please request a new one."
          : err.response?.data?.errors?.[0] ||
            err.response?.data?.message ||
            "Network error, please try again";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => navigate("/login", { replace: true });
  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/home"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

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
              Create Password
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", mt: theme.spacing(1) }}
            >
              Start your journey from here
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: theme.spacing(2), textAlign: "left" }}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                      sx={{ color: "text.primary" }}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              required
              error={!!error && error.includes("password")}
              aria-describedby={
                error && error.includes("password")
                  ? "new-password-error"
                  : undefined
              }
              sx={inputStyles}
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      sx={{ color: "text.primary" }}
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              required
              error={!!error && error.includes("Passwords do not match")}
              aria-describedby={
                error && error.includes("Passwords do not match")
                  ? "confirm-password-error"
                  : undefined
              }
              sx={inputStyles}
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
                  fontSize: "16px",
                  padding: "8px 20px",
                  borderRadius: "20px",
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
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
          role="alert"
        >
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
          role="alert"
        >
          {success}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default ResetPasswordForm;
