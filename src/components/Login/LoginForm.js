//src/components/Login/LoginForm.js (HUB)
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
import config from "../../config";

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center" },
  paper: {
    p: 4,
    borderRadius: 3,
    background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
    width: "100%",
  },
  title: { fontWeight: 700, letterSpacing: "-0.5px" },
  subtitle: { mt: 1 },
  button: {
    mt: 2,
    py: 1.5,
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "16px",
    boxShadow: "0 4px 12px rgba(33, 37, 41, 0.2)",
    "&:hover": { boxShadow: "0 6px 16px rgba(33, 37, 41, 0.3)" },
  },
  linkButton: { textTransform: "none", fontSize: "14px" },
  textField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      "&:hover fieldset": { borderColor: "primary.main" },
    },
  },
  modalBox: {
    bgcolor: "background.paper",
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
    width: "100%",
    maxWidth: 400,
  },
};

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

    if (!email) return "Email є обов'язковим";
    if (!emailRegex.test(email)) return "Введіть коректний email";
    if (email.length > 255) return "Email не може перевищувати 255 символів";
    if (!password) return "Пароль є обов'язковим";
    if (password.length < 8) return "Пароль має бути довжиною від 8 символів";
    if (password.length > 128) return "Пароль не може перевищувати 128 символів";
    return null;
  };

  const validateForgotEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!forgotEmail) return "Email є обов'язковим";
    if (!emailRegex.test(forgotEmail)) return "Введіть коректний email";
    if (forgotEmail.length > 255) return "Email не може перевищувати 255 символів";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/auth/login`, {
        email,
        password,
      });
      const { token, authData } = res.data;

      localStorage.setItem("token", token);
      onLogin(token, authData);
      navigate("/profile");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.errors?.[0] || "Помилка мережі, спробуйте ще раз"
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
      console.log(`Sending forgot-password request to: ${config.REACT_APP_HUB_API_URL}/auth/forgot-password`);
      await axios.post(`${config.REACT_APP_HUB_API_URL}/auth/forgot-password`, {
        email: forgotEmail,
      });
      setSuccess("Лист із посиланням для відновлення пароля відправлено!");
      setTimeout(() => handleCloseModal(), 2000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err.response?.data?.errors?.[0] || "Помилка мережі, спробуйте ще раз"
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
      <Container maxWidth="xs" sx={styles.container}>
        <Paper elevation={6} sx={styles.paper}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={styles.title} color="primary.main">
              Вхід
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={styles.subtitle}>
              Увійдіть, щоб продовжити
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={styles.textField}
            />
            <TextField
              label="Пароль"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={styles.textField}
              InputProps={{
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
              color="primary"
              fullWidth
              sx={styles.button}
            >
              Увійти
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="text"
              color="primary"
              onClick={handleOpenModal}
              sx={styles.linkButton}
            >
              Забули пароль?
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Немає акаунта?{" "}
              <Link
                href={registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Реєстрація
              </Link>
            </Typography>
          </Box>
        </Paper>

        <Modal
          open={openModal}
          onClose={handleCloseModal}
          closeAfterTransition
          sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Fade in={openModal}>
            <Box sx={styles.modalBox}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                Відновлення пароля
              </Typography>
              <TextField
                label="Ваш email"
                variant="outlined"
                fullWidth
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleForgotPassword}
                sx={styles.button}
              >
                Відправити email
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
      </Container>
    </ThemeProvider>
  );
};

export default LoginForm;