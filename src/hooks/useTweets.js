// hooks/useTweets.js
import { useCallback, useState, useMemo } from "react";
import axios from "axios";
import config from "../config.js";

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

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
        username: tweet.username,
      },
      content: tweet.content || { type: "text", value: "" },
      liked_by: tweet.liked_by || [],
      likedByUser: (tweet.liked_by || []).some(
        (u) => u.user_id === currentUser?.id
      ),
      likes:
        tweet.stats?.like_count !== undefined
          ? tweet.stats.like_count
          : (tweet.liked_by || []).length,
      x: tweet.position?.x || 0,
      y: tweet.position?.y || 0,
      timestamp: tweet.timestamp || new Date().toISOString(),
    }),
    [currentUser?.id]
  );

  const fetchTweets = useCallback(async () => {
    try {
      const res = await axios.get(
        `${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}`,
        { headers: authHeaders }
      );
      const tweetsData = res.data.content.tweets.map(normalizeTweet);
      setTweets(tweetsData);
    } catch (err) {
      console.error("Error fetching tweets:", err);
      handleAuthError(err);
    }
  }, [boardId, authHeaders, normalizeTweet, handleAuthError]);

  const createTweet = useCallback(
    async (content, x, y, parent_tweet_id) => {
      try {
        const payload = {
          content: typeof content === "string" ? { type: "text", value: content } : content,
          position: { x, y },
          board_id: boardId,
          parent_tweet_id: parent_tweet_id || null,
        };
        const res = await axios.post(
          `${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${boardId}`,
          payload,
          { headers: authHeaders }
        );
        const createdTweet = res.data.content.tweets || res.data;
        return normalizeTweet({
          ...createdTweet,
          position: createdTweet.position || { x, y },
        });
      } catch (err) {
        console.error("Error creating tweet:", err);
        handleAuthError(err);
      }
    },
    [boardId, authHeaders, normalizeTweet, handleAuthError]
  );

  const updateTweet = useCallback(
    async (id, updates) => {
      try {
        await axios.put(
          `${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${id}/position`,
          updates,
          { headers: authHeaders }
        );
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError]
  );

  const toggleLike = useCallback(
    async (id, isLiked) => {
      try {
        const endpoint = isLiked ? "dislike" : "like";
        const res = await axios.post(
          `${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${id}/${endpoint}`,
          {},
          { headers: authHeaders }
        );
        const updatedTweet = res.data.content || res.data;
        return normalizeTweet(updatedTweet);
      } catch (err) {
        console.error("Error toggling like:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError, normalizeTweet]
  );

  const deleteTweet = useCallback(
    async (id) => {
      try {
        await axios.delete(
          `${config.REACT_APP_HUB_API_URL}/api/v1/tweets/${id}`,
          { headers: authHeaders }
        );
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
      }
    },
    [authHeaders, handleAuthError]
  );

  return {
    tweets,
    setTweets,
    fetchTweets,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
  };
};
