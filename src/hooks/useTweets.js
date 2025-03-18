import { useCallback, useState, useMemo } from "react";
import axios from "axios";
import config from "../config.js";

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
        navigate("/login");
      }
    },
    [onLogout, navigate]
  );

  const normalizeTweet = useCallback(
    (tweet) => ({
      ...tweet,
      user: tweet.user || {
        _id: tweet.user_id,
        username: tweet.username || (tweet.is_anonymous ? "Anonymous" : ""),
      },
      content: tweet.content || { type: "text", value: "" },
      liked_by: tweet.liked_by || [],
      likedByUser: (tweet.liked_by || []).some((u) => u.user_id === currentUser?.anonymous_id),
      likes: tweet.stats?.like_count !== undefined ? tweet.stats.like_count : (tweet.liked_by || []).length,
      x: tweet.position?.x || 0,
      y: tweet.position?.y || 0,
      timestamp: tweet.timestamp || new Date().toISOString(),
      status: tweet.status || "approved", // Додаємо статус для модерації
      editable_until: tweet.editable_until || new Date(Date.now() + 15 * 60 * 1000), // 15 хвилин для редагування
    }),
    [currentUser?.anonymous_id]
  );

  // Отримати всі твіти
  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }) => {
      try {
        const { status, page, limit, sort } = options;
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}`, {
          headers: authHeaders,
          params: { status, page, limit, sort },
        });
        const tweetsData = res.data.content.tweets.map(normalizeTweet);
        setTweets(tweetsData);
      } catch (err) {
        console.error("Error fetching tweets:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, normalizeTweet, handleAuthError]
  );

  // Отримати один твіт за ID
  const fetchTweetById = useCallback(
    async (tweetId) => {
      try {
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}/${tweetId}`, {
          headers: authHeaders,
        });
        return normalizeTweet(res.data.content);
      } catch (err) {
        console.error("Error fetching tweet by ID:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, normalizeTweet, handleAuthError]
  );

  // Створити твіт
  const createTweet = useCallback(
    async (content, x, y, parent_tweet_id, is_anonymous = false) => {
      try {
        const payload = {
          content: typeof content === "string" ? { type: "text", value: content } : content,
          position: { x, y },
          board_id: boardId,
          parent_tweet_id: parent_tweet_id || null,
          is_anonymous,
        };
        const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}`, payload, {
          headers: authHeaders,
        });
        const createdTweet = res.data.content || res.data;
        const normalizedTweet = normalizeTweet({
          ...createdTweet,
          position: createdTweet.position || { x, y },
        });
        setTweets((prev) => [normalizedTweet, ...prev]); // Оновлюємо локальний стан
        return normalizedTweet;
      } catch (err) {
        console.error("Error creating tweet:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, normalizeTweet, handleAuthError]
  );

  // Оновити твіт
  const updateTweet = useCallback(
    async (id, updates) => {
      try {
        const { content, position } = updates;
        const payload = {};
        if (content) payload.content = typeof content === "string" ? { type: "text", value: content } : content;
        if (position) payload.position = position;

        await axios.put(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}/${id}`, payload, {
          headers: authHeaders,
        });
        const updatedTweet = await fetchTweetById(id); // Оновлюємо дані з сервера
        setTweets((prev) =>
          prev.map((tweet) => (tweet.tweet_id === id ? { ...tweet, ...updatedTweet } : tweet))
        );
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, fetchTweetById, handleAuthError]
  );

  // Переключити лайк
  const toggleLike = useCallback(
    async (id, isLiked) => {
      try {
        const endpoint = isLiked ? "unlike" : "like";
        const res = await axios.post(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${id}/${endpoint}`, {}, {
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
      }
    },
    [authHeaders, normalizeTweet, handleAuthError]
  );

  // Видалити твіт
  const deleteTweet = useCallback(
    async (id) => {
      try {
        await axios.delete(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}/${id}`, {
          headers: authHeaders,
        });
        setTweets((prev) => prev.filter((tweet) => tweet.tweet_id !== id));
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, handleAuthError]
  );

  // Отримати коментарі до твіту
  const getTweetComments = useCallback(
    async (tweetId, options = { page: 1, limit: 20 }) => {
      try {
        const { page, limit } = options;
        const res = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${tweetId}/comments`, {
          headers: authHeaders,
          params: { page, limit },
        });
        return res.data.content.comments.map(normalizeTweet);
      } catch (err) {
        console.error("Error fetching comments:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, normalizeTweet, handleAuthError]
  );

  // Оновити статус твіту
  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      try {
        const payload = { status };
        await axios.put(`${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}/${tweetId}/status`, payload, {
          headers: authHeaders,
        });
        const updatedTweet = await fetchTweetById(tweetId);
        setTweets((prev) =>
          prev.map((tweet) => (tweet.tweet_id === tweetId ? { ...tweet, ...updatedTweet } : tweet))
        );
      } catch (err) {
        console.error("Error updating tweet status:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, fetchTweetById, handleAuthError]
  );

  return {
    tweets,
    setTweets,
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