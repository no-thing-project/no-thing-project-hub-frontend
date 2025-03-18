// src/components/Login/LoginForm.js (HUB)
import React, { useState } from "react";
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
import config from "../../../../config";

const LoginForm = ({ theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await axios.post(
        `${config.REACT_APP_HUB_API_URL}/api/v1/auth/login`,
        {
          email,
          password,
        }
      );
      const token = res.data.token;
      const authData = res.data.profile;

      localStorage.setItem("token", token);
      onLogin(token, authData);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.errors?.[0] || "Network error, please try again"
      );
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
      console.error("Forgot password error:", err);
      setError(
        err.response?.data?.errors?.[0] || "Network error, please try again"
      );
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
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh"
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 5,
            borderRadius: theme.shape.borderRadiusMedium,
            backgroundColor: "backgroung.paper",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
            width: theme.custom.loginPaperWidth,
            maxWidth: theme.custom.loginPaperMaxWidth,
            textAlign: "center"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 3}}>
            <Typography
              variant="h4"
              sx={{ color: "text.primary", fontWeight: 600 }}
            >
              Sign In
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
              Sign in to continue
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2, textAlign: "left" }}
          >
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{ notched: false }}
              sx={{
                mt: 1,
                "& .MuiFormLabel-root.MuiInputLabel-shrink": {
                  backgroundColor: "background.paper",
                  padding: "0 5px"
                },
                "& .MuiInputLabel-root": {
                  color: "text.secondary",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "text.primary",
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadiusSmall,
                  "&:hover fieldset": {
                    borderColor: "background.button",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "background.button",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: theme.palette.text.secondary
                },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mt: 1,
                "& .MuiFormLabel-root.MuiInputLabel-shrink": {
                  backgroundColor: "background.paper",
                  padding: "0 5px"
                },
                "& .MuiInputLabel-root": {
                  color: "text.secondary",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "text.primary",
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadiusSmall,
                  "&:hover fieldset": {
                    borderColor: "background.button",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "background.button",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: theme.palette.text.secondary,
                },
              }}
              InputProps={{
                notched: false,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                minHeight: theme.custom.loginButtonHeight,
                borderRadius: theme.shape.borderRadiusSmall,
                backgroundColor: "background.button",
                color: "background.default",
                textTransform: "none",
                fontSize: theme.custom.loginButtonFontSize,
                boxShadow: "0 4px 12px rgba(33, 37, 41, 0.2)",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transition: "all 0.3s ease-in-out",
                  backgroundColor: "background.button",
                  opacity: 0.9,
                  boxShadow: "0 6px 16px rgba(33, 37, 41, 0.3)",
                },
              }}
            >
              Sign In
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="text"
              sx={{
                color: "text.primary",
                textTransform: "none",
                fontSize: "16px",
              }}
              onClick={handleOpenModal}
            >
              Forgot password?
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
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
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Paper>

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
                p: 4,
                width: "100%",
                maxWidth: theme.custom.loginPaperMaxWidth,
              }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: theme.typography.fontWeightMedium }}
              >
                Password Recovery
              </Typography>
              <TextField
                label="Your email"
                variant="outlined"
                fullWidth
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                InputProps={{ notched: false }}
                sx={{
                  mb: 2,
                  "& .MuiFormLabel-root.MuiInputLabel-shrink": {
                  backgroundColor: "background.paper",
                  padding: "0 5px"
                },
                  "& .MuiInputLabel-root": {
                    color: "text.secondary",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "text.primary",
                  },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: theme.shape.borderRadiusSmall,
                    "&:hover fieldset": {
                      borderColor: "background.button",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "background.button",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: theme.palette.text.secondary,
                  },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleForgotPassword}
                sx={{
                  backgroundColor: "background.button",
                  color: "background.default",
                  borderRadius: theme.shape.borderRadiusSmall,
                  textTransform: "none",
                  fontSize: theme.custom.loginButtonFontSize,
                  minHeight: theme.custom.loginButtonHeight,
                  boxShadow: "0 4px 12px rgba(33, 37, 41, 0.2)",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transition: "all 0.3s ease-in-out",
                    backgroundColor: "background.button",
                    opacity: 0.9,
                    boxShadow: "0 6px 16px rgba(33, 37, 41, 0.3)",
                  },
                }}
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
          >
            {success}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default LoginForm;
