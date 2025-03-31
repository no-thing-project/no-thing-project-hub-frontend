// src/api/authApi.js
import api from './apiClient';
import { handleApiError } from './apiClient';

export const login = async (email, password) => {
  try {
    const requestId = Date.now().toString(); // Унікальний ID запиту
    console.log(`Login request [${requestId}]:`, { email, password });
    const response = await api.post('/api/v1/auth/login', { email, password }, {
      headers: { 'X-Request-ID': requestId },
    });
    const data = response.data.content || response.data;
    console.log(`Login response [${requestId}]:`, data);
    if (!data.accessToken || !data.refreshToken || !data.profile) {
      throw new Error('Invalid login response: Missing tokens or profile');
    }
    return data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Інші методи без змін...
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post('/api/v1/auth/refresh', { refreshToken });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/api/v1/auth/profile');
    return response.data.content?.profile || response.data.profile;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const setPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/api/v1/auth/set-password', { token, newPassword });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};