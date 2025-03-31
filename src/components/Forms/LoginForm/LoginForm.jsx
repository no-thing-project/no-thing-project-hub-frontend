// src/components/Forms/LoginForm/LoginForm.jsx
// src/components/Forms/LoginForm/LoginForm.jsx
import React, { useState, useEffect, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import { login, forgotPassword } from "../../../api/authApi";
import { inputStyles, actionButtonStyles } from "../../../styles/BaseStyles";

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
  const isSubmittingRef = useRef(false);

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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    console.log("Submitting login form:", { email, password });

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const response = await login(email, password);
      console.log("Login response:", response);
      const { accessToken, refreshToken, profile } = response;
      if (!accessToken || !refreshToken || !profile) {
        throw new Error("Invalid login response: Missing tokens or profile");
      }
      onLogin(accessToken, refreshToken, profile); // Оновлюємо стан у useAuth
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/home", { replace: true });
        console.log("Redirected to /home");
      }, 3000);
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err.status === 401
          ? "Invalid email or password. Please try again."
          : err.message || "Network error, please try again";
      setError(errorMessage);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
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
      const response = await forgotPassword(forgotEmail);
      if (response.code !== 200) {
        throw new Error(response.errors?.[0] || "Failed to send reset email");
      }
      setSuccess("An email with a password reset link has been sent!");
      setTimeout(() => handleCloseModal(), 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      const errorMessage = err.message || "Network error, please try again";
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

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
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
              width: "100%",
              maxWidth: theme.custom.loginPaperMaxWidth,
              textAlign: "center",
            }}
          >
            <Box sx={{ textAlign: "center", mb: theme.spacing(3) }}>
              <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 600 }}>
                Sign In
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", mt: theme.spacing(1) }}>
                Sign in to continue
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: theme.spacing(2), textAlign: "left" }}
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
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        sx={{ color: "text.primary" }}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                required
                error={!!error && error.includes("Password")}
                aria-describedby={
                  error && error.includes("Password") ? "password-error" : undefined
                }
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
                  fullWidth
                  disabled={isSubmitting}
                  sx={actionButtonStyles}
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
                    padding: "8px 20px",
                    borderRadius: "20px",
                    "&:hover": { textDecoration: "underline" },
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
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                p: theme.spacing(5),
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
                sx={actionButtonStyles}
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