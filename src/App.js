//src/App.js (HUB FE)
import React, { useState, useEffect, useCallback } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/Login/LoginForm";
import Board from "./components/Board/Board";
import ResetPasswordForm from "./components/ResetPassword/ResetPasswordForm";
import ProfilePage from "./components/Profile/ProfilePage";
import "./index.css";
import { createTheme, ThemeProvider } from "@mui/material";
import axios from "axios";
import config from "./config";

// Тема Material-UI
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#212529" },
    secondary: { main: "#343A40" },
    background: { default: "#F0F2F5" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};

// Компонент для захищених маршрутів
const PrivateRoute = ({ element, isAuthenticated, redirectTo = "/login" }) =>
  isAuthenticated ? element : <Navigate to={redirectTo} replace />;

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [authData, setAuthData] = useState(() => {
    const storedAuthData = localStorage.getItem("authData");
    return storedAuthData ? JSON.parse(storedAuthData) : null;
  });
  const [boards, setBoards] = useState([]);

  const handleLogout = useCallback((message) => {
    setToken(null);
    setAuthData(null);
    setBoards([]);
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
    if (message) console.log(message);
  }, []);

  // Налаштування Axios із перехопленням помилок
  useEffect(() => {
    const axiosInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout("Your session has expired. Please log in again.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(axiosInterceptor);
  }, [handleLogout]); // Додано handleLogout до залежностей

  // Обробка логіну
  const handleLogin = useCallback((token, authDataFromResponse) => {
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
      normalizedAuthData = decodeToken(token);
      if (!normalizedAuthData) {
        handleLogout("Invalid token detected.");
        return;
      }
      console.log("Decoded token payload:", normalizedAuthData);
    }

    setAuthData(normalizedAuthData);
    localStorage.setItem("authData", JSON.stringify(normalizedAuthData));
  }, [handleLogout]);

  // Синхронізація authData з токеном
  useEffect(() => {
    if (token && !authData) {
      const payload = decodeToken(token);
      if (payload) {
        setAuthData(payload);
        localStorage.setItem("authData", JSON.stringify(payload));
      } else {
        handleLogout("Invalid token detected.");
      }
    } else if (!token && authData) {
      handleLogout("No token found, clearing auth data.");
    }
  }, [token, authData, handleLogout]); // Додано всі залежності

  // Завантаження бордів
  const fetchBoards = useCallback(async () => {
    if (!token) {
      setBoards([]);
      return;
    }
    try {
      const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(res.data.content || []);
    } catch (err) {
      console.error("Error fetching boards:", err);
      if (err.response?.status !== 401) {
        // 401 обробляється в interceptor
        console.error("Failed to fetch boards");
      }
    }
  }, [token]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const isAuthenticated = !!token && !!authData;

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
              isAuthenticated ? (
                <Navigate to={`/profile/${authData?.user?.id}`} replace />
              ) : (
                <LoginForm theme={theme} onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={
                  <ProfilePage
                    currentUser={authData}
                    boards={boards}
                    onLogout={handleLogout}
                    token={token}
                  />
                }
              />
            }
          />
          <Route
            path="/board/:id"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={<Board token={token} currentUser={authData} onLogout={handleLogout} />}
              />
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? `/profile/${authData?.user?.id}` : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;