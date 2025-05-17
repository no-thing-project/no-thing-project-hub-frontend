import api from './apiClient';
import { handleApiError } from './apiClient';
import { uuidSchema, contentSchema, positionSchema, reminderSchema, validatePayload, querySchema, commentQuerySchema } from '../constants/validations';
import Joi from 'joi';

/**
 * Generic API request handler.
 * @param {string} method
 * @param {string} endpoint
 * @param {string} token
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
const apiRequest = async (method, endpoint, token, { payload, params, signal } = {}) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
      params,
      signal,
    };
    const response = await api[method](endpoint, payload, config);
    return response.data.content || response.data;
  } catch (err) {
    throw handleApiError(err, {});
  }
};

// Fetch all tweets for a board
export const fetchTweetsApi = (boardId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(querySchema, options, 'Invalid query options');
  return apiRequest('get', `/api/v1/tweets/${boardId}`, token, { params: options, signal });
};

// Fetch a single tweet by ID
export const fetchTweetById = (boardId, tweetId, token, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('get', `/api/v1/tweets/${boardId}/${tweetId}`, token, { signal });
};

// Fetch comments for a tweet
export const getTweetCommentsApi = (boardId, tweetId, token, options = {}, signal) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(commentQuerySchema, options, 'Invalid comment query options');
  return apiRequest('get', `/api/v1/tweets/${boardId}/${tweetId}/comments`, token, { params: options, signal });
};

// Generate presigned URL for file upload
export const generatePresignedUrlApi = (fileType, contentType, token) => {
  validatePayload(Joi.string().required(), fileType, 'Invalid fileType');
  validatePayload(Joi.string().required(), contentType, 'Invalid contentType');
  return apiRequest('post', `/api/v1/tweets/presigned-url`, token, { payload: { fileType, contentType } });
};

// Create a new tweet
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

  return apiRequest('post', `/api/v1/tweets/${boardId}`, token, { payload }).then(response => {
    const tweet = response.tweets?.[0];
    if (!tweet || !tweet.tweet_id) throw new Error('Invalid tweet response from server');
    return tweet;
  });
};

// Update an existing tweet
export const updateTweetApi = (boardId, tweetId, updates, token) => {
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

  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}`, token, { payload: updates }).then(
    response => response.tweets?.[0]
  );
};

// Update tweet status
export const updateTweetStatusApi = (boardId, tweetId, status, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(
    Joi.string().valid('pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived').required(),
    status,
    'Invalid status'
  );

  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}/status`, token, { payload: { status } }).then(
    response => response.tweets?.[0]
  );
};

// Toggle like/dislike for a tweet
export const toggleLikeApi = (tweetId, isLiked, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  const endpoint = isLiked ? 'dislike' : 'like';
  return apiRequest('post', `/api/v1/tweets/${tweetId}/${endpoint}`, token, {}).then(response => response.tweets?.[0]);
};

// Delete a tweet
export const deleteTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('delete', `/api/v1/tweets/${boardId}/${tweetId}`, token, {}).then(response => response);
};

// Move a tweet to another board
export const moveTweetApi = (tweetId, targetBoardId, token) => {
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(uuidSchema, targetBoardId, 'Invalid targetBoardId');
  return apiRequest('post', `/api/v1/tweets/${tweetId}/move`, token, { payload: { targetBoardId } }).then(
    response => response.tweets?.[0]
  );
};

// Pin a tweet
export const pinTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/pin`, token, {}).then(response => response.tweets?.[0]);
};

// Unpin a tweet
export const unpinTweetApi = (boardId, tweetId, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/unpin`, token, {}).then(response => response.tweets?.[0]);
};

// Set a reminder for a tweet
export const setReminderApi = (boardId, tweetId, reminder, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(reminderSchema, reminder, 'Invalid reminder');
  return apiRequest('put', `/api/v1/tweets/${boardId}/${tweetId}/reminder`, token, { payload: reminder }).then(
    response => response.tweets?.[0]
  );
};

// Share a tweet
export const shareTweetApi = (boardId, tweetId, sharedTo, token) => {
  validatePayload(uuidSchema, boardId, 'Invalid boardId');
  validatePayload(uuidSchema, tweetId, 'Invalid tweetId');
  validatePayload(Joi.string().required(), sharedTo, 'Invalid sharedTo');
  return apiRequest('post', `/api/v1/tweets/${boardId}/${tweetId}/share`, token, { payload: { shared_to: sharedTo } }).then(
    response => response.tweets?.[0]
  );
};