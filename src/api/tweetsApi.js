/**
 * @module tweetsApi
 * @description API client for tweet-related operations with caching and enhanced error handling.
 */
import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
const getCacheKey = (endpoint, params) =>
  `${endpoint}:${JSON.stringify(params)}`;

/**
 * Fetches all tweets for a board with caching.
 * @param {string} boardId - UUID of the board.
 * @param {string} token - Authentication token.
 * @param {Object} [options] - Query options.
 * @param {string} [options.status="approved"] - Tweet status filter.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.sort="created_at:desc"] - Sort order.
 * @param {boolean} [options.pinned_only=false] - Filter pinned tweets.
 * @param {string} [options.hashtag] - Hashtag filter.
 * @param {string} [options.mention] - Mention filter.
 * @param {AbortSignal} [signal] - Abort signal for request cancellation.
 * @returns {Promise<{ tweets: Array, board: Object, pagination: Object }>}
 */
export const fetchTweetsApi = async (
  boardId,
  token,
  options = {
    status: "approved",
    page: 1,
    limit: 20,
    sort: "created_at:desc",
    pinned_only: false,
  },
  signal
) => {
  if (!boardId) throw new Error("Board ID is required");
  const cacheKey = getCacheKey(`tweets:${boardId}`, options);
  clearExpiredCache();

  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const { status, page, limit, sort, pinned_only, hashtag, mention } = options;
    const response = await api.get(`/api/v1/tweets/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status, page, limit, sort, pinned_only, hashtag, mention },
      signal,
    });
    const data = response.data.content || { tweets: [], board: null, pagination: {} };
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    return handleApiError(err, { tweets: [], board: null, pagination: {} });
  }
};

/**
 * Fetches a single tweet by ID with caching.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} token - Authentication token.
 * @param {AbortSignal} [signal] - Abort signal for request cancellation.
 * @returns {Promise<Object>}
 */
export const fetchTweetById = async (boardId, tweetId, token, signal) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  const cacheKey = getCacheKey(`tweet:${boardId}:${tweetId}`, {});
  clearExpiredCache();

  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const response = await api.get(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const data = response.data.content || response.data;
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Creates a tweet with optional file uploads.
 * @param {string} boardId - UUID of the board.
 * @param {Object|string} content - Tweet content (string or object with type, value, metadata).
 * @param {number} x - X position.
 * @param {number} y - Y position.
 * @param {string|null} [parentTweetId=null] - Parent tweet UUID.
 * @param {boolean} [isAnonymous=false] - Whether the tweet is anonymous.
 * @param {string} [status="approved"] - Tweet status.
 * @param {string|null} [scheduledAt=null] - Scheduled publish time (ISO string).
 * @param {Object} [access] - Access control settings.
 * @param {Array<File>} [files=[]] - Files to upload.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const createTweetApi = async (
  boardId,
  content,
  x,
  y,
  parentTweetId = null,
  isAnonymous = false,
  status = "approved",
  scheduledAt = null,
  access,
  files = [],
  token
) => {
  if (!boardId) throw new Error("Board ID is required");
  if (!content || (typeof content === "string" && content.trim() === "")) {
    throw new Error("Content is required");
  }
  if (typeof x !== "number" || isNaN(x) || typeof y !== "number" || isNaN(y)) {
    throw new Error("Valid position (x, y) is required");
  }
  try {
    const payload = {
      content: typeof content === "string" ? { type: "text", value: content } : content,
      position: { x, y },
      parent_tweet_id: parentTweetId || null,
      is_anonymous: isAnonymous,
      status,
      scheduled_at: scheduledAt || null,
      access,
      hashtags: content?.metadata?.hashtags || [],
      mentions: content?.metadata?.mentions || [],
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await api.post(`/api/v1/tweets/${boardId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": files.length ? "multipart/form-data" : "application/json",
      },
    });
    cache.clear(); // Invalidate cache on create
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Updates a tweet with optional file uploads.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {Object} updates - Fields to update.
 * @param {Object|string} [updates.content] - Updated content.
 * @param {Object} [updates.position] - Updated position.
 * @param {string} [updates.status] - Updated status.
 * @param {string|null} [updates.scheduled_at] - Updated schedule time.
 * @param {Object} [updates.access] - Updated access settings.
 * @param {Array<string>} [updates.hashtags] - Updated hashtags.
 * @param {Array<string>} [updates.mentions] - Updated mentions.
 * @param {Object} [updates.reminder] - Updated reminder settings.
 * @param {Array<File>} [files=[]] - Files to upload.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const updateTweetApi = async (boardId, tweetId, updates, files = [], token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const { content, position, status, scheduled_at, access, hashtags, mentions, reminder } = updates;
    const payload = {};
    if (content) payload.content = content === "string" ? { type: "text", value: content } : content;
    if (position) payload.position = position;
    if (status) payload.status = status;
    if (scheduled_at !== undefined) payload.scheduled_at = scheduled_at;
    if (access) payload.access = access;
    if (hashtags) payload.hashtags = hashtags;
    if (mentions) payload.mentions = mentions;
    if (reminder) payload.reminder = reminder;

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await api.put(`/api/v1/tweets/${boardId}/${tweetId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": files.length ? "multipart/form-data" : "application/json",
      },
    });
    cache.clear(); // Invalidate cache on update
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Toggles like status for a tweet.
 * @param {string} tweetId - UUID of the tweet.
 * @param {boolean} isLiked - Current like status.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const toggleLikeApi = async (tweetId, isLiked, token) => {
  if (!tweetId) throw new Error("Tweet ID is required");
  try {
    const endpoint = isLiked ? "dislike" : "like";
    const response = await api.post(`/api/v1/tweets/${tweetId}/${endpoint}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on like/dislike
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Deletes a tweet.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const deleteTweetApi = async (boardId, tweetId, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const response = await api.delete(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on delete
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Fetches comments for a tweet with caching.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} token - Authentication token.
 * @param {Object} [options] - Query options.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=20] - Items per page.
 * @param {string} [options.sort="created_at:desc"] - Sort order.
 * @param {AbortSignal} [signal] - Abort signal for request cancellation.
 * @returns {Promise<{ comments: Array, pagination: Object }>}
 */
export const getTweetCommentsApi = async (
  boardId,
  tweetId,
  token,
  options = { page: 1, limit: 20, sort: "created_at:desc" },
  signal
) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  const cacheKey = getCacheKey(`comments:${boardId}:${tweetId}`, options);
  clearExpiredCache();

  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const { page, limit, sort } = options;
    const response = await api.get(`/api/v1/tweets/${boardId}/${tweetId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit, sort },
      signal,
    });
    const data = response.data.content || { comments: [], pagination: {} };
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } catch (err) {
    return handleApiError(err, { comments: [], pagination: {} });
  }
};

/**
 * Updates tweet status.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} status - New status.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const updateTweetStatusApi = async (boardId, tweetId, status, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const payload = { status };
    const response = await api.put(`/api/v1/tweets/${boardId}/${tweetId}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on status update
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Moves a tweet to another board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} targetBoardId - UUID of the target board.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const moveTweetApi = async (tweetId, targetBoardId, token) => {
  if (!tweetId || !targetBoardId) throw new Error("Tweet ID and Target Board ID are required");
  try {
    const payload = { targetBoardId };
    const response = await api.post(`/api/v1/tweets/${tweetId}/move`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on move
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Pins a tweet.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const pinTweetApi = async (boardId, tweetId, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const response = await api.post(`/api/v1/tweets/${boardId}/${tweetId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on pin
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Unpins a tweet.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const unpinTweetApi = async (boardId, tweetId, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const response = await api.post(`/api/v1/tweets/${boardId}/${tweetId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on unpin
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Sets a reminder for a tweet.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {Object} reminder - Reminder settings.
 * @param {string} reminder.schedule - ISO date string.
 * @param {string} [reminder.recurrence="none"] - Recurrence type.
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const setReminderApi = async (boardId, tweetId, reminder, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const payload = {
      schedule: reminder.schedule,
      recurrence: reminder.recurrence || "none",
    };
    const response = await api.put(`/api/v1/tweets/${boardId}/${tweetId}/reminder`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on reminder set
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};

/**
 * Shares a tweet.
 * @param {string} boardId - UUID of the board.
 * @param {string} tweetId - UUID of the tweet.
 * @param {string} sharedTo - Share destination (e.g., "board:UUID" or "external:platform").
 * @param {string} token - Authentication token.
 * @returns {Promise<Object>}
 */
export const shareTweetApi = async (boardId, tweetId, sharedTo, token) => {
  if (!boardId || !tweetId || !sharedTo) throw new Error("Board ID, Tweet ID, and Shared To are required");
  try {
    const payload = { shared_to: sharedTo };
    const response = await api.post(`/api/v1/tweets/${boardId}/${tweetId}/share`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cache.clear(); // Invalidate cache on share
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err, {});
  }
};