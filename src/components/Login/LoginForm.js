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
import config from "../../config";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ theme, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/auth/login`, { email, password });
      onLogin(res.data.token, res.data.authData);
      navigate("/profile");
    } catch (err) {
      console.error(err);
      if (err.response) {
        err.response.data.errors.forEach((error) => {
          setError(error);
        });

        return;
      }

      setError(err.message);
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
              label="Password"
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
