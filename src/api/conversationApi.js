import api from './apiClient';
import { handleApiError } from './apiClient';
import Joi from 'joi';
import {
  createConversationSchema,
  updateConversationSchema,
  addMembersSchema,
  removeMembersSchema,
  updateChatSettingsSchema,
  joinViaInviteSchema,
  updateEphemeralSettingsSchema,
  muteConversationSchema,
  conversationIdParamSchema,
  getConversationsQuerySchema,
  validatePayload
} from '../constants/validations';

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

// Fetch all conversations
export const fetchConversationsApi = (token, options = {}, signal) => {
  validatePayload(getConversationsQuerySchema, options, 'Invalid query options');
  return apiRequest('get', '/api/v1/conversations', token, { params: options, signal });
};

// Fetch a single conversation by ID
export const fetchConversationApi = (conversationId, token, signal) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('get', `/api/v1/conversations/${conversationId}`, token, { signal });
};

// Create a new conversation
export const createConversationApi = (data, token) => {
  validatePayload(createConversationSchema, data, 'Invalid conversation data');
  return apiRequest('post', '/api/v1/conversations', token, { payload: data }).then(
    response => response || {}
  );
};

// Update an existing conversation
export const updateConversationApi = (conversationId, data, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(updateConversationSchema, data, 'Invalid update data');
  return apiRequest('put', `/api/v1/conversations/${conversationId}`, token, { payload: data }).then(
    response => response || {}
  );
};

// Update chat settings
export const updateChatSettingsApi = (conversationId, data, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(updateChatSettingsSchema, data, 'Invalid chat settings data');
  return apiRequest('put', `/api/v1/conversations/${conversationId}/settings`, token, { payload: data }).then(
    response => response || {}
  );
};

// Update ephemeral settings
export const updateEphemeralSettingsApi = (conversationId, data, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(updateEphemeralSettingsSchema, data, 'Invalid ephemeral settings data');
  return apiRequest('put', `/api/v1/conversations/${conversationId}/ephemeral`, token, { payload: data }).then(
    response => response || {}
  );
};

// Add members to a conversation
export const addMembersApi = (conversationId, members, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(addMembersSchema, { members }, 'Invalid members data');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/members`, token, { payload: { members } }).then(
    response => response || {}
  );
};

// Remove members from a conversation
export const removeMembersApi = (conversationId, members, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(removeMembersSchema, { members }, 'Invalid members data');
  return apiRequest('delete', `/api/v1/conversations/${conversationId}/members`, token, { payload: { members } }).then(
    response => response || {}
  );
};

// Join a conversation via invite link
export const joinViaInviteApi = (inviteLink, token) => {
  validatePayload(joinViaInviteSchema, { inviteLink }, 'Invalid invite link');
  return apiRequest('post', '/api/v1/conversations/join', token, { payload: { inviteLink } }).then(
    response => response || {}
  );
};

// Leave a conversation
export const leaveConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/leave`, token, {}).then(
    response => response || {}
  );
};

// Rotate session keys
export const rotateKeysApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/rotate-keys`, token, {}).then(
    response => response || {}
  );
};

// Delete a conversation
export const deleteConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('delete', `/api/v1/conversations/${conversationId}`, token, {}).then(
    response => response || {}
  );
};

// Archive a conversation
export const archiveConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/archive`, token, {}).then(
    response => response || {}
  );
};

// Unarchive a conversation
export const unarchiveConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/unarchive`, token, {}).then(
    response => response || {}
  );
};

// Mute a conversation
export const muteConversationApi = (conversationId, data, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  validatePayload(muteConversationSchema, data, 'Invalid mute data');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/mute`, token, { payload: data }).then(
    response => response || {}
  );
};

// Unmute a conversation
export const unmuteConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/unmute`, token, {}).then(
    response => response || {}
  );
};

// Pin a conversation
export const pinConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/pin`, token, {}).then(
    response => response || {}
  );
};

// Unpin a conversation
export const unpinConversationApi = (conversationId, token) => {
  validatePayload(conversationIdParamSchema, { conversationId }, 'Invalid conversationId');
  return apiRequest('post', `/api/v1/conversations/${conversationId}/unpin`, token, {}).then(
    response => response || {}
  );
};