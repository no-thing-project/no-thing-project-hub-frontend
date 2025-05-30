// src/utils/validations.js
import Joi from 'joi';

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'application/pdf', 'image/svg+xml', 'audio/webm'
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES = 10;

// Common error messages for message schemas
const messageErrorMessages = {
  string: '{{#label}} must be a string',
  required: '{{#label}} is required',
  uuid: '{{#label}} must be a valid UUID v4',
  max: '{{#label}} cannot exceed {{#limit}} characters',
  pattern: '{{#label}} has an invalid format',
  array: '{{#label}} must be an array',
  min: '{{#label}} must have at least {{#limit}} items',
  enum: '{{#label}} must be one of {{#enum}}',
  uri: '{{#label}} must be a valid HTTP/HTTPS URL',
  number: '{{#label}} must be a number',
  integer: '{{#label}} must be an integer',
  boolean: '{{#label}} must be a boolean',
  date: '{{#label}} must be a valid ISO date',
};

// UUID schema for validating IDs
export const uuidSchema = Joi.string().uuid({ version: ['uuidv4'] }).required().messages({
  'string.uuid': messageErrorMessages.uuid.replace('{{#label}}', 'ID'),
  'any.required': messageErrorMessages.required.replace('{{#label}}', 'ID'),
});

// Schema for querying data (e.g., tweets)
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

// Schema for querying comments
export const commentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid('created_at:asc', 'created_at:desc', 'like_count:desc')
    .default('created_at:desc'),
}).label('CommentQuerySchema');

// Schema for content (e.g., tweet content)
export const contentSchema = Joi.object({
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

// Schema for position coordinates
export const positionSchema = Joi.object({
  x: Joi.number().min(0).required().messages({
    'number.min': 'X coordinate must be non-negative',
    'any.required': 'X coordinate is required',
  }),
  y: Joi.number().min(0).required().messages({
    'number.min': 'Y coordinate must be non-negative',
    'any.required': 'Y coordinate is required',
  }),
}).label('Position');

// Schema for reminders
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

// Enhanced conversation validation schemas
const conversationErrorMessages = {
  string: '{{#label}} must be a string',
  required: '{{#label}} is required',
  uuid: '{{#label}} must be a valid UUID v4',
  max: '{{#label}} cannot exceed {{#limit}} characters',
  pattern: '{{#label}} has an invalid format',
  array: '{{#label}} must be an array',
  min: '{{#label}} must have at least {{#limit}} items',
  enum: '{{#label}} must be one of {{#enum}}',
  uri: '{{#label}} must be a valid HTTP/HTTPS URL',
  hexColor: '{{#label}} must be a valid hexadecimal color code (e.g., #FFFFFF)',
  number: '{{#label}} must be a number',
  integer: '{{#label}} must be an integer',
  boolean: '{{#label}} must be a boolean',
  date: '{{#label}} must be a valid ISO date',
};

// UUID pattern for conversation IDs
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema for conversation ID parameter
export const conversationIdParamSchema = Joi.object({
  conversationId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Conversation ID'),
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Conversation ID'),
      'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Conversation ID'),
    }),
}).label('ConversationIdParam');

// Schema for querying conversations
export const getConversationsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': conversationErrorMessages.number.replace('{{#label}}', 'Page'),
      'number.integer': conversationErrorMessages.integer.replace('{{#label}}', 'Page'),
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': conversationErrorMessages.number.replace('{{#label}}', 'Limit'),
      'number.integer': conversationErrorMessages.integer.replace('{{#label}}', 'Limit'),
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  cursor: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': conversationErrorMessages.date.replace('{{#label}}', 'Cursor'),
    }),
  type: Joi.string()
    .valid('direct', 'group', 'channel')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Type'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Type').replace('{{#enum}}', 'direct, group, channel'),
    }),
  visibility: Joi.string()
    .valid('public', 'private', 'hidden')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Visibility'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Visibility').replace('{{#enum}}', 'public, private, hidden'),
    }),
  archived: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Archived'),
    }),
  pinned: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Pinned'),
    }),
  muted: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Muted'),
    }),
  sort: Joi.string()
    .valid('updatedAt:desc', 'updatedAt:asc', 'name:asc', 'name:desc')
    .default('updatedAt:desc')
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Sort'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Sort').replace('{{#enum}}', 'updatedAt:desc, updatedAt:asc, name:asc, name:desc'),
    }),
}).label('GetConversationsQuery');

// Schema for creating a conversation
export const createConversationSchema = Joi.object({
  friendId: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Friend ID'),
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Friend ID'),
    }),
  type: Joi.string()
    .valid('direct', 'group', 'channel')
    .default('direct')
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Type'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Type').replace('{{#enum}}', 'direct, group, channel'),
    }),
  name: Joi.string()
    .trim()
    .max(100)
    .min(3)
    .optional()
    .when('type', {
      is: 'group',
      then: Joi.string().required().messages({
        'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Name'),
      }),
    })
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Name'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Name').replace('{{#limit}}', '100'),
      'string.min': 'Name must be at least 3 characters',
    }),
  members: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Each member ID'),
    }))
    .optional()
    .when('type', {
      is: 'group',
      then: Joi.array().min(1).max(1000).required().messages({
        'array.min': conversationErrorMessages.min.replace('{{#label}}', 'Members').replace('{{#limit}}', '1'),
        'array.max': 'Members cannot exceed 1000 users',
        'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Members'),
      }),
    })
    .when('type', {
      is: 'channel',
      then: Joi.array().min(1).max(10000).required().messages({
        'array.min': conversationErrorMessages.min.replace('{{#label}}', 'Members').replace('{{#limit}}', '1'),
        'array.max': 'Members cannot exceed 10000 users',
        'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Members'),
      }),
    })
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Members'),
    }),
  visibility: Joi.string()
    .valid('public', 'private', 'hidden')
    .default('public')
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Visibility'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Visibility').replace('{{#enum}}', 'public, private, hidden'),
    }),
  tags: Joi.array()
    .items(Joi.string().trim().max(50).pattern(/^[a-zA-Z0-9_]+$/).messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Each tag'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Each tag').replace('{{#limit}}', '50'),
      'string.pattern.base': 'Each tag can only contain letters, numbers, and underscores',
    }))
    .max(10)
    .optional()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Tags'),
      'array.max': 'Tags cannot exceed 10 items',
    }),
  initialMessage: Joi.object({
    type: Joi.string()
      .valid('text', 'image', 'video', 'audio', 'file')
      .default('text')
      .messages({
        'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Initial message type').replace('{{#enum}}', 'text, image, video, audio, file'),
      }),
    content: Joi.string()
      .max(2000)
      .when('type', {
        is: 'text',
        then: Joi.string().trim().min(1).required().messages({
          'string.min': 'Initial message content must be at least 1 character',
          'any.required': 'Initial message content is required for type "text"',
        }),
        otherwise: Joi.string().uri().optional().messages({
          'string.uri': conversationErrorMessages.uri.replace('{{#label}}', 'Initial message content'),
        }),
      })
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Initial message content'),
        'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Initial message content').replace('{{#limit}}', '2000'),
      }),
    files: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required().messages({
            'string.uri': conversationErrorMessages.uri.replace('{{#label}}', 'File URL'),
            'any.required': conversationErrorMessages.required.replace('{{#label}}', 'File URL'),
          }),
          fileKey: Joi.string().required().messages({
            'string.base': conversationErrorMessages.string.replace('{{#label}}', 'File key'),
            'any.required': conversationErrorMessages.required.replace('{{#label}}', 'File key'),
          }),
          contentType: Joi.string()
            .valid(...SUPPORTED_MIME_TYPES)
            .required()
            .messages({
              'any.only': 'File content type must be one of supported MIME types',
              'any.required': conversationErrorMessages.required.replace('{{#label}}', 'File content type'),
            }),
          size: Joi.number().max(MAX_FILE_SIZE).required().messages({
            'number.max': `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            'any.required': conversationErrorMessages.required.replace('{{#label}}', 'File size'),
          }),
        })
      )
      .max(MAX_FILES)
      .optional()
      .messages({
        'array.max': `Files cannot exceed ${MAX_FILES} items`,
      }),
  }).optional(),
})
  .or('friendId', 'members')
  .messages({
    'object.missing': 'Either friendId (for direct) or members (for group/channel) is required',
  })
  .label('CreateConversation');

// Schema for updating a conversation
export const updateConversationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .min(3)
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Name'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Name').replace('{{#limit}}', '100'),
      'string.min': 'Name must be at least 3 characters',
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Description'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Description').replace('{{#limit}}', '500'),
    }),
  visibility: Joi.string()
    .valid('public', 'private', 'hidden')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Visibility'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Visibility').replace('{{#enum}}', 'public, private, hidden'),
    }),
  permissions: Joi.object({
    sendMessages: Joi.string()
      .valid('all', 'admins', 'moderators')
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Send messages permission'),
        'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Send messages permission').replace('{{#enum}}', 'all, admins, moderators'),
      }),
    addMembers: Joi.string()
      .valid('all', 'admins', 'moderators')
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Add members permission'),
        'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Add members permission').replace('{{#enum}}', 'all, admins, moderators'),
      }),
    pinMessages: Joi.string()
      .valid('all', 'admins', 'moderators')
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Pin messages permission'),
        'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Pin messages permission').replace('{{#enum}}', 'all, admins, moderators'),
      }),
  }).optional(),
  tags: Joi.array()
    .items(Joi.string().trim().max(50).pattern(/^[a-zA-Z0-9_]+$/).messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Each tag'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Each tag').replace('{{#limit}}', '50'),
      'string.pattern.base': 'Each tag can only contain letters, numbers, and underscores',
    }))
    .max(10)
    .optional()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Tags'),
      'array.max': 'Tags cannot exceed 10 items',
    }),
  admins: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Each admin ID'),
    }))
    .optional()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Admins'),
    }),
  moderators: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Each moderator ID'),
    }))
    .optional()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Moderators'),
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  })
  .label('UpdateConversation');

// Schema for adding members
export const addMembersSchema = Joi.object({
  members: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Each member ID'),
    }))
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Members'),
      'array.min': conversationErrorMessages.min.replace('{{#label}}', 'Members').replace('{{#limit}}', '1'),
      'array.max': 'Cannot add more than 1000 members at once',
      'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Members'),
    }),
}).label('AddMembers');

// Schema for removing members
export const removeMembersSchema = Joi.object({
  members: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': conversationErrorMessages.uuid.replace('{{#label}}', 'Each member ID'),
    }))
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.base': conversationErrorMessages.array.replace('{{#label}}', 'Members'),
      'array.min': conversationErrorMessages.min.replace('{{#label}}', 'Members').replace('{{#limit}}', '1'),
      'array.max': 'Cannot remove more than 1000 members at once',
      'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Members'),
    }),
}).label('RemoveMembers');

// Schema for updating chat settings
export const updateChatSettingsSchema = Joi.object({
  theme: Joi.string()
    .valid('light', 'dark', 'custom')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Theme'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Theme').replace('{{#enum}}', 'light, dark, custom'),
    }),
  background: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow(null)
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Background'),
      'string.uri': conversationErrorMessages.uri.replace('{{#label}}', 'Background'),
    }),
  font: Joi.string()
    .pattern(/^[a-zA-Z\s-]+$/)
    .max(50)
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Font'),
      'string.pattern.base': conversationErrorMessages.pattern.replace('{{#label}}', 'Font'),
      'string.max': conversationErrorMessages.max.replace('{{#label}}', 'Font').replace('{{#limit}}', '50'),
    }),
  bubbleStyle: Joi.object({
    senderColor: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Sender color'),
        'string.pattern.base': conversationErrorMessages.hexColor.replace('{{#label}}', 'Sender color'),
      }),
    receiverColor: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Receiver color'),
        'string.pattern.base': conversationErrorMessages.hexColor.replace('{{#label}}', 'Receiver color'),
      }),
    textColor: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .messages({
        'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Text color'),
        'string.pattern.base': conversationErrorMessages.hexColor.replace('{{#label}}', 'Text color'),
      }),
  }).optional(),
  accessibility: Joi.object({
    highContrast: Joi.boolean().optional().messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'High contrast'),
    }),
    largeText: Joi.boolean().optional().messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Large text'),
    }),
    screenReader: Joi.boolean().optional().messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Screen reader'),
    }),
  }).optional(),
  notificationSound: Joi.string()
    .valid('default', 'silent', 'custom1', 'custom2')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Notification sound'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Notification sound').replace('{{#enum}}', 'default, silent, custom1, custom2'),
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for settings update',
  })
  .label('UpdateChatSettings');

// Schema for joining via invite link
export const joinViaInviteSchema = Joi.object({
  inviteLink: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .pattern(/\/conversations\/join\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Invite link'),
      'string.uri': conversationErrorMessages.uri.replace('{{#label}}', 'Invite link'),
      'string.pattern.base': 'Invite link must contain a valid conversation ID',
      'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Invite link'),
    }),
}).label('JoinViaInvite');

// Schema for updating ephemeral settings
export const updateEphemeralSettingsSchema = Joi.object({
  ephemeral: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Ephemeral'),
    }),
  ephemeralTTL: Joi.number()
    .integer()
    .min(60)
    .max(604800) // 7 days in seconds
    .optional()
    .when('ephemeral', {
      is: true,
      then: Joi.required().messages({
        'any.required': conversationErrorMessages.required.replace('{{#label}}', 'Ephemeral TTL'),
      }),
    })
    .messages({
      'number.base': conversationErrorMessages.number.replace('{{#label}}', 'Ephemeral TTL'),
      'number.integer': conversationErrorMessages.integer.replace('{{#label}}', 'Ephemeral TTL'),
      'number.min': 'Ephemeral TTL must be at least 60 seconds',
      'number.max': 'Ephemeral TTL cannot exceed 604800 seconds (7 days)',
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for ephemeral settings update',
  })
  .label('UpdateEphemeralSettings');

// Schema for muting a conversation
export const muteConversationSchema = Joi.object({
  muteUntil: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': conversationErrorMessages.date.replace('{{#label}}', 'Mute until'),
      'date.min': 'Mute until must be in the future',
    }),
  pushEnabled: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': conversationErrorMessages.boolean.replace('{{#label}}', 'Push enabled'),
    }),
  notificationSound: Joi.string()
    .valid('default', 'silent', 'custom1', 'custom2')
    .optional()
    .messages({
      'string.base': conversationErrorMessages.string.replace('{{#label}}', 'Notification sound'),
      'any.only': conversationErrorMessages.enum.replace('{{#label}}', 'Notification sound').replace('{{#enum}}', 'default, silent, custom1, custom2'),
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for mute settings',
  })
  .label('MuteConversation');

// Message-related schemas
export const sendMessageBodySchema = Joi.object({
  conversationId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': 'Conversation ID must be a string (e.g)',
      'string.pattern.base': 'Conversation ID must be a valid UUID format',
      'any.required': 'Conversation ID is required to send a message',
    }),
  content: Joi.string()
    .allow('')
    .max(10000)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Content').replace('{{#limit}}', '10000'),
    }),
  media: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('file', 'image', 'video', 'voice', 'sticker', 'gif')
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media type'),
            'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Media type').replace('{{#enum}}', 'file, image, video, voice, sticker, gif'),
          }),
        content: Joi.string()
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media content'),
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Media content'),
          }),
        contentType: Joi.string()
          .valid(...SUPPORTED_MIME_TYPES)
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content type'),
            'any.only': 'Content type must be one of supported MIME types',
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Content type'),
          }),
        thumbnail: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .optional()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thumbnail'),
            'string.uri': messageErrorMessages.uri.replace('{{#label}}', 'Thumbnail'),
          }),
        shape: Joi.string()
          .valid('square', 'circle', 'rectangle')
          .default('square')
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Shape'),
            'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Shape').replace('{{#enum}}', 'square, circle, rectangle'),
          }),
        metadata: Joi.object({
          size: Joi.number().integer().min(0).max(MAX_FILE_SIZE).optional().messages({
            'number.max': `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          }),
          duration: Joi.number().min(0).optional(),
          width: Joi.number().integer().min(0).optional(),
          height: Joi.number().integer().min(0).optional(),
        }).optional(),
      })
    )
    .max(MAX_FILES)
    .optional()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Media'),
      'array.max': `Media cannot exceed ${MAX_FILES} items`,
    }),
  replyTo: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'ReplyTo'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'ReplyTo'),
    }),
  scheduledAt: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': 'ScheduledAt must be a valid ISO date',
      'date.min': 'ScheduledAt must be a future date',
    }),
  forwardedFrom: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .allow(null)
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'ForwardedFrom'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'ForwardedFrom'),
    }),
  threadId: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .allow(null)
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thread ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Thread ID'),
    }),
  hashtags: Joi.array()
    .items(Joi.string().pattern(/^#[a-zA-Z0-9_]{1,50}$/).messages({
      'string.pattern.base': 'Each hashtag must start with # and contain only letters, numbers, or underscores',
    }))
    .max(10)
    .optional()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Hashtags'),
      'array.max': 'Hashtags cannot exceed 10 items',
    }),
  mentions: Joi.array()
    .items(Joi.string().pattern(/^@[a-zA-Z0-9_]{1,50}$/).messages({
      'string.pattern.base': 'Each mention must start with @ and contain only letters, numbers, or underscores',
    }))
    .max(10)
    .optional()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Mentions'),
      'array.max': 'Mentions cannot exceed 10 items',
    }),
})
  .or('content', 'media')
  .messages({
    'object.missing': 'Either message content or media is required',
  })
  .label('SendMessageBody');

export const getMessagesQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': messageErrorMessages.number.replace('{{#label}}', 'Page'),
      'number.min': 'Page must be at least 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': messageErrorMessages.number.replace('{{#label}}', 'Limit'),
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  cursor: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': messageErrorMessages.date.replace('{{#label}}', 'Cursor'),
    }),
  threadId: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thread ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Thread ID'),
    }),
  sort: Joi.string()
    .valid('createdAt:asc', 'createdAt:desc')
    .default('createdAt:desc')
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Sort'),
      'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Sort').replace('{{#enum}}', 'createdAt:asc, createdAt:desc'),
    }),
}).label('GetMessagesQuery');

export const messageIdParamSchema = Joi.object({
  messageId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Message ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Message ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Message ID'),
    }),
}).label('MessageIdParam');

export const editMessageSchema = Joi.object({
  messageId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Message ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Message ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Message ID'),
    }),
  newContent: Joi.string()
    .max(10000)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'New content'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'New content').replace('{{#limit}}', '10000'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'New content'),
    }),
}).label('EditMessage');

export const searchMessagesSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Query'),
      'string.min': 'Query must be at least 1 character',
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Query').replace('{{#limit}}', '500'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Query'),
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': messageErrorMessages.number.replace('{{#label}}', 'Limit'),
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  fromUserId: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'From user ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'From user ID'),
    }),
  mediaType: Joi.string()
    .valid('image', 'video', 'audio', 'file', 'sticker', 'gif')
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media type'),
      'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Media type').replace('{{#enum}}', 'image, video, audio, file, sticker, gif'),
    }),
}).label('SearchMessages');

export const createPollSchema = Joi.object({
  conversationId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Conversation ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Conversation ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Conversation ID'),
    }),
  question: Joi.string()
    .trim()
    .max(500)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Question'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Question').replace('{{#limit}}', '500'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Question'),
    }),
  options: Joi.array()
    .items(Joi.string().trim().max(100))
    .min(2)
    .max(10)
    .required()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Options'),
      'array.min': messageErrorMessages.min.replace('{{#label}}', 'Options').replace('{{#limit}}', '2'),
      'array.max': 'Options cannot exceed 10 items',
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Each option'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Each option').replace('{{#limit}}', '100'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Options'),
    }),
  allowMultipleVotes: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': messageErrorMessages.boolean.replace('{{#label}}', 'Allow multiple votes'),
    }),
  pollExpiresAt: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.base': messageErrorMessages.date.replace('{{#label}}', 'Poll expiration'),
      'date.min': 'Poll expiration must be in the future',
    }),
}).label('CreatePoll');

export const votePollSchema = Joi.object({
  optionIndex: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': messageErrorMessages.number.replace('{{#label}}', 'Option index'),
      'number.min': 'Option index must be at least 0',
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Option index'),
    }),
}).label('VotePoll');

export const addReactionSchema = Joi.object({
  reaction: Joi.string()
    .trim()
    .max(10)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Reaction'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Reaction').replace('{{#limit}}', '10'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Reaction'),
    }),
}).label('AddReaction');

export const generatePresignedUrlSchema = Joi.object({
  fileType: Joi.string()
    .valid(...SUPPORTED_MIME_TYPES)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'File type'),
      'any.only': 'File type must be one of supported MIME types',
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'File type'),
    }),
  contentType: Joi.string()
    .valid('file', 'image', 'video', 'voice', 'sticker', 'gif')
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content type'),
      'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Content type').replace('{{#enum}}', 'file, image, video, voice, sticker, gif'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Content type'),
    }),
  fileSize: Joi.number()
    .integer()
    .min(1)
    .max(MAX_FILE_SIZE)
    .optional()
    .messages({
      'number.base': messageErrorMessages.number.replace('{{#label}}', 'File size'),
      'number.min': 'File size must be at least 1 byte',
      'number.max': `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }),
}).label('GeneratePresignedUrl');

// Schema for forwarding a message
export const forwardMessageSchema = Joi.object({
  messageId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Message ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Message ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Message ID'),
    }),
  targetConversationIds: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Each target conversation ID'),
    }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Target conversation IDs'),
      'array.min': messageErrorMessages.min.replace('{{#label}}', 'Target conversation IDs').replace('{{#limit}}', '1'),
      'array.max': 'Cannot forward to more than 50 conversations',
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Target conversation IDs'),
    }),
  comment: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Comment'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Comment').replace('{{#limit}}', '500'),
    }),
}).label('ForwardMessage');

// Schema for creating a message draft
export const createMessageDraftSchema = Joi.object({
  conversationId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Conversation ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Conversation ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Conversation ID'),
    }),
  content: Joi.string()
    .allow('')
    .max(10000)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Content').replace('{{#limit}}', '10000'),
    }),
  media: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('file', 'image', 'video', 'voice', 'sticker', 'gif')
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media type'),
            'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Media type').replace('{{#enum}}', 'file, image, video, voice, sticker, gif'),
          }),
        content: Joi.string()
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media content'),
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Media content'),
          }),
        contentType: Joi.string()
          .valid(...SUPPORTED_MIME_TYPES)
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content type'),
            'any.only': 'Content type must be one of supported MIME types',
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Content type'),
          }),
        thumbnail: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .optional()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thumbnail'),
            'string.uri': messageErrorMessages.uri.replace('{{#label}}', 'Thumbnail'),
          }),
        metadata: Joi.object({
          size: Joi.number().integer().min(0).max(MAX_FILE_SIZE).optional().messages({
            'number.max': `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          }),
          duration: Joi.number().min(0).optional(),
          width: Joi.number().integer().min(0).optional(),
          height: Joi.number().integer().min(0).optional(),
        }).optional(),
      })
    )
    .max(MAX_FILES)
    .optional()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Media'),
      'array.max': `Media cannot exceed ${MAX_FILES} items`,
    }),
  replyTo: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'ReplyTo'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'ReplyTo'),
    }),
  threadId: Joi.string()
    .pattern(uuidPattern)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thread ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Thread ID'),
    }),
}).label('CreateMessageDraft');

// Schema for bulk message actions (e.g., bulk delete, mark as read)
export const bulkMessageActionSchema = Joi.object({
  messageIds: Joi.array()
    .items(Joi.string().pattern(uuidPattern).messages({
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Each message ID'),
    }))
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Message IDs'),
      'array.min': messageErrorMessages.min.replace('{{#label}}', 'Message IDs').replace('{{#limit}}', '1'),
      'array.max': 'Cannot process more than 100 messages at once',
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Message IDs'),
    }),
}).label('BulkMessageAction');

// Schema for creating a thread
export const createThreadSchema = Joi.object({
  conversationId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Conversation ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Conversation ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Conversation ID'),
    }),
  parentMessageId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Parent message ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Parent message ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Parent message ID'),
    }),
  content: Joi.string()
    .allow('')
    .max(10000)
    .optional()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content'),
      'string.max': messageErrorMessages.max.replace('{{#label}}', 'Content').replace('{{#limit}}', '10000'),
    }),
  media: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid('file', 'image', 'video', 'voice', 'sticker', 'gif')
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media type'),
            'any.only': messageErrorMessages.enum.replace('{{#label}}', 'Media type').replace('{{#enum}}', 'file, image, video, voice, sticker, gif'),
          }),
        content: Joi.string()
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Media content'),
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Media content'),
          }),
        contentType: Joi.string()
          .valid(...SUPPORTED_MIME_TYPES)
          .required()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Content type'),
            'any.only': 'Content type must be one of supported MIME types',
            'any.required': messageErrorMessages.required.replace('{{#label}}', 'Content type'),
          }),
        thumbnail: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .optional()
          .messages({
            'string.base': messageErrorMessages.string.replace('{{#label}}', 'Thumbnail'),
            'string.uri': messageErrorMessages.uri.replace('{{#label}}', 'Thumbnail'),
          }),
        metadata: Joi.object({
          size: Joi.number().integer().min(0).max(MAX_FILE_SIZE).optional().messages({
            'number.max': `File size cannot exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          }),
          duration: Joi.number().min(0).optional(),
          width: Joi.number().integer().min(0).optional(),
          height: Joi.number().integer().min(0).optional(),
        }).optional(),
      })
    )
    .max(MAX_FILES)
    .optional()
    .messages({
      'array.base': messageErrorMessages.array.replace('{{#label}}', 'Media'),
      'array.max': `Media cannot exceed ${MAX_FILES} items`,
    }),
})
  .or('content', 'media')
  .messages({
    'object.missing': 'Either content or media is required',
  })
  .label('CreateThread');

// Schema for managing message notifications
export const messageNotificationSchema = Joi.object({
  messageId: Joi.string()
    .pattern(uuidPattern)
    .required()
    .messages({
      'string.base': messageErrorMessages.string.replace('{{#label}}', 'Message ID'),
      'string.pattern.base': messageErrorMessages.uuid.replace('{{#label}}', 'Message ID'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Message ID'),
    }),
  notify: Joi.boolean()
    .required()
    .messages({
      'boolean.base': messageErrorMessages.boolean.replace('{{#label}}', 'Notify'),
      'any.required': messageErrorMessages.required.replace('{{#label}}', 'Notify'),
    }),
}).label('MessageNotification');

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