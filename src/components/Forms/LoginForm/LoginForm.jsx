import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  ThemeProvider,
  Box,
  Link,
  Modal,
  Fade,
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

const LoginForm = ({ theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const modalRef = useRef(null);

  const registrationLink = "https://secure.wayforpay.com/donate/NoThingProject";

  const validateInputs = useCallback(() => {
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
  }, [email, password]);

  const validateForgotEmail = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!forgotEmail) return "Email is required";
    if (!emailRegex.test(forgotEmail)) return "Please enter a valid email address";
    if (forgotEmail.length > 255) return "Email cannot exceed 255 characters";
    return null;
  }, [forgotEmail]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setIsCheckingCredentials(true);

      const validationError = validateInputs();
      if (validationError) {
        showNotification(validationError, "error");
        setIsSubmitting(false);
        setIsCheckingCredentials(false);
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
        showNotification("Login successful! Redirecting...", "success");
        setTimeout(() => navigate("/home", { replace: true }), 2000);
      } catch (err) {
        console.error("Login error:", err.response?.data || err);
        const errorMessage =
          err.response?.status === 401
            ? "Invalid email or password. Please try again."
            : err.response?.data?.errors?.[0] ||
              err.response?.data?.message ||
              "Network error, please try again";
        showNotification(errorMessage, "error");
        setIsSubmitting(false);
        setIsCheckingCredentials(false);
      }
    },
    [email, password, navigate, onLogin, showNotification, validateInputs]
  );

  const handleForgotPassword = useCallback(async () => {
    const validationError = validateForgotEmail();
    if (validationError) {
      showNotification(validationError, "error");
      return;
    }

    try {
      await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/auth/forgot-password`, {
        email: forgotEmail,
      });
      showNotification("An email with a password reset link has been sent!", "success");
      setTimeout(() => handleCloseModal(), 2000);
    } catch (err) {
      console.error("Forgot password error:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.errors?.[0] ||
        err.response?.data?.message ||
        "Network error, please try again";
      showNotification(errorMessage, "error");
    }
  }, [forgotEmail, showNotification, validateForgotEmail]);

  const handleOpenModal = useCallback(() => setOpenModal(true), []);
  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setForgotEmail("");
  }, []);

  const handleKeyDown = useCallback(
    (e, callback) => {
      if (e.key === "Enter" && !isSubmitting) {
        e.preventDefault();
        callback();
      }
    },
    [isSubmitting]
  );

  useEffect(() => {
    if (openModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [openModal]);

  if (isCheckingCredentials) {
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
              Checking credentials…
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
                onKeyDown={(e) => handleKeyDown(e, () => handleSubmit(e))}
                InputProps={{ notched: false }}
                sx={inputStyles}
                required
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, () => handleSubmit(e))}
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
              ref={modalRef}
              tabIndex={-1}
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
                onKeyDown={(e) => handleKeyDown(e, handleForgotPassword)}
                InputProps={{ notched: false }}
                sx={inputStyles}
                required
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
      </Container>
    </ThemeProvider>
  );
};

export default LoginForm;