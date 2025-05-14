import api from './apiClient';
import { handleApiError } from './apiClient';
import { uuidSchema, contentSchema, positionSchema, reminderSchema, validatePayload } from '../constants/validations';
import Joi from 'joi';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_VERSION = 'v1';
const cache = new Map();

/**
 * Clears expired cache entries.
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, { expiry }] of cache.entries()) {
    if (now > expiry) cache.delete(key);
  }
};

/**
 * Generates a cache key for API requests.
 * @param {string} endpoint
 * @param {Object} params
 * @returns {string}
 */
const getCacheKey = (endpoint, params) => `${CACHE_VERSION}:${endpoint}:${JSON.stringify(params)}`;

/**
 * Invalidates cache entries by prefix.
 * @param {string} prefix
 */
const invalidateCacheByPrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${CACHE_VERSION}:${prefix}`)) cache.delete(key);
  }
};

/**
 * Generic API request handler with caching.
 * @param {string} method
 * @param {string} endpoint
 * @param {string} token
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
const apiRequest = async (method, endpoint, token, { payload, params, signal, useCache = false, invalidatePrefixes = [] } = {}) => {
  const cacheKey = useCache ? getCacheKey(endpoint, params || {}) : null;
  clearExpiredCache();

  if (useCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached.expiry > Date.now()) return cached.data;
  }

  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
      params,
      signal,
    };
    const response = await api[method](endpoint, payload, config);
    const data = response.data.content || response.data;

    if (useCache) {
      cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    }
    invalidatePrefixes.forEach(prefix => invalidateCacheByPrefix(prefix));
    return data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Fetches all tweets for a board.
 * @param {string} boardId - UUID of the board
 * @param {string} token - Authorization token
 * @param {Object} [options] - Query parameters (status, page, limit, sort, pinned_only, hashtag, mention)
 * @param {AbortSignal} [signal] - Abort signal for request cancellation
 * @returns {Promise<Object>} - Tweets, board info, and pagination
 */
export const fetchTweetsApi = (boardId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  return apiRequest('get', `/api/v1/tweets/${boardId}`, token, {
    params: options,
    signal,
    useCache: true,
  });
};

/**
 * Fetches a single tweet by ID.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal for request cancellation
 * @returns {Promise<Object>} - Tweet details
 */
export const fetchTweetById = (boardId, tweetId, token, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('get', `/api/v1/tweets/${boardId}/${tweetId}`, token, { signal, useCache: true });
};

/**
 * Creates a new tweet via API.
 * @param {string} boardId - UUID of the board
 * @param {Object} content - Tweet content object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string|null} parentTweetId - UUID of parent tweet, if any
 * @param {boolean} isAnonymous - Whether the tweet is anonymous
 * @param {string} anonymousId - UUID of the user creating the tweet
 * @param {string} status - Tweet status (e.g., 'approved')
 * @param {string|null} scheduledAt - ISO date for scheduled tweet
 * @param {Object|null} reminder - Reminder object, if any
 * @param {Array} files - Array of uploaded file objects
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Created tweet object
 */
export const createTweetApi = (
  boardId,
  content,
  x,
  y,
  parentTweetId,
  isAnonymous,
  anonymousId,
  status,
  scheduledAt,
  reminder,
  files,
  token
) => {
  // Validate inputs
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(contentSchema, content, 'Invalid content');
  validatePayload(positionSchema, { x, y }, 'Invalid position');
  validatePayload(uuidSchema, anonymousId, 'Invalid anonymousId');
  if (parentTweetId) validatePayload(uuidSchema, parentTweetId, 'Invalid parentTweetId');
  if (reminder) validatePayload(reminderSchema, reminder, 'Invalid reminder');
  if (files.length) validatePayload(Joi.array().items().max(10), files, 'Invalid files');

  // Construct payload
  const payload = {
    content: {
      ...content,
      metadata: {
        ...content.metadata,
        files: files || [], // Ensure files are included
      },
    },
    position: { x, y },
    is_anonymous: isAnonymous,
    anonymous_id: anonymousId,
    status,
    scheduled_at: scheduledAt || null,
  };
  if (parentTweetId) payload.parent_tweet_id = parentTweetId;
  if (reminder) payload.reminder = reminder;

  return apiRequest('post', `/api/v1/tweets/${boardId}`, token, {
    payload,
    invalidatePrefixes: [`tweets:${boardId}`],
  }).then(response => response.data.content); // Extract tweet from backend response
};

/**
 * Updates an existing tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {Object} updates - Fields to update (content, position, status, scheduled_at, reminder)
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const updateTweetApi = (boardId, tweetId, updates, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(
    Joi.object({
      content: contentSchema.optional(),
      position: positionSchema.optional(),
      status: Joi.string().valid('pending', 'approved').optional(),
      scheduled_at: Joi.date().iso().min('now').allow(null).optional(),
      reminder: reminderSchema.optional(),
    }).min(1),
    updates,
    'Invalid updates'
  );

  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}`, token, {
    payload: updates,
    invalidatePrefixes: [`tweets:${boardId}`, `tweet:${boardId}:${tweetId}`, `comments:${boardId}:${tweetId}`],
  });
};

/**
 * Toggles like/dislike for a tweet.
 * @param {string} tweetId - UUID of the tweet
 * @param {boolean} isLiked - Current like state
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const toggleLikeApi = (tweetId, isLiked, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  const endpoint = isLiked ? 'dislike' : 'like';
  return apiRequest('post', `/api/v1/tweets/${tweetId}/${endpoint}`, token, {
    invalidatePrefixes: [`tweet:${tweetId}`],
  });
};

/**
 * Deletes a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('delete', `/api/v1/tweets/${boardId}/${tweetId}`, token, {
    invalidatePrefixes: [`tweets:${boardId}`, `tweet:${boardId}:${tweetId}`, `comments:${boardId}:${tweetId}`],
  });
};

/**
 * Fetches comments for a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} token - Authorization token
 * @param {Object} [options] - Query parameters (page, limit, sort)
 * @param {AbortSignal} [signal] - Abort signal for request cancellation
 * @returns {Promise<Object>} - Comments and pagination
 */
export const getTweetCommentsApi = (boardId, tweetId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('get', `/api/v1/tweets/${boardId}/${tweetId}/comments`, token, {
    params: options,
    signal,
    useCache: true,
  });
};

/**
 * Updates the status of a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} status - New status (pending/approved)
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const updateTweetStatusApi = (boardId, tweetId, status, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(
    Joi.string().valid('pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived').required(),
    status,
    'Invalid status'
  );

  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}/status`, token, {
    payload: { status },
    invalidatePrefixes: [`tweets:${boardId}`, `tweet:${boardId}:${tweetId}`],
  });
};

/**
 * Moves a tweet to another board.
 * @param {string} tweetId - UUID of the tweet
 * @param {string} targetBoardId - UUID of the target board
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const moveTweetApi = (tweetId, targetBoardId, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(uuidSchema, targetBoardId, 'Invalid targetBoardId');

  return apiRequest('post', `/api/v1/tweets/${tweetId}/move`, token, {
    payload: { targetBoardId },
    invalidatePrefixes: ['tweets:', 'tweet:'],
  });
};

/**
 * Pins a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const pinTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');

  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/pin`, token, {
    invalidatePrefixes: [`tweets:${boardId}`, `tweet:${boardId}:${tweetId}`],
  });
};

/**
 * Unpins a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const unpinTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');

  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/unpin`, token, {
    invalidatePrefixes: [`tweets:${boardId}`, `tweet:${boardId}:${tweetId}`],
  });
};

/**
 * Sets a reminder for a tweet.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {Object} reminder - Reminder settings (schedule, recurrence)
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const setReminderApi = (boardId, tweetId, reminder, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(reminderSchema, reminder, 'Invalid reminder');

  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}/reminder`, token, {
    payload: reminder,
    invalidatePrefixes: [`tweet:${boardId}:${tweetId}`],
  });
};

/**
 * Shares a tweet to a destination.
 * @param {string} boardId - UUID of the board
 * @param {string} tweetId - UUID of the tweet
 * @param {string} sharedTo - Destination (e.g., user ID or platform)
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - Updated tweet
 */
export const shareTweetApi = (boardId, tweetId, sharedTo, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(Joi.string().required(), sharedTo, 'Invalid sharedTo');

  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/share`, token, {
    payload: { shared_to: sharedTo },
    invalidatePrefixes: [`tweet:${boardId}:${tweetId}`],
  });
};