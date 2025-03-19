import { useCallback, useState } from "react";

import { normalizeTweet } from "../utils/tweetUtils";
import { createTweetApi, deleteTweetApi, fetchTweetById, fetchTweetsApi, getTweetCommentsApi, toggleLikeApi, updateTweetApi, updateTweetStatusApi } from "../utils/tweetsApi";

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fetch all tweets for a board
  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }) => {
      setLoading(true);
      setError(null);
      try {
        const tweetsData = await fetchTweetsApi(boardId, token, options);
        setTweets(tweetsData.map((tweet) => normalizeTweet(tweet, currentUser)));
      } catch (err) {
        console.error("Error fetching tweets:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  // Fetch a single tweet by ID
  const fetchTweet = useCallback(
    async (tweet_id) => {
      setLoading(true);
      setError(null);
      try {
        const tweetData = await fetchTweetById(tweet_id, token);
        if (!tweetData) {
          throw new Error("Tweet not found");
        }
        return normalizeTweet(tweetData, currentUser);
      } catch (err) {
        console.error("Error fetching tweet by ID:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [ token, currentUser, handleAuthError]
  );

  // Create a tweet
  const createTweet = useCallback(
    async (board_id, content, x, y, parentTweetId, isAnonymous = false) => {
      setLoading(true);
      setError(null);
      try {
        const createdTweet = await createTweetApi( content, x, y, parentTweetId, isAnonymous, token);
        const normalizedTweet = normalizeTweet(
          {
            ...createdTweet,
            position: createdTweet.position || { x, y },
          },
          currentUser
        );
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
    [ token, currentUser, handleAuthError]
  );

  // Update a tweet
  const updateTweet = useCallback(
    async (tweetId, updates) => {
      setLoading(true);
      setError(null);
      try {
        await updateTweetApi(boardId, tweetId, updates, token);
        const updatedTweet = await fetchTweet(tweetId);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet.tweet_id === tweetId ? { ...tweet, ...updatedTweet } : tweet))
          );
        }
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, fetchTweet, handleAuthError]
  );

  // Toggle like
  const toggleLike = useCallback(
    async (tweetId, isLiked) => {
      setLoading(true);
      setError(null);
      try {
        const updatedTweetData = await toggleLikeApi(tweetId, isLiked, token);
        const updatedTweet = normalizeTweet(updatedTweetData, currentUser);
        setTweets((prev) =>
          prev.map((tweet) => (tweet.tweet_id === tweetId ? { ...tweet, ...updatedTweet } : tweet))
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
    [token, currentUser, handleAuthError]
  );

  // Delete a tweet
  const deleteTweet = useCallback(
    async (tweetId) => {
      setLoading(true);
      setError(null);
      try {
        await deleteTweetApi(boardId, tweetId, token);
        setTweets((prev) => prev.filter((tweet) => tweet.tweet_id !== tweetId));
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, handleAuthError]
  );

  // Get tweet comments
  const getTweetComments = useCallback(
    async (tweetId, options = { page: 1, limit: 20 }) => {
      setLoading(true);
      setError(null);
      try {
        const commentsData = await getTweetCommentsApi(tweetId, token, options);
        return commentsData.map((comment) => normalizeTweet(comment, currentUser));
      } catch (err) {
        console.error("Error fetching comments:", err);
        handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  // Update tweet status
  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      setLoading(true);
      setError(null);
      try {
        await updateTweetStatusApi(boardId, tweetId, status, token);
        const updatedTweet = await fetchTweet(tweetId);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet.tweet_id === tweetId ? { ...tweet, ...updatedTweet } : tweet))
          );
        }
      } catch (err) {
        console.error("Error updating tweet status:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, fetchTweet, handleAuthError]
  );

  return {
    tweets,
    setTweets,
    loading,
    error,
    fetchTweets,
    fetchTweet,
    createTweet,
    updateTweet,
    toggleLike,
    deleteTweet,
    getTweetComments,
    updateTweetStatus,
  };
};