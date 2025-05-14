import Joi from 'joi';

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'application/pdf', 'image/svg+xml', 'audio/webm'
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 10;

export const uuidSchema = Joi.string().uuid({ version: ['uuidv4'] }).required().messages({
    'string.uuid': '{#label} must be a valid UUID v4',
    'any.required': '{#label} is required',
  });
  
export const querySchema = Joi.object({
    status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived')
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .valid('created_at:asc', 'created_at:desc', 'like_count:desc', 'comment_count:desc')
      .default('created_at:desc'),
    pinned_only: Joi.boolean().default(false),
    hashtag: Joi.string().pattern(/^#[a-zA-Z0-9_]{1,50}$/).optional(),
    mention: Joi.string().pattern(/^@[a-zA-Z0-9_]{1,50}$/).optional(),
  }).label('QuerySchema');
  
export const commentQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .valid('created_at:asc', 'created_at:desc', 'like_count:desc')
      .default('created_at:desc'),
  }).label('CommentQuerySchema');
  
export  const contentSchema = Joi.object({
    type: Joi.string()
      .valid(
        'text', 'image', 'video', 'audio', 'file', 'drawing', 'poll',
        'event', 'link', 'quote', 'embed', 'voice', 'video_message'
      )
      .default('text')
      .messages({
        'any.only': 'Invalid content type',
      }),
    value: Joi.string()
      .max(1000)
      .when('type', {
        is: 'text',
        then: Joi.string().trim().min(1).required().messages({
          'string.min': 'Text content must be at least 1 character',
          'any.required': 'Text content is required for type "text"',
        }),
        otherwise: Joi.string().allow('').optional(),
      }),
    metadata: Joi.object({
      files: Joi.array().items().max(10).default([]).optional(),
      hashtags: Joi.array().items(Joi.string().pattern(/^#[a-zA-Z0-9_]{1,50}$/)).max(10).default([]).optional(),
      mentions: Joi.array().items(Joi.string().pattern(/^@[a-zA-Z0-9_]{1,50}$/)).max(10).default([]).optional(),
    }).default({}),
  }).label('Content');
  
export  const positionSchema = Joi.object({
    x: Joi.number().min(0).required().messages({
      'number.min': 'X coordinate must be non-negative',
      'any.required': 'X coordinate is required',
    }),
    y: Joi.number().min(0).required().messages({
      'number.min': 'Y coordinate must be non-negative',
      'any.required': 'Y coordinate is required',
    }),
  }).label('Position');
  
export const reminderSchema = Joi.object({
    schedule: Joi.date().iso().min('now').required().messages({
      'date.min': 'Reminder schedule must be in the future',
      'any.required': 'Reminder schedule is required',
    }),
    recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly').default('none').messages({
      'any.only': 'Recurrence must be one of: none, daily, weekly, monthly',
    }),
    enabled: Joi.boolean().default(true),
  }).label('Reminder');
  

/**
 * Validates a payload against a schema and throws an error if invalid.
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {any} payload - Data to validate
 * @param {string} [errorMessage] - Custom error message prefix
 * @throws {Error} - Throws error with validation details
 */
export const validatePayload = (schema, payload, errorMessage = 'Validation error') => {
  const { error } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(d => d.message).join('; ');
    throw new Error(`${errorMessage}: ${details}`);
  }
};