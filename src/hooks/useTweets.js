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
} from "../api/tweetsApi";
import { normalizeTweet } from "../utils/tweetUtils";

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }, signal) => {
      if (!boardId) {
        setError("Board ID is required to fetch tweets");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTweetsApi(boardId, token, options, signal);
        const normalizedTweets = data.tweets.map((tweet) => normalizeTweet(tweet, currentUser));
        setTweets(normalizedTweets);
        setBoardInfo(data.board);
        setPagination(data.pagination);
        return normalizedTweets;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  const fetchTweet = useCallback(
    async (tweetId, signal) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to fetch tweet");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const tweetData = await fetchTweetById(boardId, tweetId, token, signal);
        const normalizedTweet = normalizeTweet(tweetData, currentUser);
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  const createNewTweet = useCallback(
    async (content, x, y, parentTweetId = null, isAnonymous = false) => {
      if (!boardId) {
        setError("Board ID is required to create a tweet");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const createdTweet = await createTweetApi(boardId, content, x, y, parentTweetId, isAnonymous, token);
        const normalizedTweet = normalizeTweet(
          { ...createdTweet, position: createdTweet.position || { x, y } },
          currentUser
        );
        setTweets((prev) => [normalizedTweet, ...prev]);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update a tweet");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedTweet = await updateTweetApi(boardId, tweetId, updates, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError("Tweet ID is required to toggle like");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to delete a tweet");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteTweetApi(boardId, tweetId, token);
        setTweets((prev) => prev.filter((t) => t.tweet_id !== tweetId));
        setTweet(null);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, handleAuthError]
  );

  const fetchTweetComments = useCallback(
    async (tweetId, options = { page: 1, limit: 20 }, signal) => {
      if (!tweetId) {
        setError("Tweet ID is required to fetch comments");
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getTweetCommentsApi(tweetId, token, options, signal);
        const normalizedComments = data.comments.map((comment) => normalizeTweet(comment, currentUser));
        setComments(normalizedComments);
        setPagination(data.pagination);
        return normalizedComments;
      } catch (err) {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, handleAuthError]
  );

  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update tweet status");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedTweet = await updateTweetStatusApi(boardId, tweetId, status, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  return {
    tweets,
    tweet,
    comments,
    pagination,
    boardInfo,
    loading,
    error,
    fetchTweets,
    fetchTweet,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    fetchTweetComments,
    updateTweetStatus,
  };
};

export default useTweets;