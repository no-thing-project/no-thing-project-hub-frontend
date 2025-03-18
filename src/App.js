// src/App.js (HUB FE)
import React, { useState, useEffect, useCallback } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./index.css";
import { ThemeProvider } from "@mui/material";
import axios from "axios";
import config from "./config";
import theme from "./Theme";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import BoardsPage from "./pages/BoardsPage";
import GatesPage from "./pages/GatesPage";
import ClassesPage from "./pages/ClassesPage";

import LoginForm from "./components/forms/LoginForm/LoginForm";
import ResetPasswordForm from "./components/forms/ResetPasswordForm/ResetPasswordForm";
import Board from "./components/social-features/Board/Board";

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
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );
  const [authData, setAuthData] = useState(() => {
    const storedAuthData = localStorage.getItem("authData");
    return storedAuthData ? JSON.parse(storedAuthData) : null;
  });
  const [boards, setBoards] = useState([]);

  const handleLogout = useCallback((message) => {
    setToken(null);
    setAuthData(null);
    setBoards([]);
    localStorage.clear();
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
  }, [handleLogout]);

  // Обробка логіну
  const handleLogin = useCallback(
    (token, authDataFromResponse) => {
      setToken(token);
      localStorage.setItem("token", token);

      let normalizedAuthData;
      if (authDataFromResponse) {
        normalizedAuthData = {
          id: authDataFromResponse._id,
          anonymous_id: authDataFromResponse.anonymous_id,
          email: authDataFromResponse.email,
          username: authDataFromResponse.username,
          access_level: authDataFromResponse.access_level,
          created_at: authDataFromResponse.created_at,
          updated_at: authDataFromResponse.updated_at,
          created_content: authDataFromResponse.created_content,
          dateOfBirth: authDataFromResponse.dateOfBirth,
          donated_points: authDataFromResponse.donated_points,
          gender: authDataFromResponse.gender,
          ethnicity: authDataFromResponse.ethnicity,
          fullName: authDataFromResponse.fullName,
          gate: authDataFromResponse.gate,
          is_user_active: authDataFromResponse.isActive,
          is_user_public: authDataFromResponse.isPublic,
          lastSeen: authDataFromResponse.lastSeen,
          last_synced_at: authDataFromResponse.last_synced_at,
          likes_points: authDataFromResponse.likes_points,
          location: authDataFromResponse.location,
          messages: authDataFromResponse.messages,
          nameVisibility: authDataFromResponse.nameVisibility,
          onlineStatus: authDataFromResponse.onlineStatus,
          preferences: authDataFromResponse.preferences,
          profile_picture: authDataFromResponse.profile_picture,
          social_links: authDataFromResponse.social_links,
          stats: authDataFromResponse.stats,
          timezone: authDataFromResponse.timezone,
          total_points: authDataFromResponse.total_points,
          tweet_points: authDataFromResponse.tweet_points,
        };
      } else {
        normalizedAuthData = decodeToken(token);

        if (!normalizedAuthData) {
          handleLogout("Invalid token detected.");
          return;
        }
      }

      setAuthData(normalizedAuthData);
      localStorage.setItem("authData", JSON.stringify(normalizedAuthData));
    },
    [handleLogout]
  );

  // Синхронізація authData з токеном
  useEffect(() => {
    if (token && !authData) {
      const payload = decodeToken(token);
      if (payload) {
        setAuthData(payload);
        localStorage.setItem("authData", JSON.stringify(payload));
      } else {
        handleLogout("Invalid or corrupted token detected.");
      }
    } else if (!token && authData) {
      handleLogout("No token found, clearing auth data.");
    }
  }, [token, authData, handleLogout]);

  // Завантаження бордів
  const fetchBoards = useCallback(async () => {
    if (!token) {
      setBoards([]);
      return;
    }
    try {
      const res = await axios.get(
        `${config.REACT_APP_HUB_API_URL}/api/v1/boards`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBoards(res.data.content.boards || []);
    } catch (err) {
      console.error("Error fetching boards:", err);
      if (err.response?.status !== 401) {
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
                <Navigate to={`/home`} replace />
              ) : (
                <LoginForm theme={theme} onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={
                  <HomePage
                    currentUser={authData}
                    onLogout={handleLogout}
                    token={token}
                  />
                }
              />
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
                    onLogout={handleLogout}
                    token={token}
                  />
                }
              />
            }
          />
          <Route
            path="/boards"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={
                  <BoardsPage
                    currentUser={authData}
                    token={token}
                    onLogout={handleLogout}
                    boards={boards}
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
                element={
                  <Board
                    token={token}
                    currentUser={authData}
                    boards={boards}
                    onLogout={handleLogout}
                  />
                }
              />
            }
          />
          <Route
            path="/gates"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={
                  <GatesPage
                    token={token}
                    currentUser={authData}
                    onLogout={handleLogout}
                  />
                }
              />
            }
          />
          <Route
            path="/classes/:gateId"
            element={
              <PrivateRoute
                isAuthenticated={isAuthenticated}
                element={
                  <ClassesPage
                    token={token}
                    currentUser={authData}
                    onLogout={handleLogout}
                  />
                }
              />
            }
          />
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? `/home` : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
