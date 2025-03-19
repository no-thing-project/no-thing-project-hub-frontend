// src/App.jsx
import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Button, Container, ThemeProvider, Typography } from "@mui/material";
import theme from "./Theme";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import BoardsPage from "./pages/BoardsPage";
import GatesPage from "./pages/GatesPage";
import ClassesPage from "./pages/ClassesPage";
import ClassPage from "./pages/ClassPage";
import LoginForm from "./components/Forms/LoginForm/LoginForm";
import ResetPasswordForm from "./components/Forms/ResetPasswordForm/ResetPasswordForm";
import Board from "./components/social-features/Board/Board";
import ErrorBoundary from "./components/Layout/ErrorBoudary";
import LoadingSpinner from "./components/Layout/LoadingSpinner";
import { useAuth } from "./hooks/useAuth";

const PrivateRoute = ({ element, isAuthenticated, redirectTo = "/login", loading }) => {
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? element : <Navigate to={redirectTo} replace />;
};

function App() {
  const { token, authData, isAuthenticated, handleLogin, handleLogout, loading, error } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Authentication Error: {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => handleLogout("Please log in again.")}
          sx={{ mt: 2 }}
        >
          Back to Login
        </Button>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
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
                  <Navigate to="/home" replace />
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
              path="/profile/:anonymous_id"
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
                  loading={loading}
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
                    />
                  }
                  loading={loading}
                />
              }
            />
            <Route
              path="/board/:board_id"
              element={
                <PrivateRoute
                  isAuthenticated={isAuthenticated}
                  element={
                    <Board
                      token={token}
                      currentUser={authData}
                      onLogout={handleLogout}
                    />
                  }
                  loading={loading}
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
                  loading={loading}
                />
              }
            />
            <Route
              path="/classes"
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
                  loading={loading}
                />
              }
            />
            <Route
              path="/class/:class_id"
              element={
                <PrivateRoute
                  isAuthenticated={isAuthenticated}
                  element={
                    <ClassPage
                      token={token}
                      currentUser={authData}
                      onLogout={handleLogout}
                    />
                  }
                  loading={loading}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />}
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;