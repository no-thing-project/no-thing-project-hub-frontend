import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { login, refreshToken, getProfile } from "../api/authApi";

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
    if (payload.exp && payload.exp < currentTime) return null;
    return payload.user ? payload.user : payload;
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};

const useAuth = (navigate) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [refreshTokenState, setRefreshTokenState] = useState(() => localStorage.getItem("refreshToken") || null);
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
  const isLoggingIn = useRef(false);

  const updateAuthData = useCallback((profile) => {
    if (!profile?.anonymous_id) {
      console.error("Invalid authData from profile:", profile);
      return;
    }
    setAuthData((prev) => {
      const newAuthData = { ...prev, ...profile };
      localStorage.setItem("authData", JSON.stringify(newAuthData));
      console.log("Auth data updated in useAuth:", newAuthData);
      return newAuthData;
    });
  }, []);

  const handleLogout = useCallback(
    (message) => {
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;

      setToken(null);
      setRefreshTokenState(null);
      setAuthData(null);
      localStorage.clear();
      setError(message || "Logged out successfully.");
      if (navigate) navigate("/login", { replace: true });
    },
    [navigate]
  );

  const refreshAccessToken = useCallback(async () => {
    if (!refreshTokenState || refreshInProgress.current) {
      handleLogout("No refresh token available or refresh in progress.");
      return false;
    }
    refreshInProgress.current = true;
    setLoading(true);
    try {
      const { accessToken: newToken, refreshToken: newRefreshToken } = await refreshToken(refreshTokenState);
      setToken(newToken);
      setRefreshTokenState(newRefreshToken);
      localStorage.setItem("token", newToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage =
        err.status === 404
          ? "Authentication service unavailable."
          : err.status === 403
          ? "Refresh token invalid or expired."
          : "Session expired.";
      setError(errorMessage);
      handleLogout(errorMessage);
      return false;
    } finally {
      refreshInProgress.current = false;
      setLoading(false);
    }
  }, [refreshTokenState, handleLogout]);

  const handleLogin = useCallback(
    async (arg1, arg2, arg3) => {
      if (isLoggingIn.current) return;
      isLoggingIn.current = true;
      setLoading(true);
      setError(null);

      try {
        let accessToken, refreshToken, profile;
        if (typeof arg1 === "string" && !arg1.includes(".")) {
          const response = await login(arg1, arg2);
          accessToken = response.accessToken;
          refreshToken = response.refreshToken;
          profile = response.profile;
        } else {
          accessToken = arg1;
          refreshToken = arg2;
          profile = arg3;
        }

        const decodedData = decodeToken(accessToken);
        const normalizedAuthData = profile || decodedData;
        if (!normalizedAuthData?.anonymous_id) {
          throw new Error("Invalid authentication data.");
        }
        setToken(accessToken);
        setRefreshTokenState(refreshToken);
        setAuthData(normalizedAuthData);
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("authData", JSON.stringify(normalizedAuthData));
        isInitialValidationComplete.current = true;
        console.log("Login state updated:", { accessToken, refreshToken, profile });
      } catch (err) {
        setError(err.message || "Login failed.");
      } finally {
        setLoading(false);
        isLoggingIn.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const validateAuth = async () => {
      if (isInitialValidationComplete.current || isLoggingIn.current) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (!token && !refreshTokenState) {
          handleLogout("No authentication data found.");
          return;
        }
        const payload = decodeToken(token);
        if (!payload) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            handleLogout("Token expired and refresh failed.");
          }
        } else if (!authData?.anonymous_id) {
          const profile = await getProfile(token);
          updateAuthData(profile);
        }
      } catch (err) {
        handleLogout("Authentication validation failed.");
      } finally {
        setLoading(false);
        isInitialValidationComplete.current = true;
      }
    };
    validateAuth();
  }, [token, refreshTokenState, authData, refreshAccessToken, handleLogout, updateAuthData]);

  useEffect(() => {
    if (!token || isLoggingIn.current) return;
    const payload = decodeToken(token);
    if (!payload?.exp) return;

    const timeToExpire = payload.exp * 1000 - Date.now();
    const refreshThreshold = 5 * 60 * 1000;

    if (timeToExpire < refreshThreshold) {
      refreshAccessToken();
    } else {
      const timeout = setTimeout(refreshAccessToken, timeToExpire - refreshThreshold);
      return () => clearTimeout(timeout);
    }
  }, [token, refreshAccessToken]);

  const isAuthenticated = useMemo(
    () => !!token && !!authData?.anonymous_id && !!refreshTokenState,
    [token, authData, refreshTokenState]
  );

  return {
    token,
    refreshToken: refreshTokenState,
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