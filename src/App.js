import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginForm from "./components/Login/LoginForm";
import Board from "./components/Board/Board";
import ResetPasswordForm from "./components/ResetPassword/ResetPasswordForm";
import "./index.css";
import { createTheme, ThemeProvider } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#212529",
    },
    secondary: {
      main: "#343A40",
    },
  },
});

function App() {
  // Retrieve token and authData from localStorage if available
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authData, setAuthData] = useState(
    localStorage.getItem("authData")
      ? JSON.parse(localStorage.getItem("authData"))
      : null
  );

  // New login handler that sets both token and authData
  const handleLogin = (token, authDataFromResponse) => {
    setToken(token);
    localStorage.setItem("token", token);

    if (authDataFromResponse) {
      setAuthData(authDataFromResponse);
      localStorage.setItem("authData", JSON.stringify(authDataFromResponse));
    } else {
      // Fallback: decode token to retrieve authData if not provided
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        setAuthData(payload);
        localStorage.setItem("authData", JSON.stringify(payload));
      } catch (e) {
        console.error("Invalid token");
      }
    }
  };

  useEffect(() => {
    // If token is available but authData is missing, decode token
    if (token && !authData) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        setAuthData(payload);
        localStorage.setItem("authData", JSON.stringify(payload));
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, [token, authData]);

  const handleLogout = () => {
    setToken(null);
    setAuthData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordForm theme={theme} />}
          />
          <Route
            path="/"
            element={
              token ? (
                <Board
                  token={token}
                  currentUser={authData}
                  onLogout={handleLogout}
                />
              ) : (
                <LoginForm theme={theme} onLogin={handleLogin} />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
