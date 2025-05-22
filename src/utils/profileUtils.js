export const handleApiError = (err, setError) => {
  setError(err.response?.data?.errors?.[0] || "An error occurred");
};

export const normalizeUserData = (userData, existingData = null) => {
  if (!userData) return null;

  return {
    anonymous_id: userData.anonymous_id || '',
    username: userData.username || 'Someone',
    email: userData.email || '',
    total_points: Number(userData.total_points) >= 0 ? Number(userData.total_points) : (existingData?.total_points ?? 0),
    donated_points: Number(userData.donated_points) >= 0 ? Number(userData.donated_points) : (existingData?.donated_points ?? 0),
    profile_picture: userData.profile_picture || '',
    bio: userData.bio || '',
    social_links: {
      twitter: userData.social_links?.twitter || '',
      instagram: userData.social_links?.instagram || '',
      linkedin: userData.social_links?.linkedin || '',
    },
    isPublic: userData.isPublic ?? true,
    isActive: userData.isActive ?? true,
    timezone: userData.timezone || '',
    gender: userData.gender || '',
    location: userData.location || '',
    ethnicity: userData.ethnicity || '',
    dateOfBirth: userData.dateOfBirth || null,
    onlineStatus: userData.onlineStatus || 'offline',
    lastSeen: userData.lastSeen || null,
    nameVisibility: userData.nameVisibility || 'public',
    preferences: {
      language: userData.preferences?.language || 'en',
      theme: userData.preferences?.theme || 'System',
      contentLanguage: userData.preferences?.contentLanguage || 'en',
      notifications: {
        email: userData.preferences?.notifications?.email ?? false,
        sms: userData.preferences?.notifications?.sms ?? false,
        push: userData.preferences?.notifications?.push ?? false,
      },
      favorite_boards: userData.preferences?.favorite_boards || [],
      muted_boards: userData.preferences?.muted_boards || [],
      content_filters: {
        show_public_only: userData.preferences?.content_filters?.show_public_only ?? false,
        hide_anonymous: userData.preferences?.content_filters?.hide_anonymous ?? false,
        preferred_tags: userData.preferences?.content_filters?.preferred_tags || [],
      },
    },
    access_level: userData.access_level || 'user',
    stats: {
      tweet_count: userData.stats?.tweet_count || 0,
      board_count: userData.stats?.board_count || 0,
      gate_count: userData.stats?.gate_count || 0,
      class_count: userData.stats?.class_count || 0,
      like_count: userData.stats?.like_count || 0,
      points_earned: userData.stats?.points_earned || 0,
      points_spent: userData.stats?.points_spent || 0,
    },
    created_content: {
      tweets: userData.created_content?.tweets || [],
      boards: userData.created_content?.boards || [],
      gates: userData.created_content?.gates || [],
      classes: userData.created_content?.classes || [],
    },
    friends: userData.friends || [],
    gate: userData.gate || null,
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString(),
    last_synced_at: userData.last_synced_at || new Date().toISOString(),
  };
};