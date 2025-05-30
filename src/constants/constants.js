export const MESSAGE_CONSTANTS = {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    THROTTLE_MS: 1000,
    MESSAGES_PER_PAGE: 20,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    DEBOUNCE_MS: 300,
    POLLING_INTERVAL: 30000,
    HIGHLIGHT_DURATION: 2000,
    ERRORS: {
      NO_CONVERSATION: 'No conversation selected',
      MESSAGE_SEND: 'Failed to send message',
      MESSAGES_LOAD: 'Failed to load messages',
      GROUP_CREATE: 'Failed to create group',
      GROUP_VALIDATION: 'Group name and at least 2 members required',
      MESSAGE_FORWARD: 'Failed to forward message',
      FRIENDS_LOAD: 'Failed to load friends',
    },
    SUCCESS: {
      MESSAGE_SENT: 'Message sent successfully',
      GROUP_CREATED: 'Group created successfully',
      MESSAGE_FORWARDED: 'Message forwarded successfully',
    },
  };
  
  export const SOCKET_EVENTS = {
    MESSAGE: 'message',
    USER_STATUS: 'user_status',
    CHECK_STATUS: 'check_status',
  };