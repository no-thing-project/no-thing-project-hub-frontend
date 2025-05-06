export const normalizeTweet = (tweet, currentUser) => {
  // Validate that tweet is an object
  if (!tweet || typeof tweet !== "object") {
    console.warn("Invalid tweet input for normalization:", tweet);
    return {
      tweet_id: "",
      content: { type: "text", value: "" },
      user: {
        anonymous_id: currentUser?.anonymous_id || "",
        username: "",
      },
      liked_by: [],
      likedByUser: false,
      likes: 0,
      x: 0,
      y: 0,
      timestamp: new Date().toISOString(),
      status: "approved",
      editable_until: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  return {
    ...tweet,
    user: tweet.user || {
      anonymous_id: tweet.anonymous_id || currentUser?.anonymous_id || "",
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
  };
};