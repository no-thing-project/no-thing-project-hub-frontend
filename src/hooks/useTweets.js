import { useCallback, useState, useMemo } from "react";
import axios from "axios";
import config from "../config.js";

export const useTweets = (token, board_id, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  const normalizeTweet = useCallback(
    (tweet) => ({
      ...tweet,
      user: tweet.user || {
        _id: tweet.user_id || tweet.user?.anonymous_id,
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
    }),
    [currentUser?.anonymous_id]
  );

  // Fetch all tweets for a board
  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }) => {
      setLoading(true);
      setError(null);
      try {
        const { status, page, limit, sort } = options;
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/`, {
          headers: authHeaders,
          params: { status, page, limit, sort },
        });
        const tweetsData = res.data.content.tweets.map(normalizeTweet);
        setTweets(tweetsData);
      } catch (err) {
        console.error("Error fetching tweets:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, normalizeTweet, handleAuthError]
  );

  // Fetch a single tweet by ID
  const fetchTweetById = useCallback(
    async (tweet_id) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/${tweet_id}`, {
          headers: authHeaders,
        });
        return normalizeTweet(res.data.content);
      } catch (err) {
        console.error("Error fetching tweet by ID:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, normalizeTweet, handleAuthError]
  );

  // Create a tweet
  const createTweet = useCallback(
    async (content, x, y, parent_tweet_id, is_anonymous = false) => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          content: typeof content === "string" ? { type: "text", value: content } : content,
          position: { x, y },
          board_id: board_id,
          parent_tweet_id: parent_tweet_id || null,
          is_anonymous,
        };
        const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/`, payload, {
          headers: authHeaders,
        });
        const createdTweet = res.data.content || res.data;
        const normalizedTweet = normalizeTweet({
          ...createdTweet,
          position: createdTweet.position || { x, y },
        });
        setTweets((prev) => [normalizedTweet, ...prev]);
        return normalizedTweet;
      } catch (err) {
        console.error("Error creating tweet:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, normalizeTweet, handleAuthError]
  );

  // Update a tweet
  const updateTweet = useCallback(
    async (id, updates) => {
      setLoading(true);
      setError(null);
      try {
        const { content, position } = updates;
        const payload = {};
        if (content) payload.content = typeof content === "string" ? { type: "text", value: content } : content;
        if (position) payload.position = position;

        await axios.put(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/${id}`, payload, {
          headers: authHeaders,
        });
        const updatedTweet = await fetchTweetById(id);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet.tweet_id === id ? { ...tweet, ...updatedTweet } : tweet))
          );
        }
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, fetchTweetById, handleAuthError]
  );

  // Toggle like
  const toggleLike = useCallback(
    async (id, isLiked) => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isLiked ? "unlike" : "like";
        const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/${id}/${endpoint}`, {}, {
          headers: authHeaders,
        });
        const updatedTweet = normalizeTweet(res.data.content || res.data);
        setTweets((prev) =>
          prev.map((tweet) => (tweet.tweet_id === id ? { ...tweet, ...updatedTweet } : tweet))
        );
        return updatedTweet;
      } catch (err) {
        console.error("Error toggling like:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, normalizeTweet, handleAuthError]
  );

  // Delete a tweet
  const deleteTweet = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${config.REACT_APP_HUB_API_URL}/api/v1/boards/${board_id}/tweets/${id}`, {
          headers: authHeaders,
        });
        setTweets((prev) => prev.filter((tweet) => tweet.tweet_id !== id));
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, handleAuthError]
  );

  // Get tweet comments
  const getTweetComments = useCallback(
    async (tweet_id, options = { page: 1, limit: 20 }) => {
      setLoading(true);
      setError(null);
      try {
        const { page, limit } = options;
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/${tweet_id}/comments`, {
          headers: authHeaders,
          params: { page, limit },
        });
        return res.data.content.comments.map(normalizeTweet);
      } catch (err) {
        console.error("Error fetching comments:", err);
        handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, normalizeTweet, handleAuthError]
  );

  // Update tweet status
  const updateTweetStatus = useCallback(
    async (tweet_id, status) => {
      setLoading(true);
      setError(null);
      try {
        const payload = { status };
        await axios.put(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${board_id}/${tweet_id}/status`, payload, {
          headers: authHeaders,
        });
        const updatedTweet = await fetchTweetById(tweet_id);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet.tweet_id === tweet_id ? { ...tweet, ...updatedTweet } : tweet))
          );
        }
      } catch (err) {
        console.error("Error updating tweet status:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [board_id, authHeaders, fetchTweetById, handleAuthError]
  );

  return {
    tweets,
    setTweets,
    loading,
    error,
    fetchTweets,
    fetchTweetById,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
    getTweetComments,
    updateTweetStatus,
  };
};