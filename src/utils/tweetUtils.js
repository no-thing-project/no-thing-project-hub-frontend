export const normalizeTweet = (tweet, currentUser) => ({
    ...tweet,
    user: tweet.user || {
      anonymous_id: tweet.user_id || tweet.user?.anonymous_id,
      username: tweet.username || (tweet.is_anonymous ? "Anonymous" : ""),
    },
    content: tweet.content || { type: "text", value: "" },
    liked_by: tweet.liked_by || [],
    likedByUser: (tweet.liked_by || []).some((u) => u.user_id === currentUser?.anonymous_id),
    likes: tweet.stats?.like_count !== undefined ? tweet.stats.like_count : (tweet.liked_by || []).length,
    x: tweet.position?.x || 0,
    y: tweet.position?.y || 0,
    timestamp: tweet.timestamp || new Date().toISOString(),
    status: tweet.status || "approved",
    editable_until: tweet.editable_until || new Date(Date.now() + 15 * 60 * 1000), // 15 minutes edit window
  });