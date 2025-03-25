// src/api/apiClient.js
import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000,
});

export const handleApiError = (err, setError) => {
  const errorMessage = err.response?.data?.errors?.[0] || err.message || 'An error occurred';
  const detailedError = {
    message: errorMessage,
    status: err.response?.status,
    url: err.config?.url,
    method: err.config?.method,
  };
  console.error('API Error:', detailedError);
  if (setError) setError(errorMessage);
  const error = new Error(errorMessage);
  error.status = err.response?.status;
  throw error;
};

export default api;