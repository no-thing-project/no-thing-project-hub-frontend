// src/api/profileApi.js
import api from './apiClient';
import { handleApiError } from './apiClient';

export const fetchProfile = async (anonymous_id, token, signal) => {
  if (!anonymous_id) throw new Error('Profile ID is required');
  if (!token) throw new Error('Authentication token is required');

  try {
    const response = await api.get(`/api/v1/profile/${anonymous_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const updateProfile = async (profileData, token, signal) => {
  try {
    const response = await api.put(`/api/v1/profile/update`, profileData, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const deleteProfile = async (token, signal) => {
  try {
    const response = await api.delete(`/api/v1/profile/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content || response.data;
  } catch (err) {
    throw handleApiError(err);
  }
};

export const fetchPointsHistory = async (token, signal) => {
  try {
    const response = await api.get(`/api/v1/profile/points/history`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data?.content?.history || [];
  } catch (err) {
    throw handleApiError(err);
  }
};