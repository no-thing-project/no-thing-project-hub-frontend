import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000, // Optional: Add a timeout to prevent hanging requests
});

// Generic error handler
export const handleApiError = (err, setError) => {
  const errorMessage =
    err.response?.data?.errors?.[0] || err.message || "An error occurred";
  const detailedError = {
    message: errorMessage,
    status: err.response?.status,
    url: err.config?.url,
    method: err.config?.method,
  };
  console.error("API Error:", detailedError);
  if (setError) setError(errorMessage);
  return Promise.reject(errorMessage);
};

export default api;