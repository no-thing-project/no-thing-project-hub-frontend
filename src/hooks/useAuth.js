// src/hooks/useAuth.js
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api, { handleApiError } from "../api/apiClient";

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
    const payload = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.warn("Token is expired:", payload.exp, "vs", currentTime);
      return null;
    }
    return payload.user ? payload.user : payload;
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};

const useAuth = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || null);
  const [authData, setAuthData] = useState(() => {
    try {
      const storedAuthData = localStorage.getItem("authData");
      return storedAuthData ? JSON.parse(storedAuthData) : null;
    } catch (e) {
      console.error("Failed to parse authData from localStorage:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isInitialValidationComplete = useRef(false);
  const refreshInProgress = useRef(false);
  const isLoggingOut = useRef(false);

  const handleLogout = useCallback((message) => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    setToken(null);
    setRefreshToken(null);
    setAuthData(null);
    localStorage.clear();

    setTimeout(() => {
      navigate('/login', { replace: true });
      window.location.reload();
    }, 0);

    setError(message || "Logged out.");
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || refreshInProgress.current) return false;

    refreshInProgress.current = true;
    try {
      const response = await api.post("/api/v1/auth/refresh", { refreshToken });
      const { accessToken: newToken, refreshToken: newRefreshToken } = response.data.content || response.data;

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      return true;
    } catch (err) {
      handleApiError(err, setError);
      handleLogout("Failed to refresh token. Please log in again.");
      return false;
    } finally {
      refreshInProgress.current = false;
    }
  }, [refreshToken, handleLogout]);

  const handleLogin = useCallback(
    async (newToken, newRefreshToken, authDataFromResponse) => {
      setLoading(true);
      setError(null);
      const decodedData = decodeToken(newToken);
      const normalizedAuthData = authDataFromResponse || decodedData;

      if (!normalizedAuthData?.anonymous_id) {
        setError("Invalid or missing authentication data.");
        setLoading(false);
        return;
      }

      setToken(newToken);
      setRefreshToken(newRefreshToken);
      setAuthData(normalizedAuthData);
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("authData", JSON.stringify(normalizedAuthData));
      isInitialValidationComplete.current = true;
      setLoading(false);

      navigate("/home");
    },
    [navigate]
  );

  const updateAuthData = useCallback((newAuthData) => {
    if (!newAuthData?.anonymous_id) return;
    setAuthData(newAuthData);
    localStorage.setItem("authData", JSON.stringify(newAuthData));
  }, []);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        if (status === 401 && !refreshInProgress.current) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return api.request(error.config);
          }
        } else if (status === 403) {
          if (!isLoggingOut.current) {
            handleLogout("Access denied. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, refreshAccessToken, handleLogout]);

  useEffect(() => {
    const validateAuth = async () => {
      if (isInitialValidationComplete.current) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (!token && !refreshToken) return;
        const payload = decodeToken(token);
        if (!payload) {
          await refreshAccessToken();
        } else if (!authData?.anonymous_id) {
          await handleLogin(token, refreshToken, payload);
        }
      } finally {
        setLoading(false);
        isInitialValidationComplete.current = true;
      }
    };
    validateAuth();
  }, [token, refreshToken, authData, handleLogin, refreshAccessToken]);

  const isAuthenticated = useMemo(
    () => !!token && !!authData?.anonymous_id && !!refreshToken,
    [token, authData, refreshToken]
  );

  return {
    token,
    refreshToken,
    authData,
    isAuthenticated,
    handleLogin,
    handleLogout,
    updateAuthData,
    loading,
    error,
    clearError: () => setError(null),
  };
};

export default useAuth;
