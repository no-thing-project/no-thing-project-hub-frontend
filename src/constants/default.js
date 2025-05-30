export const DEFAULT_GATE = {
    name: '',
    description: '',
    is_public: true,
    visibility: 'public',
    type: 'community',
    settings: {
      class_creation_cost: 100,
      board_creation_cost: 50,
      max_members: 1000,
      ai_moderation_enabled: true,
    },
  };
  
  export const DEFAULT_CLASS = {
    name: '',
    description: '',
    is_public: false,
    visibility: 'private',
    gate_id: '',
    type: 'group',
    settings: {
      max_boards: 100,
      max_members: 50,
      board_creation_cost: 50,
      tweet_cost: 1,
      allow_invites: true,
      require_approval: false,
      ai_moderation_enabled: true,
      auto_archive_after: 30,
    },
    tags: [],
  };
  
  export const DEFAULT_BOARD = {
    name: '',
    description: '',
    is_public: false,
    visibility: 'private',
    type: 'group',
    gate_id: null,
    class_id: null,
    settings: {
      max_tweets: 100,
      max_members: 50,
      tweet_cost: 1,
      favorite_cost: 1,
      points_to_creator: 1,
      allow_invites: true,
      require_approval: false,
      ai_moderation_enabled: true,
      auto_archive_after: 30,
    },
    tags: [],
  };