import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { Snackbar, Alert, Fade } from "@mui/material";
import PropTypes from "prop-types";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
    duration: 2000,
    anchorOrigin: { vertical: "bottom", horizontal: "center" },
    transition: Fade,
  });
  const notificationQueue = useRef([]);
  const timeoutRef = useRef(null);

  const showNotification = useCallback(
    (message, severity = "info", options = {}) => {
      if (!message) return;

      const notification = {
        message,
        severity,
        duration: options.duration ?? 2000,
        anchorOrigin: options.anchorOrigin ?? { vertical: "bottom", horizontal: "center" },
        transition: options.transition ?? Fade,
      };

      if (snackbar.open) {
        notificationQueue.current.push(notification);
      } else {
        setSnackbar({ ...notification, open: true });
      }
    },
    [snackbar.open]
  );

  const clearNotification = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    notificationQueue.current = [];
  }, []);

  const handleCloseSnackbar = useCallback(
    (event, reason) => {
      if (reason === "clickaway") return;
      setSnackbar((prev) => ({ ...prev, open: false }));
    },
    []
  );

  useEffect(() => {
    if (!snackbar.open && notificationQueue.current.length > 0) {
      timeoutRef.current = setTimeout(() => {
        const nextNotification = notificationQueue.current.shift();
        if (nextNotification) {
          setSnackbar({ ...nextNotification, open: true });
        }
      }, 200); // Delay for smooth transition
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [snackbar.open]);

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={handleCloseSnackbar}
        anchorOrigin={snackbar.anchorOrigin}
        TransitionComponent={snackbar.transition}
        role="alert"
        sx={{
          marginBottom: { xs: "3rem", md: 0 },
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", fontSize: "0.875rem" }}
          aria-label={`Notification: ${snackbar.message}`}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationProvider;