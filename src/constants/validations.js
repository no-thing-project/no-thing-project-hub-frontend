import Joi from 'joi';

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'application/pdf', 'image/svg+xml', 'audio/webm'
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 10;

export const uuidSchema = Joi.string().guid({ version: 'uuidv4' }).required().messages({
  'string.guid': '{{#label}} must be a valid UUID',
  'any.required': '{{#label}} is required',
});

export const positionSchema = Joi.object({
  x: Joi.number().required().messages({
    'number.base': 'X position must be a number',
    'any.required': 'X position is required',
  }),
  y: Joi.number().required().messages({
    'number.base': 'Y position must be a number',
    'any.required': 'Y position is required',
  }),
}).required().messages({
  'object.base': 'Position must be an object',
  'any.required': 'Position is required',
});

export const reminderSchema = Joi.object({
  schedule: Joi.date().iso().min('now').required().messages({
    'date.base': 'Reminder schedule must be a valid ISO date',
    'date.min': 'Reminder schedule must be in the future',
    'any.required': 'Reminder schedule is required',
  }),
  recurrence: Joi.string().valid('none', 'daily', 'weekly', 'monthly').default('none').messages({
    'any.only': 'Recurrence must be one of: none, daily, weekly, monthly',
  }),
  enabled: Joi.boolean().default(true).messages({
    'boolean.base': 'Enabled must be a boolean',
  }),
}).required().messages({
  'object.base': 'Reminder must be an object',
  'any.required': 'Reminder is required',
});

export const fileSchema = Joi.object({
  fileKey: Joi.string().required().messages({
    'string.base': 'File key must be a string',
    'any.required': 'File key is required',
  }),
  url: Joi.string().uri().required().messages({
    'string.base': 'File URL must be a string',
    'string.uri': 'File URL must be a valid URI',
    'any.required': 'File URL is required',
  }),
  contentType: Joi.string().required().messages({
    'string.base': 'Content type must be a string',
    'any.required': 'Content type is required',
  }),
  size: Joi.number().integer().min(0).required().messages({
    'number.base': 'File size must be a number',
    'number.integer': 'File size must be an integer',
    'number.min': 'File size must be non-negative',
    'any.required': 'File size is required',
  }),
}).required().messages({
  'object.base': 'File must be an object',
  'any.required': 'File is required',
});

export const contentSchema = Joi.object({
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'file').required().messages({
    'any.only': 'Content type must be one of: text, image, video, audio, file',
    'any.required': 'Content type is required',
  }),
  value: Joi.string().allow('').optional().messages({
    'string.base': 'Content value must be a string',
  }),
  metadata: Joi.object({
    files: Joi.array().items(fileSchema).optional().default([]).messages({
      'array.base': 'Files must be an array',
    }),
    style: Joi.object().optional().messages({
      'object.base': 'Style must be an object',
    }),
    hashtags: Joi.array().items(Joi.string()).optional().messages({
      'array.base': 'Hashtags must be an array of strings',
    }),
    mentions: Joi.array().items(Joi.string()).optional().messages({
      'array.base': 'Mentions must be an array of strings',
    }),
    poll_options: Joi.array().items(Joi.object()).optional().messages({
      'array.base': 'Poll options must be an array of objects',
    }),
    event_details: Joi.object().optional().messages({
      'object.base': 'Event details must be an object',
    }),
    quote_ref: Joi.string().allow(null).optional().messages({
      'string.base': 'Quote reference must be a string or null',
    }),
    embed_data: Joi.object().allow(null).optional().messages({
      'object.base': 'Embed data must be an object or null',
    }),
  }).required().messages({
    'object.base': 'Metadata must be an object',
    'any.required': 'Metadata is required',
  }),
}).required().messages({
  'object.base': 'Content must be an object',
  'any.required': 'Content is required',
});

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