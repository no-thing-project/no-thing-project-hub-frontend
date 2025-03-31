export const MESSAGE_TYPES = ["text", "file", "image", "voice", "video", "sticker", "mixed", "ai_generated"];
export const MESSAGE_STATUSES = ["sent", "delivered", "read", "failed"];
export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_GROUP_NAME_LENGTH = 100;
export const MAX_REACTION_LENGTH = 50;
export const MAX_TAG_LENGTH = 50;
export const DEFAULT_CHAT_SETTINGS = {
  background: "default",
  message_style: { font_size: 16, font_family: "Arial", color: "#000000" },
  media_styles: { video_shape: "square", audio_visualization: "waveform", image_border_radius: 0 },
};
export const PAGINATION_DEFAULTS = {
  LIMIT: 20,
  MAX_LIMIT: 100,
  OFFSET: 0,
};

export const INITIAL_LOADING_STATE = { initial: true, action: false };
export const DEFAULT_MESSAGES = [];
export const DEFAULT_GROUP_CHATS = [];
export const DEFAULT_CONVERSATIONS = [];
export const MESSAGES_PAGE_LIMIT = 20;