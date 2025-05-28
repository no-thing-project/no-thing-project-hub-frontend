import { get, post, handleApiError } from './apiClient';

const BASE_SOCIAL_PATH = '/api/v1/social/friends';

/**
 * Add a friend
 * @param {string} friendId - Friend ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Friend data
 */
export const addFriend = async (friendId, token) => {
  if (!friendId || typeof friendId !== 'string' || !friendId.trim()) throw new Error('Friend ID is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await post(`${BASE_SOCIAL_PATH}/add`, { friendId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Accept a friend request
 * @param {string} friendId - Friend ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Friend data
 */
export const acceptFriendRequest = async (friendId, token) => {
  if (!friendId || typeof friendId !== 'string' || !friendId.trim()) throw new Error('Friend ID is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await post(`${BASE_SOCIAL_PATH}/accept`, { friendId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reject a friend request
 * @param {string} friendId - Friend ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Friend data
 */
export const rejectFriendRequest = async (friendId, token) => {
  if (!friendId || typeof friendId !== 'string' || !friendId.trim()) throw new Error('Friend ID is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await post(`${BASE_SOCIAL_PATH}/reject`, { friendId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove a friend
 * @param {string} friendId - Friend ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Friend data
 */
export const removeFriend = async (friendId, token) => {
  if (!friendId || typeof friendId !== 'string' || !friendId.trim()) throw new Error('Friend ID is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const response = await post(`${BASE_SOCIAL_PATH}/remove`, { friendId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || {};
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch friends list
 * @param {string} token - Authorization token
 * @param {object} [options={page: 1, limit: 20}] - Query options
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Friends data
 */
export const fetchFriends = async (token, options = { page: 1, limit: 20 }, signal) => {
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const { page, limit } = options;
    const response = await get(BASE_SOCIAL_PATH, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { friends: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch pending friend requests
 * @param {string} token - Authorization token
 * @param {object} [options={page: 1, limit: 20}] - Query options
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Pending requests data
 */
export const fetchPendingRequests = async (token, options = { page: 1, limit: 20 }, signal) => {
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const { page, limit } = options;
    const response = await get(`${BASE_SOCIAL_PATH}/pending`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { pendingRequests: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch users by username
 * @param {string} username - Username to search
 * @param {string} token - Authorization token
 * @param {object} [options={page: 1, limit: 10}] - Query options
 * @returns {Promise<object>} Users data
 */
export const fetchUsersByUsername = async (username, token, options = { page: 1, limit: 10 }) => {
  if (!username || typeof username !== 'string' || !username.trim()) throw new Error('Username is required');
  if (!token || typeof token !== 'string' || !token.trim()) throw new Error('Token is required');
  try {
    const { page, limit } = options;
    const response = await get('/api/v1/social/users/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { username, page, limit },
    });
    return response.data.content || { users: [], pagination: {} };
  } catch (error) {
    throw handleApiError(error);
  }
};