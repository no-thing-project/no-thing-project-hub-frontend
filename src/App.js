// src/App.jsx
import React, { lazy, Suspense, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./index.css";
import { Button, Container, ThemeProvider, Typography } from "@mui/material";
import theme from "./Theme";
import ErrorBoundary from "./components/Layout/ErrorBoudary";
import LoadingSpinner from "./components/Layout/LoadingSpinner";
import useAuth  from "./hooks/useAuth";

// Lazy load pages to improve performance
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const BoardsPage = lazy(() => import("./pages/BoardsPage"));
const GatesPage = lazy(() => import("./pages/GatesPage"));
const GatePage = lazy(() => import("./pages/GatePage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage")); // Add NotFoundPage
const LoginForm = lazy(() => import("./components/Forms/LoginForm/LoginForm"));
const ResetPasswordForm = lazy(() => import("./components/Forms/ResetPasswordForm/ResetPasswordForm"));

const PrivateRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const navigate = useNavigate();
  const { token, authData, isAuthenticated, handleLogin, handleLogout, loading, error, clearError } = useAuth(navigate);

  const handleRetry = useCallback(() => {
    clearError();
    handleLogin(token, authData?.refreshToken, authData); // Retry authentication
  }, [clearError, handleLogin, token, authData]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error" role="alert">
          Authentication Error: {error}
        </Typography>
        <Button
          variant="contained"
          onClick={handleRetry}
          sx={{ mt: 2, mr: 1 }}
          aria-label="Retry authentication"
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleLogout("Please log in again.")}
          sx={{ mt: 2 }}
          aria-label="Back to login"
        >
          Back to Login
        </Button>
      </Container>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
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
              element={<HomePage />}
            />
          }
        />
        <Route
          path="/profile/:anonymous_id"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<ProfilePage />}
            />
          }
        />
        <Route
          path="/boards"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<BoardsPage />}
            />
          }
        />
        <Route
          path="/board/:board_id"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<BoardPage />}
            />
          }
        />
        <Route
          path="/gates"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<GatesPage />}
            />
          }
        />
        <Route
          path="/gate/:gate_id"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<GatePage />}
            />
          }
        />
        <Route
          path="/classes"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<ClassesPage />}
            />
          }
        />
        <Route
          path="/class/:class_id"
          element={
            <PrivateRoute
              isAuthenticated={isAuthenticated}
              element={<ClassPage />}
            />
          }
        />
        <Route
          path="/not-found"
          element={<NotFoundPage />}
        />
        <Route
          path="*"
          element={<Navigate to="/not-found" replace />}
        />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;