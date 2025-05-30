import { get, put, del, handleApiError } from './apiClient';

const BASE_PROFILE_PATH = '/api/v1/profile';

/**
 * Fetch user profile
 * @param {string} anonymous_id - Anonymous ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Profile data
 */
export const fetchProfile = async (anonymous_id, token, signal) => {
  if (!anonymous_id || typeof anonymous_id !== 'string' || !anonymous_id.trim()) throw new Error('Profile ID is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await get(`${BASE_PROFILE_PATH}/${anonymous_id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update user profile
 * @param {object} profileData - Profile data
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Updated profile data
 */
export const updateProfile = async (profileData, token, signal) => {
  if (!profileData || typeof profileData !== 'object' || Object.keys(profileData).length === 0) throw new Error('Profile data is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await put(`${BASE_PROFILE_PATH}/update`, profileData, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete user profile
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Deletion confirmation
 */
export const deleteProfile = async (token, signal) => {
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await del(`${BASE_PROFILE_PATH}/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch points history
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<array>} Points history
 */
export const fetchPointsHistory = async (token, signal) => {
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await get(`${BASE_PROFILE_PATH}/points/history`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content?.history || [];
  } catch (error) {
    throw handleApiError(error);
  }
};