import { get, post, put, del, handleApiError } from './apiClient';
import { uuidSchema, contentSchema, positionSchema, reminderSchema, validatePayload, querySchema, commentQuerySchema } from '../constants/validations';
import Joi from 'joi';

const BASE_TWEET_PATH = '/api/v1/tweets';

/**
 * Fetch all tweets for a board
 * @param {string} boardId - Board ID
 * @param {string} token - Authorization token
 * @param {object} [options={}] - Query options
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Tweets data
 */
export const fetchTweetsApi = async (boardId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(querySchema, options, 'Invalid query options');
  try {
    const response = await get(`${BASE_TWEET_PATH}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: options,
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { tweets: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch a single tweet by ID
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} token - Authorization token
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Tweet data
 */
export const fetchTweetById = async (boardId, tweetId, token, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  try {
    const response = await get(`${BASE_TWEET_PATH}/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Fetch comments for a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} token - Authorization token
 * @param {object} [options={}] - Query options
 * @param {AbortSignal} [signal] - Abort signal
 * @returns {Promise<object>} Comments data
 */
export const getTweetCommentsApi = async (boardId, tweetId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(commentQuerySchema, options, 'Invalid comment query options');
  try {
    const response = await get(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: options,
      signal: signal instanceof AbortSignal ? signal : undefined,
    });
    return response.data.content || { comments: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Generate presigned URL for file upload
 * @param {string} fileType - File type
 * @param {string} contentType - Content type
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Presigned URL data
 */
export const generatePresignedUrlApi = async (fileType, contentType, token) => {
  validatePayload(Joi.string().required(), fileType, 'Invalid fileType');
  validatePayload(Joi.string().required(), contentType, 'Invalid contentType');
  try {
    const response = await post(`${BASE_TWEET_PATH}/presigned-url`, { fileType, contentType }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new tweet
 * @param {string} boardId - Board ID
 * @param {object} content - Tweet content
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} [parentTweetId] - Parent tweet ID
 * @param {boolean} isAnonymous - Is anonymous
 * @param {string} anonymousId - Anonymous ID
 * @param {string} status - Tweet status
 * @param {string} [scheduledAt] - Scheduled date
 * @param {object} [reminder] - Reminder data
 * @param {array} [files] - Files array
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Created tweet data
 */
export const createTweetApi = async (
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
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(contentSchema, content, 'Invalid content');
  validatePayload(positionSchema, { x, y }, 'Invalid position');
  validatePayload(uuidSchema, anonymousId, 'Invalid anonymousId');
  if (parentTweetId) validatePayload(uuidSchema, parentTweetId, 'Invalid parentTweetId');
  if (reminder) validatePayload(reminderSchema, reminder, 'Invalid reminder');
  if (files?.length) {
    validatePayload(
      Joi.array().items(
        Joi.object({
          url: Joi.string().uri().optional(),
          fileKey: Joi.string().required(),
          contentType: Joi.string().required(),
          size: Joi.number().max(50 * 1024 * 1024).required(),
        })
      ).max(10),
      files,
      'Invalid files'
    );
  }
  try {
    const payload = {
      content: {
        ...content,
        metadata: {
          ...content.metadata,
          files: files || [],
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

    const response = await post(`${BASE_TWEET_PATH}/${boardId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tweet = response.data.content?.tweets?.[0];
    if (!tweet || !tweet.tweet_id) throw new Error('Invalid tweet response from server');
    return tweet;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update an existing tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {object} updates - Tweet updates
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated tweet data
 */
export const updateTweetApi = async (boardId, tweetId, updates, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(
    Joi.object({
      content: contentSchema.optional(),
      position: positionSchema.optional(),
      status: Joi.string().valid('pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived').optional(),
      scheduled_at: Joi.date().iso().allow(null).optional(),
      reminder: reminderSchema.optional(),
    }).min(1),
    updates,
    'Invalid updates'
  );
  try {
    const response = await put(`${BASE_TWEET_PATH}/${boardId}/${tweetId}`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update tweet status
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} status - New status
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated tweet data
 */
export const updateTweetStatusApi = async (boardId, tweetId, status, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(
    Joi.string().valid('pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived').required(),
    status,
    'Invalid status'
  );
  try {
    const response = await put(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Toggle like/dislike for a tweet
 * @param {string} tweetId - Tweet ID
 * @param {boolean} isLiked - Current like state
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated tweet data
 */
export const toggleLikeApi = async (tweetId, isLiked, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  try {
    const endpoint = isLiked ? 'dislike' : 'like';
    const response = await post(`${BASE_TWEET_PATH}/${tweetId}/${endpoint}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Deleted tweet data
 */
export const deleteTweetApi = async (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  try {
    const response = await del(`${BASE_TWEET_PATH}/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Move a tweet to another board
 * @param {string} tweetId - Tweet ID
 * @param {string} targetBoardId - Target board ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Moved tweet data
 */
export const moveTweetApi = async (tweetId, targetBoardId, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(uuidSchema, targetBoardId, 'Invalid targetBoardId');
  try {
    const response = await post(`${BASE_TWEET_PATH}/${tweetId}/move`, { targetBoardId }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Pin a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Pinned tweet data
 */
export const pinTweetApi = async (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  try {
    const response = await post(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/pin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Unpin a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Unpinned tweet data
 */
export const unpinTweetApi = async (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  try {
    const response = await post(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/unpin`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Set a reminder for a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {object} reminder - Reminder data
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Updated tweet data
 */
export const setReminderApi = async (boardId, tweetId, reminder, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(reminderSchema, reminder, 'Invalid reminder');
  try {
    const response = await put(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/reminder`, reminder, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Share a tweet
 * @param {string} boardId - Board ID
 * @param {string} tweetId - Tweet ID
 * @param {string} sharedTo - Share destination
 * @param {string} token - Authorization token
 * @returns {Promise<object>} Shared tweet data
 */
export const shareTweetApi = async (boardId, tweetId, sharedTo, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(Joi.string().required(), sharedTo, 'Invalid sharedTo');
  try {
    const response = await post(`${BASE_TWEET_PATH}/${boardId}/${tweetId}/share`, { shared_to: sharedTo }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content?.tweets?.[0] || null;
  } catch (error) {
    throw handleApiError(error);
  }
};