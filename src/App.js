import React, { lazy, Suspense, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import theme from "./Theme";
import LoadingSpinner from "./components/Layout/LoadingSpinner";
import useAuth from "./hooks/useAuth";
import { NotificationProvider, useNotification } from "./context/NotificationContext";

// Lazy load pages
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const BoardsPage = lazy(() => import("./pages/BoardsPage"));
const GatesPage = lazy(() => import("./pages/GatesPage"));
const GatePage = lazy(() => import("./pages/GatePage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
// const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LoginForm = lazy(() => import("./components/Forms/LoginForm/LoginForm"));
const ResetPasswordForm = lazy(() => import("./components/Forms/ResetPasswordForm/ResetPasswordForm"));

const PrivateRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const navigate = useNavigate();
  const { isAuthenticated, handleLogin, handleLogout, loading, error } = useAuth(navigate);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!isAuthenticated && !["/login", "/reset-password"].includes(window.location.pathname) && !loading) {
      showNotification("Please log in to continue.", "error");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, loading, navigate, showNotification]);

  useEffect(() => {
    if (error) {
      showNotification(`Authentication Error: ${error}`, "error");
      setTimeout(() => {
        handleLogout("Please log in again.");
      }, 2000);
    }
  }, [error, showNotification, handleLogout]);

  if (loading) return <LoadingSpinner />;
  if (error) return null; 

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordForm theme={theme}  onLogin={handleLogin}  />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginForm theme={theme}  onLogin={handleLogin}/>}
        />
        <Route
          path="/home"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<HomePage />} />}
        />
        <Route
          path="/profile/:anonymous_id"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ProfilePage />} />}
        />
        <Route
          path="/boards"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<BoardsPage />} />}
        />
        <Route
          path="/board/:board_id"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<BoardPage />} />}
        />
        <Route
          path="/gates"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<GatesPage />} />}
        />
        <Route
          path="/gate/:gate_id"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<GatePage />} />}
        />
        <Route
          path="/classes"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ClassesPage />} />}
        />
        <Route
          path="/class/:class_id"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<ClassPage />} />}
        />
        <Route
          path="/friends"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<FriendsPage />} />}
        />
        {/* <Route
          path="/messages"
          element={<PrivateRoute isAuthenticated={isAuthenticated} element={<MessagesPage />} />}
        /> */}
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;