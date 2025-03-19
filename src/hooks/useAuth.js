// src/hooks/useAuth.js
import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000,
});

export const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [authData, setAuthData] = useState(() => {
    const storedAuthData = localStorage.getItem("authData");
    return storedAuthData ? JSON.parse(storedAuthData) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isInitialValidationComplete = useRef(false);

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
      return payload || null;
    } catch (e) {
      console.error("Invalid token:", e);
      return null;
    }
  };

  const handleLogout = useCallback((message) => {
    setToken(null);
    setAuthData(null);
    setError(null);
    localStorage.clear();
    console.log(message || "Logged out successfully.");
    window.location.href = "/login";
  }, []);

  const handleLogin = useCallback(
    (newToken, authDataFromResponse) => {
      setLoading(true);
      setError(null);

      const normalizedAuthData = authDataFromResponse || decodeToken(newToken);
      if (!normalizedAuthData) {
        handleLogout("Invalid or missing authentication data.");
        return;
      }

      const finalAuthData = {
        anonymous_id: normalizedAuthData.anonymous_id || "",
        email: normalizedAuthData.email || "",
        username: normalizedAuthData.username || "",
        access_level: normalizedAuthData.access_level || 0,
        created_at: normalizedAuthData.created_at || "",
        updated_at: normalizedAuthData.updated_at || "",
        created_content: normalizedAuthData.created_content || {},
        dateOfBirth: normalizedAuthData.dateOfBirth || null,
        donated_points: normalizedAuthData.donated_points || 0,
        gender: normalizedAuthData.gender || "",
        ethnicity: normalizedAuthData.ethnicity || "",
        fullName: normalizedAuthData.fullName || "",
        gate: normalizedAuthData.gate || null,
        isActive: normalizedAuthData.isActive || false,
        isPublic: normalizedAuthData.isPublic || false,
        lastSeen: normalizedAuthData.lastSeen || "",
        last_synced_at: normalizedAuthData.last_synced_at || "",
        likes_points: normalizedAuthData.likes_points || 0,
        location: normalizedAuthData.location || "",
        messages: normalizedAuthData.messages || [],
        nameVisibility: normalizedAuthData.nameVisibility || "Hide",
        onlineStatus: normalizedAuthData.onlineStatus || "offline",
        preferences: normalizedAuthData.preferences || {},
        profile_picture: normalizedAuthData.profile_picture || "",
        social_links: normalizedAuthData.social_links || {},
        stats: normalizedAuthData.stats || {},
        timezone: normalizedAuthData.timezone || "",
        total_points: normalizedAuthData.total_points || 0,
        tweet_points: normalizedAuthData.tweet_points || 0,
      };

      if (token !== newToken || JSON.stringify(authData) !== JSON.stringify(finalAuthData)) {
        console.log("Updating token and authData:", { newToken, finalAuthData });
        setToken(newToken);
        setAuthData(finalAuthData);
        localStorage.setItem("token", newToken);
        localStorage.setItem("authData", JSON.stringify(finalAuthData));
      }
      setLoading(false);
      isInitialValidationComplete.current = true;
    },
    [handleLogout, token, authData] // Added token and authData to dependencies
  );

  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      console.error("No refresh token available.");
      return null;
    }

    try {
      const response = await api.post("/api/v1/auth/refresh", { refreshToken }, {
        headers: { "Content-Type": "application/json" },
      });
      const { token: newToken, authData: newAuthData } = response.data;
      return { newToken, newAuthData };
    } catch (err) {
      console.error("Token refresh failed:", err);
      handleLogout("Failed to refresh token. Please log in again.");
      return null;
    }
  }, [handleLogout]);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => api.interceptors.request.eject(requestInterceptor);
  }, [token]);

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response) {
          if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const result = await refreshToken();
            if (result && result.newToken) {
              originalRequest.headers.Authorization = `Bearer ${result.newToken}`;
              handleLogin(result.newToken, result.newAuthData);
              return api(originalRequest);
            }
          } else if (error.response.status === 403) {
            handleLogout("Access denied. Invalid token. Please log in again.");
          }
        }
        setError(error.response?.data?.errors?.[0] || error.message || "An error occurred");
        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(responseInterceptor);
  }, [handleLogout, refreshToken, handleLogin]);

  useEffect(() => {
    const validateAuth = async () => {
      if (isInitialValidationComplete.current || (!token && !authData)) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      console.log("Validating auth:", { token, authData });

      if (token) {
        const payload = decodeToken(token);
        if (!payload) {
          const result = await refreshToken();
          if (result && result.newToken) {
            handleLogin(result.newToken, result.newAuthData);
          } else {
            handleLogout("Token validation failed and refresh failed.");
            return;
          }
        } else if (!authData || authData.anonymous_id === "") {
          handleLogin(token, payload);
        } else {
          setLoading(false);
        }
      } else if (authData) {
        handleLogout("No token found, clearing auth data.");
      } else {
        setLoading(false);
      }
    };

    validateAuth();
  }, [token, authData, handleLogin, handleLogout, refreshToken]);

  const isAuthenticated = !!token && !!authData;

  return { token, authData, isAuthenticated, handleLogin, handleLogout, loading, error };
};

export default api;