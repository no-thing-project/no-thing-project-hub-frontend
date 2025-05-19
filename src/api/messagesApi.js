import api from './apiClient';
import { handleApiError } from './apiClient';
import {
  sendMessageBodySchema,
  getMessagesQuerySchema,
  messageIdParamSchema,
  editMessageSchema,
  searchMessagesSchema,
  createPollSchema,
  votePollSchema,
  addReactionSchema,
  generatePresignedUrlSchema,
  conversationIdParamSchema,
} from '../constants/validations';
import { validatePayload } from '../constants/validations';
import Joi from 'joi';

/**
 * Generic API request handler.
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} endpoint - API endpoint
 * @param {string} token - Authorization token
 * @param {Object} [options] - Request options (payload, params, signal)
 * @returns {Promise<Object>} - API response data
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

// Generate presigned URL for file upload
export const generatePresignedUrl = (fileType, contentType, token) => {
  validatePayload(generatePresignedUrlSchema, { fileType, contentType }, 'Invalid presigned URL data');
  return apiRequest('post', '/api/v1/messages/presigned-url', token, { payload: { fileType, contentType } });
};

// Send a new message
export const sendMessage = (
  conversationId,
  content,
  media = [],
  replyTo,
  scheduledAt,
  forwardedFrom,
  threadId,
  token
) => {
  const payload = {
    conversationId,
    content: content || '',
    media,
    replyTo,
    forwardedFrom,
    threadId,
  };
  if (scheduledAt) payload.scheduledAt = scheduledAt;
  validatePayload(sendMessageBodySchema, payload, 'Invalid message data');
  return apiRequest('post', '/api/v1/messages', token, { payload });
};

// Fetch messages for a conversation
export const fetchMessages = (conversationId, options = {}, token, signal) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(getMessagesQuerySchema, options, 'Invalid query options');
  return apiRequest('get', `/api/v1/messages/${conversationId}`, token, { params: options, signal });
};

// Send typing indicator
export const sendTyping = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/messages/${conversationId}/typing`, token, {});
};

// Fetch read receipts for a message
export const getReadReceipts = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('get', `/api/v1/messages/${messageId}/read-receipts`, token, {});
};

// Create a poll
export const createPoll = ({ conversationId, question, options }, token) => {
  validatePayload(createPollSchema, { conversationId, question, options }, 'Invalid poll data');
  return apiRequest('post', '/api/v1/messages/poll', token, { payload: { conversationId, question, options } });
};

// Vote in a poll
export const votePoll = (messageId, optionIndex, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  validatePayload(votePollSchema, { optionIndex }, 'Invalid poll vote data');
  return apiRequest('post', `/api/v1/messages/${messageId}/poll/vote`, token, { payload: { optionIndex } });
};

// Add a reaction to a message
export const addReaction = (messageId, reaction, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  validatePayload(addReactionSchema, { reaction }, 'Invalid reaction data');
  return apiRequest('post', `/api/v1/messages/${messageId}/reaction`, token, { payload: { reaction } });
};

// Mark a message as read
export const markMessageAsRead = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('post', `/api/v1/messages/${messageId}/read`, token, {});
};

// Delete a message
export const deleteMessage = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('delete', `/api/v1/messages/${messageId}`, token, {});
};

// Edit a message
export const editMessage = ({ messageId, newContent }, token) => {
  validatePayload(editMessageSchema, { messageId, newContent }, 'Invalid edit message data');
  return apiRequest('put', `/api/v1/messages/${messageId}`, token, { payload: { messageId, newContent } });
};

// Search messages in a conversation
export const searchMessages = (conversationId, query, options = {}, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(searchMessagesSchema, { query, ...options }, 'Invalid search query');
  return apiRequest('get', `/api/v1/messages/${conversationId}/search`, token, { params: { query, ...options } });
};

// Pin a message
export const pinMessage = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('post', `/api/v1/messages/${messageId}/pin`, token, {});
};

// Unpin a message
export const unpinMessage = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('post', `/api/v1/messages/${messageId}/unpin`, token, {});
};

// List scheduled messages
export const listScheduledMessages = (conversationId, options = {}, token, signal) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(getMessagesQuerySchema, options, 'Invalid query options');
  return apiRequest('get', `/api/v1/messages/${conversationId}/scheduled`, token, { params: options, signal });
};

// Cancel a scheduled message
export const cancelScheduledMessage = (messageId, token) => {
  validatePayload(messageIdParamSchema, { messageId }, 'Invalid messageId');
  return apiRequest('delete', `/api/v1/messages/${messageId}/scheduled`, token, {});
};