/**
 * @module normalizeTweet
 * @description Utility function to normalize tweet data for consistent frontend usage.
 */

/**
 * Normalizes tweet data for frontend consistency.
 * @param {Object} tweet
 * @param {Object} currentUser
 * @returns {Object}
 */
export const normalizeTweet = (tweet, currentUser) => {
  if (!tweet || typeof tweet !== 'object') {
    console.warn('Invalid tweet input:', tweet);
    return {
      tweet_id: '',
      content: { type: 'text', value: '', metadata: { files: [], hashtags: [], mentions: [] } },
      anonymous_id: currentUser?.anonymous_id || '',
      username: currentUser?.username || '',
      position: { x: 0, y: 0 },
      parent_tweet_id: null,
      child_tweet_ids: [],
      is_anonymous: false,
      liked_by: [],
      is_liked: false,
      stats: { likes: 0, like_count: 0, view_count: 0 },
      created_at: new Date().toISOString(),
      status: 'approved',
      scheduled_at: null,
      reminder: null,
      is_pinned: false,
      analytics: { views: [], shares: [] },
    };
  }

  const content = tweet.content || { type: 'text', value: '', metadata: {} };
  const metadata = {
    files: content.metadata?.files || [],
    hashtags: content.metadata?.hashtags || [],
    mentions: content.metadata?.mentions || [],
    style: content.metadata?.style || {},
    poll_options: content.metadata?.poll_options || [],
    event_details: content.metadata?.event_details || {},
    quote_ref: content.metadata?.quote_ref || null,
    embed_data: content.metadata?.embed_data || null,
  };

  return {
    tweet_id: tweet.tweet_id || '',
    content: { type: content.type || 'text', value: content.value || '', metadata },
    anonymous_id: tweet.anonymous_id || currentUser?.anonymous_id || '',
    username: tweet.is_anonymous ? 'Anonymous' : tweet.username || currentUser?.username || '',
    position: { x: Number(tweet.position?.x) || 0, y: Number(tweet.position?.y) || 0 },
    parent_tweet_id: tweet.parent_tweet_id || null,
    child_tweet_ids: tweet.child_tweet_ids || [],
    children: tweet.children?.map(child => normalizeTweet(child, currentUser)) || [],
    is_anonymous: !!tweet.is_anonymous,
    liked_by: tweet.liked_by || [],
    is_liked: tweet.is_liked || (tweet.liked_by || []).some(u => u.anonymous_id === currentUser?.anonymous_id) || false,
    stats: {
      likes: tweet.stats?.like_count ?? (tweet.liked_by || []).length,
      like_count: tweet.stats?.like_count ?? (tweet.liked_by || []).length,
      view_count: tweet.stats?.view_count ?? 0,
    },
    created_at: tweet.created_at || new Date().toISOString(),
    updated_at: tweet.updated_at || tweet.created_at || new Date().toISOString(),
    status: tweet.status || 'approved',
    scheduled_at: tweet.scheduled_at || null,
    reminder: tweet.reminder || null,
    is_pinned: !!tweet.is_pinned,
    analytics: {
      views: tweet.analytics?.views || [],
      shares: tweet.analytics?.shares || [],
    },
  };
};