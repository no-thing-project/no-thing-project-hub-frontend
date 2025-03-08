// src/components/LoginForm.js
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
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../config";

const LoginForm = ({ theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Валідація email і password
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Введіть коректний email");
      return false;
    }
    if (!password || password.length < 8) {
      setError("Пароль має бути довжиною від 8 символів");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    try {
      const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/auth/login`, { email, password });
      const { token, authData } = res.data;

      // Зберігаємо токен у localStorage (опціонально, залежно від твого підходу)
      localStorage.setItem('token', token);
      onLogin(token, authData);
      navigate("/profile");
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors[0]);
      } else {
        setError(err.message || "Помилка мережі, спробуйте ще раз");
      }
    }
  };

  const handleCloseSnackbar = () => {
    setError("");
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm" className="form-container">
        <Paper className="form-paper" elevation={3}>
          <Typography variant="h5" className="form-title">
            Вхід
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Пароль"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Увійти
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
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default LoginForm;