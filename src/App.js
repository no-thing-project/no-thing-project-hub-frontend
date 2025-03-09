//App.js (front hub)
import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/Login/LoginForm";
import Board from "./components/Board/Board";
import ResetPasswordForm from "./components/ResetPassword/ResetPasswordForm";
import "./index.css";
import { createTheme, ThemeProvider } from "@mui/material";
import axios from "axios";
import config from "./config";
import ProfilePage from "./components/Profile/ProfilePage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#212529" },
    secondary: { main: "#343A40" },
    background: { default: "#F0F2F5" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authData, setAuthData] = useState(
    localStorage.getItem("authData") ? JSON.parse(localStorage.getItem("authData")) : null
  );
  const [boards, setBoards] = useState([]);

  const handleLogin = (token, authDataFromResponse) => {
    console.log("handleLogin called with:", { token, authDataFromResponse });
    setToken(token);
    localStorage.setItem("token", token);
  
    let normalizedAuthData;
    if (authDataFromResponse) {
      normalizedAuthData = {
        user: {
          id: authDataFromResponse.user_id,
          email: authDataFromResponse.email,
          username: authDataFromResponse.username,
        },
        ...authDataFromResponse,
      };
      console.log("Setting authData from response:", normalizedAuthData);
    } else {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        normalizedAuthData = JSON.parse(jsonPayload);
        console.log("Decoded token payload:", normalizedAuthData);
      } catch (e) {
        console.error("Invalid token:", e);
        return;
      }
    }
    setAuthData(normalizedAuthData);
    localStorage.setItem("authData", JSON.stringify(normalizedAuthData));
    console.log("Token sent to ProfilePage:", token); // Додаємо дебаг
  };

  useEffect(() => {
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
        console.error("Invalid token:", e);
      }
    }
  }, [token, authData]);

  useEffect(() => {
    if (token) {
      const fetchBoards = async () => {
        try {
          const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/boards`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBoards(res.data.content);
        } catch (err) {
          console.error("Error fetching boards:", err);
        }
      };
      fetchBoards();
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setAuthData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
    setBoards([]);
    window.location.reload(); // Примусово оновлюємо сторінку
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route
            path="/reset-password"
            element={<ResetPasswordForm theme={theme} onLogin={handleLogin} />}
          />
          <Route
            path="/login"
            element={
              token && authData ? (
                <Navigate to={`/profile/${authData?.user?.id}`} replace />
              ) : (
                <LoginForm theme={theme} onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/profile/:userId"
            element={
              token && authData ? (
                <ProfilePage
                  currentUser={authData}
                  boards={boards}
                  onLogout={handleLogout}
                  token={token}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/board/:id"
            element={
              token ? (
                <Board token={token} currentUser={authData} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={token && authData ? `/profile/${authData?.user?.id}` : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;