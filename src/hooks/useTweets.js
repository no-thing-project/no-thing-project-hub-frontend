// src/hooks/useTweets.js
import { useState, useCallback } from "react";
import {
  fetchTweetsApi,
  fetchTweetById,
  createTweetApi,
  updateTweetApi,
  toggleLikeApi,
  deleteTweetApi,
  getTweetCommentsApi,
  updateTweetStatusApi,
} from "../utils/tweetsApi";
import { normalizeTweet } from "../utils/tweetUtils";

/**
 * Custom hook for managing tweets-related operations.
 * @param {string} token - Authentication token
 * @param {string} boardId - Board ID for fetching tweets
 * @param {Object} currentUser - Current user data for normalizing tweets
 * @param {() => void} onLogout - Callback to handle logout on auth errors
 * @param {import("react-router-dom").NavigateFunction} navigate - Navigation function for redirects
 * @returns {Object} - Tweets state and operations
 */
export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle authentication errors (401/403)
  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch all tweets for a board
  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }, signal) => {
      if (!boardId) {
        setError("Board ID is required to fetch tweets");
        throw new Error("Board ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const tweetsData = await fetchTweetsApi(boardId, token, options, signal);
        const normalizedTweets = tweetsData.map((tweet) => normalizeTweet(tweet, currentUser));
        setTweets(normalizedTweets);
        return normalizedTweets;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching tweets:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  // Fetch a single tweet by ID
  const fetchTweet = useCallback(
    async (tweet_id, signal) => {
      if (!tweet_id) {
        setError("Tweet ID is required to fetch tweet");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const tweetData = await fetchTweetById(tweet_id, token, signal);
        if (!tweetData) {
          throw new Error("Tweet not found");
        }
        const normalizedTweet = normalizeTweet(tweetData, currentUser);
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching tweet by ID:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  // Create a new tweet
  const createNewTweet = useCallback(
    async (content, x, y, parentTweetId = null, isAnonymous = false) => {
      if (!boardId) {
        setError("Board ID is required to create a tweet");
        throw new Error("Board ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const createdTweet = await createTweetApi(boardId, content, x, y, parentTweetId, isAnonymous, token);
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
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  // Update an existing tweet
  const updateExistingTweet = useCallback(
    async (tweet_id, updates) => {
      if (!boardId) {
        setError("Board ID is required to update a tweet");
        throw new Error("Board ID is required");
      }
      if (!tweet_id) {
        setError("Tweet ID is required to update a tweet");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        await updateTweetApi(boardId, tweet_id, updates, token);
        const updatedTweet = await fetchTweet(tweet_id);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet._id === tweet_id ? updatedTweet : tweet))
          );
          setTweet(updatedTweet);
        }
        return updatedTweet;
      } catch (err) {
        console.error("Error updating tweet:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, fetchTweet, handleAuthError]
  );

  // Toggle like on a tweet
  const toggleLikeTweet = useCallback(
    async (tweet_id, isLiked) => {
      if (!tweet_id) {
        setError("Tweet ID is required to toggle like");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedTweetData = await toggleLikeApi(tweet_id, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweetData, currentUser);
        setTweets((prev) =>
          prev.map((tweet) => (tweet._id === tweet_id ? normalizedTweet : tweet))
        );
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        console.error("Error toggling like:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  // Delete a tweet
  const deleteExistingTweet = useCallback(
    async (tweet_id) => {
      if (!boardId) {
        setError("Board ID is required to delete a tweet");
        throw new Error("Board ID is required");
      }
      if (!tweet_id) {
        setError("Tweet ID is required to delete a tweet");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        await deleteTweetApi(boardId, tweet_id, token);
        setTweets((prev) => prev.filter((tweet) => tweet._id !== tweet_id));
        setTweet(null);
      } catch (err) {
        console.error("Error deleting tweet:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, handleAuthError]
  );

  // Fetch tweet comments
  const fetchTweetComments = useCallback(
    async (tweet_id, options = { page: 1, limit: 20 }, signal) => {
      if (!tweet_id) {
        setError("Tweet ID is required to fetch comments");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const commentsData = await getTweetCommentsApi(tweet_id, token, options, signal);
        const normalizedComments = commentsData.map((comment) => normalizeTweet(comment, currentUser));
        setComments(normalizedComments);
        return normalizedComments;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching comments:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  // Update tweet status
  const updateTweetStatus = useCallback(
    async (tweet_id, status) => {
      if (!boardId) {
        setError("Board ID is required to update tweet status");
        throw new Error("Board ID is required");
      }
      if (!tweet_id) {
        setError("Tweet ID is required to update tweet status");
        throw new Error("Tweet ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        await updateTweetStatusApi(boardId, tweet_id, status, token);
        const updatedTweet = await fetchTweet(tweet_id);
        if (updatedTweet) {
          setTweets((prev) =>
            prev.map((tweet) => (tweet._id === tweet_id ? updatedTweet : tweet))
          );
          setTweet(updatedTweet);
        }
        return updatedTweet;
      } catch (err) {
        console.error("Error updating tweet status:", err);
        handleAuthError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, fetchTweet, handleAuthError]
  );

  return {
    tweets, // List of all tweets
    tweet, // Single tweet data
    comments, // List of comments for a tweet
    loading,
    error,
    fetchTweets, // Fetch all tweets for a board
    fetchTweet, // Fetch a single tweet
    createNewTweet, // Create a new tweet
    updateExistingTweet, // Update a tweet
    toggleLikeTweet, // Toggle like on a tweet
    deleteExistingTweet, // Delete a tweet
    fetchTweetComments, // Fetch comments for a tweet
    updateTweetStatus, // Update tweet status
  };
};