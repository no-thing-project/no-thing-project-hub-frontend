// src/components/Login/LoginForm.js
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
  Link,
  Modal,
  Fade,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../../config";
import { inputStyles } from "../../../styles/BaseStyles";

const LoginForm = ({ theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const registrationLink = "https://secure.wayforpay.com/donate/NoThingProject";

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 255) return "Email cannot exceed 255 characters";
    if (!password) return "Password is required";
    if (!passwordRegex.test(password))
      return "Password must be 8+ chars with uppercase, lowercase, and number";
    if (password.length > 128) return "Password cannot exceed 128 characters";
    return null;
  };

  const validateForgotEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail) return "Email is required";
    if (!emailRegex.test(forgotEmail)) return "Please enter a valid email address";
    if (forgotEmail.length > 255) return "Email cannot exceed 255 characters";
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
      const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/login`, {
        email,
        password,
      });
      const { token, profile } = res.data;
      if (!token || !profile) {
        throw new Error("Invalid login response: Missing token or profile");
      }
      localStorage.setItem("token", token);
      onLogin(token, profile);
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      console.error("Login error:", err.response?.data || err);
      const errorMessage =
        err.response?.status === 401
          ? "Invalid email or password. Please try again."
          : err.response?.data?.errors?.[0] ||
            err.response?.data?.message ||
            "Network error, please try again";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    const validationError = validateForgotEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/forgot-password`, {
        email: forgotEmail,
      });
      setSuccess("An email with a password reset link has been sent!");
      setTimeout(() => handleCloseModal(), 2000);
    } catch (err) {
      console.error("Forgot password error:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Network error, please try again";
      setError(errorMessage);
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setForgotEmail("");
    setError("");
    setSuccess("");
  };
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
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
        }}
      >
        <Fade in timeout={600}>
          <Paper
            elevation={6}
            sx={{
              p: theme.spacing(5),
              borderRadius: theme.shape.borderRadiusMedium,
              backgroundColor: "background.paper",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
              width: theme.custom.loginPaperWidth,
              maxWidth: theme.custom.loginPaperMaxWidth,
              textAlign: "center",
            }}
          >
            <Box sx={{ textAlign: "center", mb: theme.spacing(3) }}>
              <Typography
                variant="h4"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                Sign In
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mt: theme.spacing(1) }}
              >
                Sign in to continue
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ mt: theme.spacing(2), textAlign: "left" }}
              noValidate
              aria-label="Login form"
            >
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{ notched: false }}
                sx={inputStyles}
                required
                error={!!error && error.includes("Email")}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={inputStyles}
                InputProps={{
                  notched: false,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        sx={{ color: "text.primary" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
                error={!!error && error.includes("Password")}
                aria-describedby={
                  error && error.includes("Password")
                    ? "password-error"
                    : undefined
                }
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  mt: theme.spacing(3),
                  minHeight: theme.custom.loginButtonHeight,
                  borderRadius: theme.shape.borderRadiusSmall,
                  backgroundColor: "background.button",
                  color: "background.default",
                  textTransform: "none",
                  fontSize: theme.custom.loginButtonFontSize,
                  boxShadow: "0 4px 12px rgba(33, 37, 41, 0.2)",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "background.button",
                    opacity: 0.9,
                    boxShadow: "0 6px 16px rgba(33, 37, 41, 0.3)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                }}
                aria-label="Sign in"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </Box>

            <Box sx={{ mt: theme.spacing(2), textAlign: "center" }}>
              <Button
                variant="text"
                sx={{
                  color: "text.primary",
                  textTransform: "none",
                  fontSize: "16px",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                onClick={handleOpenModal}
                aria-label="Forgot password"
              >
                Forgot password?
              </Button>
            </Box>

            <Box sx={{ mt: theme.spacing(2), textAlign: "center" }}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Don’t have an account?{" "}
                <Link
                  href={registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "text.primary",
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": { textDecoration: "underline" },
                  }}
                  aria-label="Sign up"
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>

        <Modal
          open={openModal}
          onClose={handleCloseModal}
          closeAfterTransition
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Fade in={openModal}>
            <Box
              sx={{
                backgroundColor: "background.paper",
                borderRadius: theme.shape.borderRadiusMedium,
                boxShadow: 24,
                p: theme.spacing(4),
                width: "100%",
                maxWidth: theme.custom.loginPaperMaxWidth,
              }}
              role="dialog"
              aria-labelledby="password-recovery-title"
            >
              <Typography
                id="password-recovery-title"
                variant="h6"
                sx={{ mb: theme.spacing(2), fontWeight: 600 }}
              >
                Password Recovery
              </Typography>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                InputProps={{ notched: false }}
                sx={inputStyles}
                required
                error={!!error && error.includes("Email")}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleForgotPassword}
                sx={{
                  mt: theme.spacing(2),
                  backgroundColor: "background.button",
                  color: "background.default",
                  borderRadius: theme.shape.borderRadiusSmall,
                  textTransform: "none",
                  fontSize: theme.custom.loginButtonFontSize,
                  minHeight: theme.custom.loginButtonHeight,
                  boxShadow: "0 4px 12px rgba(33, 37, 41, 0.2)",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "background.button",
                    opacity: 0.9,
                    boxShadow: "0 6px 16px rgba(33, 37, 41, 0.3)",
                  },
                }}
                aria-label="Send password recovery email"
              >
                Send Email
              </Button>
            </Box>
          </Fade>
        </Modal>

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
      </Container>
    </ThemeProvider>
  );
};

export default LoginForm;
