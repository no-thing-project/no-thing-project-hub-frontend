// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const timeoutRef = useRef(null);
  const pendingNotification = useRef(null);

  const showNotification = useCallback((message, severity = 'info') => {
    if (!message) return;

    if (snackbar.open) {
      pendingNotification.current = { message, severity };
      return;
    }

    setSnackbar({ open: true, message, severity });
  }, [snackbar.open]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    if (!snackbar.open && pendingNotification.current) {
      timeoutRef.current = setTimeout(() => {
        const { message, severity } = pendingNotification.current;
        pendingNotification.current = null;
        setSnackbar({ open: true, message, severity });
      }, 100); // трохи відтермінувати, щоб уникнути циклів
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [snackbar.open]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
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
