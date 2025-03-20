// src/App.jsx
import React, { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { Button, Container, ThemeProvider, Typography } from "@mui/material";
import theme from "./Theme";
import ErrorBoundary from "./components/Layout/ErrorBoudary";
import LoadingSpinner from "./components/Layout/LoadingSpinner";
import { useAuth } from "./hooks/useAuth";

// Lazy load pages to improve performance
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const BoardsPage = lazy(() => import("./pages/BoardsPage"));
const GatesPage = lazy(() => import("./pages/GatesPage"));
const GatePage = lazy(() => import("./pages/GatePage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const LoginForm = lazy(() => import("./components/Forms/LoginForm/LoginForm"));
const ResetPasswordForm = lazy(() => import("./components/Forms/ResetPasswordForm/ResetPasswordForm"));

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
                      <BoardPage
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
                path="/gate/:gate_id"
                element={
                  <PrivateRoute
                    isAuthenticated={isAuthenticated}
                    element={
                      <GatePage
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
          </Suspense>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;