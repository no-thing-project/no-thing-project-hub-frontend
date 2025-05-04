import { useState, useCallback, useRef } from "react";
import {
  fetchTweetsApi,
  fetchTweetById,
  createTweetApi,
  updateTweetApi,
  toggleLikeApi,
  deleteTweetApi,
  getTweetCommentsApi,
  updateTweetStatusApi,
  moveTweetApi,
} from "../api/tweetsApi";
import { normalizeTweet } from "../utils/tweetUtils";

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [comments, setComments] = useState(null);
  const [pagination, setPagination] = useState({});
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastValidTweets = useRef([]); // Track last valid tweets

  const handleAuthError = useCallback((err) => {
    if (err.name === "AbortError") return;
    if (err.status === 401 || err.status === 403) {
      onLogout("Session expired. Please log in again.");
      navigate("/login");
    }
    setError(err.message || "An error occurred");
  }, [onLogout, navigate]);

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
        console.log("Raw API tweets response:", data.tweets); // Debug log
        function flattenTweets(tweet, acc = []) {
          acc.push(tweet);
          if (tweet.children?.length) {
            tweet.children.forEach(child => flattenTweets(child, acc));
          }
          return acc;
        }
        const allTweets = data.tweets
          .flatMap(t => flattenTweets(normalizeTweet(t, currentUser)))
          .filter((tweet, index) => {
            if (!tweet?.tweet_id || tweet.tweet_id === '') {
              console.warn(`Invalid tweet_id in fetched tweet at index ${index}:`, tweet);
              return false;
            }
            return true;
          });
        console.log("Normalized and filtered tweets:", allTweets); // Debug log
        setTweets(allTweets);
        lastValidTweets.current = allTweets;
        setBoardInfo(data.board);
        setPagination(data.pagination);
        return allTweets;
      }).catch(err => {
        handleAuthError(err);
        return lastValidTweets.current || [];
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
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in fetched tweet:", normalizedTweet);
          return null;
        }
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const createNewTweet = useCallback(
    async (content, x, y, parentTweetId = null, isAnonymous = false, status = "approved", scheduledAt = null) => {
      if (!boardId) {
        setError("Board ID is required to create a tweet");
        return null;
      }
      const optimisticTweet = {
        tweet_id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, // More unique temp ID
        content: typeof content === "string" ? { type: "text", value: content } : content,
        position: { x, y },
        parent_tweet_id: parentTweetId,
        child_tweet_ids: [],
        is_anonymous: isAnonymous,
        anonymous_id: currentUser.anonymous_id,
        created_at: new Date().toISOString(),
        liked_by: [],
        stats: { likes: 0, like_count: 0 },
        status,
        scheduled_at: scheduledAt,
      };
      setTweets(prev => parentTweetId ? prev : [normalizeTweet(optimisticTweet, currentUser), ...prev]);
      return withLoading(async () => {
        const createdTweet = await createTweetApi(boardId, content, x, y, parentTweetId, isAnonymous, status, scheduledAt, token);
        const normalizedTweet = normalizeTweet({ ...createdTweet, position: createdTweet.position || { x, y } }, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in created tweet:", normalizedTweet);
          return null;
        }
        setTweets(prev => {
          if (parentTweetId) {
            return prev.map(t => t.tweet_id === parentTweetId ? { ...t, children: [...(t.children || []), normalizedTweet] } : t);
          }
          return prev.map(t => t.tweet_id === optimisticTweet.tweet_id ? normalizedTweet : t);
        });
        lastValidTweets.current = tweets; // Update last valid tweets
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        setTweets(prev => parentTweetId ? prev : prev.filter(t => t.tweet_id !== optimisticTweet.tweet_id));
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
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
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in updated tweet:", normalizedTweet);
          return null;
        }
        setTweets(prev => prev.map(t => t.tweet_id === tweetId ? normalizedTweet : t));
        lastValidTweets.current = tweets; // Update last valid tweets
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError("Tweet ID is required to toggle like");
        return null;
      }
      setTweets(prev => prev.map(t => t.tweet_id === tweetId ? {
        ...t,
        liked_by: isLiked ? t.liked_by.filter(l => l.anonymous_id !== currentUser.anonymous_id) : [...t.liked_by, { anonymous_id: currentUser.anonymous_id }],
        stats: { ...t.stats, likes: isLiked ? t.stats.likes - 1 : t.stats.likes + 1, like_count: isLiked ? t.stats.like_count - 1 : t.stats.like_count + 1 },
      } : t));
      return withLoading(async () => {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in liked tweet:", normalizedTweet);
          return null;
        }
        setTweets(prev => prev.map(t => t.tweet_id === tweetId ? normalizedTweet : t));
        lastValidTweets.current = tweets; // Update last valid tweets
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        setTweets(prev => prev.map(t => t.tweet_id === tweetId ? {
          ...t,
          liked_by: isLiked ? [...t.liked_by, { anonymous_id: currentUser.anonymous_id }] : t.liked_by.filter(l => l.anonymous_id !== currentUser.anonymous_id),
          stats: { ...t.stats, likes: isLiked ? t.stats.likes + 1 : t.stats.likes - 1, like_count: isLiked ? t.stats.like_count + 1 : t.stats.like_count - 1 },
        } : t));
        return null;
      });
    },
    [token, currentUser, handleAuthError, withLoading, tweets]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to delete a tweet");
        return;
      }
      return withLoading(async () => {
        await deleteTweetApi(boardId, tweetId, token);
        setTweets(prev => prev.filter(t => t.tweet_id !== tweetId));
        lastValidTweets.current = tweets; // Update last valid tweets
        setTweet(null);
      }).catch(err => handleAuthError(err));
    },
    [boardId, token, handleAuthError, withLoading, tweets]
  );

  const fetchTweetComments = useCallback(
    async (tweetId, signal) => {
      if (!tweetId) {
        setError("Tweet ID is required to fetch comments");
        return null;
      }
      return withLoading(async () => {
        const data = await getTweetCommentsApi(tweetId, token, signal);
        const normalizedComments = normalizeTweet(data, currentUser);
        if (!normalizedComments?.tweet_id || normalizedComments.tweet_id === '') {
          console.warn("Invalid tweet_id in comments:", normalizedComments);
          return null;
        }
        setComments(normalizedComments);
        return normalizedComments;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    },
    [token, currentUser, handleAuthError, withLoading]
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
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in status update:", normalizedTweet);
          return null;
        }
        setTweets(prev => prev.map(t => t.tweet_id === tweetId ? normalizedTweet : t));
        lastValidTweets.current = tweets; // Update last valid tweets
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!boardId || !tweetId || !targetBoardId) {
        setError("Board ID, Tweet ID, and Target Board ID are required to move a tweet");
        return null;
      }
      return withLoading(async () => {
        const updatedTweet = await moveTweetApi(tweetId, targetBoardId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === '') {
          console.warn("Invalid tweet_id in moved tweet:", normalizedTweet);
          return null;
        }
        setTweets(prev => prev.filter(t => t.tweet_id !== tweetId));
        lastValidTweets.current = tweets; // Update last valid tweets
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
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
    moveTweet,
  };
};

export default useTweets;