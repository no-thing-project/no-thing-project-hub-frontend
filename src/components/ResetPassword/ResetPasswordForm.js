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
import config from "../../config";

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
      setError("Токен відсутній у URL");
      console.error("No token found in URL");
    }
  }, []);

  const validateInputs = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!newPassword) return "Новий пароль є обов'язковим";
    if (!passwordRegex.test(newPassword))
      return "Пароль має містити мінімум 8 символів, великі та малі літери, цифру";
    if (newPassword.length > 128) return "Пароль не може перевищувати 128 символів";
    if (newPassword !== confirmPassword) return "Паролі не співпадають";
    if (!token) return "Токен не знайдено";
    if (token.length < 32) return "Токен має бути щонайменше 32 символи";
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
      const response = await axios.post(`${config.REACT_APP_HUB_API_URL}/auth/set-password`, {
        token,
        newPassword,
      });
      console.log("Response from server:", response.data);

      const { token: jwtToken, authData } = response.data;

      setSuccess("Пароль успішно змінено! Ви увійшли в систему.");
      localStorage.setItem("token", jwtToken);
      onLogin(jwtToken, authData);

      setTimeout(() => navigate("/profile", { replace: true }), 2000);
    } catch (err) {
      console.error("Error during reset password:", err);
      setError(
        err.response?.data?.errors?.[0] || "Помилка мережі, спробуйте ще раз"
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
            Створити пароль
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Новий пароль"
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
              label="Підтвердіть пароль"
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
              Змінити пароль
            </Button>
          </form>
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button
              variant="text"
              color="primary"
              onClick={handleBackToLogin}
              sx={styles.backButton}
            >
              Повернутися до входу
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