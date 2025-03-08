// src/components/ResetPasswordForm.js
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
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../config";

const ResetPasswordForm = ({ theme, onLogin }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const tokenFromSearch = searchParams.get("token");
    const tokenFromHash = hashParams.get("token");
    const tokenFromUrl = tokenFromSearch || tokenFromHash;

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      console.log("Token extracted from URL:", tokenFromUrl);
    } else {
      setError("Токен відсутній у URL");
      console.error("No token found in URL");
    }
  }, []);

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Паролі не співпадають");
      console.error("Passwords do not match");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Пароль має містити мінімум 8 символів, великі та малі літери, цифру");
      console.error("Password validation failed");
      return;
    }

    if (!token) {
      setError("Токен не знайдено");
      console.error("Token is missing");
      return;
    }

    try {
      console.log("Sending reset password request with:", { token, newPassword });
      const response = await axios.post(
        `${config.REACT_APP_HUB_API_URL}/reset/set-password`,
        { token, newPassword }
      );
      console.log("Response from server:", response.data);

      const { token: jwtToken, authData } = response.data;

      setSuccess("Пароль успішно змінено, ви увійшли в систему");
      localStorage.setItem("token", jwtToken);
      console.log("Token saved to localStorage:", jwtToken);

      console.log("Calling onLogin with:", { jwtToken, authData });
      onLogin(jwtToken, authData); // Викликаємо onLogin
      console.log("onLogin called");

      setTimeout(() => {
        console.log("Navigating to /profile after timeout");
        navigate("/profile", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Error during reset password:", err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(" "));
      } else {
        setError(err.message);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" className="form-container">
        <Paper className="form-paper" elevation={3}>
          <Typography variant="h5" className="form-title">
            Скидання пароля
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Новий пароль"
              type="password"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Підтвердіть пароль"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Змінити пароль
            </Button>
          </form>
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
    </ThemeProvider>
  );
};

export default ResetPasswordForm;