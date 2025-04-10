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

  const withLoading = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTweets = useCallback(
    async (options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }, signal) => {
      if (!boardId) {
        setError("Board ID is required to fetch tweets");
        return [];
      }
      return withLoading(async () => {
        const data = await fetchTweetsApi(boardId, token, options, signal);
        const normalizedTweets = data.tweets.map((tweet) => normalizeTweet(tweet, currentUser));
        setTweets(normalizedTweets);
        setBoardInfo(data.board);
        setPagination(data.pagination);
        return normalizedTweets;
      }).catch((err) => {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const fetchTweet = useCallback(
    async (tweetId, signal) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to fetch tweet");
        return null;
      }
      return withLoading(async () => {
        const tweetData = await fetchTweetById(boardId, tweetId, token, signal);
        const normalizedTweet = normalizeTweet(tweetData, currentUser);
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        if (err.name !== "AbortError") handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const createNewTweet = useCallback(
    async (content, x, y, parentTweetId = null, isAnonymous = false) => {
      if (!boardId) {
        setError("Board ID is required to create a tweet");
        return null;
      }
      const optimisticTweet = {
        tweet_id: `temp-${Date.now()}`,
        content: { type: "text", value: content },
        position: { x, y },
        parent_tweet_id: parentTweetId,
        is_anonymous: isAnonymous,
        creator_id: currentUser.anonymous_id,
        created_at: new Date().toISOString(),
        likes: [],
        like_count: 0,
      };
      setTweets((prev) => [normalizeTweet(optimisticTweet, currentUser), ...prev]);
      return withLoading(async () => {
        const createdTweet = await createTweetApi(boardId, content, x, y, parentTweetId, isAnonymous, token);
        const normalizedTweet = normalizeTweet(
          { ...createdTweet, position: createdTweet.position || { x, y } },
          currentUser
        );
        setTweets((prev) => prev.map((t) => (t.tweet_id === optimisticTweet.tweet_id ? normalizedTweet : t)));
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) => prev.filter((t) => t.tweet_id !== optimisticTweet.tweet_id));
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update a tweet");
        return null;
      }
      return withLoading(async () => {
        const updatedTweet = await updateTweetApi(boardId, tweetId, updates, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to toggle like");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) =>
          t.tweet_id === tweetId
            ? {
                ...t,
                likes: isLiked
                  ? t.likes.filter((l) => l.anonymous_id !== currentUser.anonymous_id)
                  : [...t.likes, { anonymous_id: currentUser.anonymous_id }],
                like_count: isLiked ? t.like_count - 1 : t.like_count + 1,
              }
            : t
        )
      );
      return withLoading(async () => {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  likes: isLiked
                    ? [...t.likes, { anonymous_id: currentUser.anonymous_id }]
                    : t.likes.filter((l) => l.anonymous_id !== currentUser.anonymous_id),
                  like_count: isLiked ? t.like_count + 1 : t.like_count - 1,
                }
              : t
          )
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to delete a tweet");
        return;
      }
      return withLoading(async () => {
        await deleteTweetApi(boardId, tweetId, token);
        setTweets((prev) => prev.filter((t) => t.tweet_id !== tweetId));
        setTweet(null);
      }).catch((err) => {
        handleAuthError(err);
      });
    },
    [boardId, token, handleAuthError, withLoading]
  );

  const fetchTweetComments = useCallback(
    async (tweetId, options = { page: 1, limit: 20 }, signal) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to fetch comments");
        return [];
      }
      return withLoading(async () => {
        const data = await getTweetCommentsApi(tweetId, token, options, signal);
        const normalizedComments = data.comments.map((comment) => normalizeTweet(comment, currentUser));
        setComments(normalizedComments);
        setPagination(data.pagination);
        return normalizedComments;
      }).catch((err) => {
        if (err.name !== "AbortError") handleAuthError(err);
        return [];
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update tweet status");
        return null;
      }
      return withLoading(async () => {
        const updatedTweet = await updateTweetStatusApi(boardId, tweetId, status, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
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