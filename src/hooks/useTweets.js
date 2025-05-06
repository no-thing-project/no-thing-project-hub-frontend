/**
 * @module useTweets
 * @description Custom React hook for managing tweet-related operations with optimistic updates and debouncing.
 */
import { useState, useCallback, useRef, useMemo } from "react";
import debounce from "lodash/debounce";
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
  pinTweetApi,
  unpinTweetApi,
  setReminderApi,
  shareTweetApi,
} from "../api/tweetsApi";
import { normalizeTweet } from "../utils/tweetUtils";

/**
 * Custom hook for managing tweets.
 * @param {string} token - Authentication token.
 * @param {string} boardId - UUID of the board.
 * @param {Object} currentUser - Current user data.
 * @param {Function} onLogout - Logout callback.
 * @param {Function} navigate - Navigation callback.
 * @returns {Object} Tweet management functions and state.
 */
export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastValidTweets = useRef([]);
  const abortControllerRef = useRef(new AbortController());

  /**
   * Handles authentication errors and navigation.
   * @param {Error} err - Error object.
   */
  const handleAuthError = useCallback(
    (err) => {
      if (err.name === "AbortError") return;
      if (err.status === 401 || err.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "An error occurred");
    },
    [onLogout, navigate]
  );

  /**
   * Wraps API calls with loading state management.
   * @param {Function} fn - API function to execute.
   * @returns {Promise}
   */
  const withLoading = useCallback(
    async (fn) => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Debounced API call wrapper to prevent rapid requests, returning a Promise.
   * @param {Function} fn - API function to debounce.
   * @returns {Function}
   */
  const debouncedApiCall = useCallback(
    (fn) => {
      const debouncedFn = debounce(
        (resolve, reject, ...args) => {
          fn(...args)
            .then(resolve)
            .catch(reject);
        },
        300,
        { leading: false, trailing: true }
      );
      return (...args) =>
        new Promise((resolve, reject) => {
          debouncedFn(resolve, reject, ...args);
        });
    },
    []
  );

  /**
   * Fetches all tweets for the board.
   * @param {Object} [options] - Query options.
   * @param {AbortSignal} [signal] - Abort signal.
   * @returns {Promise<Array>}
   */
  const fetchTweets = useCallback(
    debouncedApiCall(
      async (
        options = {
          status: "approved",
          page: 1,
          limit: 20,
          sort: "created_at:desc",
          pinned_only: false,
        },
        signal = abortControllerRef.current.signal
      ) => {
        if (!boardId) {
          setError("Board ID is required to fetch tweets");
          return [];
        }
        return withLoading(async () => {
          const data = await fetchTweetsApi(boardId, token, options, signal);
          const flattenTweets = (tweet, acc = []) => {
            acc.push(tweet);
            if (tweet.children?.length) {
              tweet.children.forEach((child) => flattenTweets(child, acc));
            }
            return acc;
          };
          const allTweets = data.tweets
            .flatMap((t) => flattenTweets(normalizeTweet(t, currentUser)))
            .filter((tweet, index) => {
              if (!tweet?.tweet_id || tweet.tweet_id === "") {
                console.warn(`Invalid tweet_id in fetched tweet at index ${index}:`, tweet);
                return false;
              }
              return true;
            });
          setTweets(allTweets);
          lastValidTweets.current = allTweets;
          setBoardInfo(data.board);
          setPagination(data.pagination);
          return allTweets;
        }).catch((err) => {
          handleAuthError(err);
          return lastValidTweets.current || [];
        });
      }
    ),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  /**
   * Fetches a single tweet by ID.
   * @param {string} tweetId - Tweet UUID.
   * @param {AbortSignal} [signal] - Abort signal.
   * @returns {Promise<Object|null>}
   */
  const fetchTweet = useCallback(
    debouncedApiCall(
      async (tweetId, signal = abortControllerRef.current.signal) => {
        if (!boardId || !tweetId) {
          setError("Board ID and Tweet ID are required to fetch tweet");
          return null;
        }
        return withLoading(async () => {
          const tweetData = await fetchTweetById(boardId, tweetId, token, signal);
          const normalizedTweet = normalizeTweet(tweetData, currentUser);
          if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
            console.warn("Invalid tweet_id in fetched tweet:", normalizedTweet);
            return null;
          }
          setTweet(normalizedTweet);
          return normalizedTweet;
        }).catch((err) => {
          handleAuthError(err);
          return null;
        });
      }
    ),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  /**
   * Creates a new tweet with optimistic updates and file uploads.
   * @param {Object|string} content - Tweet content.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {string|null} [parentTweetId=null] - Parent tweet UUID.
   * @param {boolean} [isAnonymous=false] - Anonymous status.
   * @param {string} [status="approved"] - Tweet status.
   * @param {string|null} [scheduledAt=null] - Scheduled time.
   * @param {Object} [access] - Access settings.
   * @param {Array<File>} [files=[]] - Files to upload.
   * @returns {Promise<Object|null>}
   */
  const createNewTweet = useCallback(
    async (
      content,
      x,
      y,
      parentTweetId = null,
      isAnonymous = false,
      status = "approved",
      scheduledAt = null,
      access,
      files = []
    ) => {
      if (!boardId) {
        setError("Board ID is required to create a tweet");
        return null;
      }
      // Validate content and position
      if (!content || (typeof content === "string" && content.trim() === "")) {
        setError("Content is required");
        return null;
      }
      if (typeof x !== "number" || isNaN(x) || typeof y !== "number" || isNaN(y)) {
        setError("Valid position (x, y) is required");
        return null;
      }
      const optimisticTweet = {
        tweet_id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        content: typeof content === "string" ? { type: "text", value: content } : content,
        position: { x, y },
        parent_tweet_id: parentTweetId,
        child_tweet_ids: [],
        is_anonymous: isAnonymous,
        anonymous_id: currentUser.anonymous_id,
        username: isAnonymous ? "Anonymous" : currentUser.username,
        created_at: new Date().toISOString(),
        liked_by: [],
        stats: { likes: 0, like_count: 0, view_count: 0 },
        status,
        scheduled_at: scheduledAt,
        access: access || { type: "board", allowed_users: [] },
        files: files.map((file) => ({
          url: URL.createObjectURL(file),
          fileKey: `temp-${file.name}`,
          contentType: file.type,
          size: file.size,
        })),
      };
      setTweets((prev) =>
        parentTweetId
          ? prev.map((t) =>
              t.tweet_id === parentTweetId
                ? { ...t, children: [...(t.children || []), normalizeTweet(optimisticTweet, currentUser)] }
                : t
            )
          : [normalizeTweet(optimisticTweet, currentUser), ...prev]
      );
      return withLoading(async () => {
        const createdTweet = await createTweetApi(
          boardId,
          content,
          x,
          y,
          parentTweetId,
          isAnonymous,
          status,
          scheduledAt,
          access,
          files,
          token
        );
        // Parse the data field if it exists and is a string
        let tweetData = createdTweet;
        if (createdTweet.data && typeof createdTweet.data === "string") {
          try {
            tweetData = {
              ...createdTweet,
              ...JSON.parse(createdTweet.data),
              data: undefined, // Remove the data field after parsing
            };
          } catch (parseError) {
            console.error("Failed to parse tweet data:", parseError, createdTweet.data);
            setError("Invalid tweet data received");
            throw parseError;
          }
        }
        // Ensure tweetData is an object
        if (!tweetData || typeof tweetData !== "object") {
          console.warn("Invalid tweet data received:", tweetData);
          setError("Invalid tweet data received");
          return null;
        }
        const normalizedTweet = normalizeTweet(
          { ...tweetData, position: tweetData.position || { x, y } },
          currentUser
        );
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in created tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => {
          if (parentTweetId) {
            return prev.map((t) =>
              t.tweet_id === parentTweetId
                ? { ...t, children: [...(t.children || []).filter((c) => c.tweet_id !== optimisticTweet.tweet_id), normalizedTweet] }
                : t
            );
          }
          return prev.map((t) => (t.tweet_id === optimisticTweet.tweet_id ? normalizedTweet : t));
        });
        lastValidTweets.current = tweets;
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          parentTweetId
            ? prev.map((t) =>
                t.tweet_id === parentTweetId
                  ? { ...t, children: (t.children || []).filter((c) => c.tweet_id !== optimisticTweet.tweet_id) }
                  : t
              )
            : prev.filter((t) => t.tweet_id !== optimisticTweet.tweet_id)
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Updates an existing tweet with optimistic updates and file uploads.
   * @param {string} tweetId - Tweet UUID.
   * @param {Object} updates - Fields to update.
   * @param {Array<File>} [files=[]] - Files to upload.
   * @returns {Promise<Object|null>}
   */
  const updateExistingTweet = useCallback(
    async (tweetId, updates, files = []) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update a tweet");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) =>
          t.tweet_id === tweetId
            ? {
                ...t,
                ...updates,
                content: updates.content
                  ? typeof updates.content === "string"
                    ? { type: "text", value: updates.content }
                    : updates.content
                  : t.content,
                files: files.length
                  ? [...(t.files || []), ...files.map((file) => ({
                      url: URL.createObjectURL(file),
                      fileKey: `temp-${file.name}`,
                      contentType: file.type,
                      size: file.size,
                    }))]
                  : t.files,
              }
            : t
        )
      );
      return withLoading(async () => {
        const updatedTweet = await updateTweetApi(boardId, tweetId, updates, files, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in updated tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(t, currentUser) : t)));
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Toggles like status for a tweet with optimistic updates.
   * @param {string} tweetId - Tweet UUID.
   * @param {boolean} isLiked - Current like status.
   * @returns {Promise<Object|null>}
   */
  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError("Tweet ID is required to toggle like");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) =>
          t.tweet_id === tweetId
            ? {
                ...t,
                liked_by: isLiked
                  ? t.liked_by.filter((l) => l.anonymous_id !== currentUser.anonymous_id)
                  : [...t.liked_by, { anonymous_id: currentUser.anonymous_id, username: currentUser.username }],
                stats: {
                  ...t.stats,
                  likes: isLiked ? t.stats.likes - 1 : t.stats.likes + 1,
                  like_count: isLiked ? t.stats.like_count - 1 : t.stats.like_count + 1,
                },
                is_liked: !isLiked,
              }
            : t
        )
      );
      return withLoading(async () => {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in liked tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  liked_by: isLiked
                    ? [...t.liked_by, { anonymous_id: currentUser.anonymous_id, username: currentUser.username }]
                    : t.liked_by.filter((l) => l.anonymous_id !== currentUser.anonymous_id),
                  stats: {
                    ...t.stats,
                    likes: isLiked ? t.stats.likes + 1 : t.stats.likes - 1,
                    like_count: isLiked ? t.stats.like_count + 1 : t.stats.like_count - 1,
                  },
                  is_liked: isLiked,
                }
              : t
          )
        );
        return null;
      });
    },
    [token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Deletes a tweet.
   * @param {string} tweetId - Tweet UUID.
   * @returns {Promise<void>}
   */
  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to delete a tweet");
        return;
      }
      setTweets((prev) => prev.filter((t) => t.tweet_id !== tweetId));
      return withLoading(async () => {
        await deleteTweetApi(boardId, tweetId, token);
        lastValidTweets.current = tweets;
        setTweet(null);
      }).catch((err) => {
        handleAuthError(err);
        setTweets(lastValidTweets.current);
      });
    },
    [boardId, token, handleAuthError, withLoading, tweets]
  );

  /**
   * Fetches comments for a tweet.
   * @param {string} tweetId - Tweet UUID.
   * @param {Object} [options] - Query options.
   * @param {AbortSignal} [signal] - Abort signal.
   * @returns {Promise<Array|null>}
   */
  const fetchTweetComments = useCallback(
    debouncedApiCall(
      async (
        tweetId,
        options = { page: 1, limit: 20, sort: "created_at:desc" },
        signal = abortControllerRef.current.signal
      ) => {
        if (!boardId || !tweetId) {
          setError("Board ID and Tweet ID are required to fetch comments");
          return null;
        }
        return withLoading(async () => {
          const data = await getTweetCommentsApi(boardId, tweetId, token, options, signal);
          const normalizedComments = data.comments
            .map((comment) => normalizeTweet(comment, currentUser))
            .filter((comment) => {
              if (!comment?.tweet_id || comment.tweet_id === "") {
                console.warn("Invalid tweet_id in comment:", comment);
                return false;
              }
              return true;
            });
          setComments(normalizedComments);
          setPagination(data.pagination);
          return normalizedComments;
        }).catch((err) => {
          handleAuthError(err);
          return null;
        });
      }
    ),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  /**
   * Updates tweet status.
   * @param {string} tweetId - Tweet UUID.
   * @param {string} status - New status.
   * @returns {Promise<Object|null>}
   */
  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to update tweet status");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, status } : t))
      );
      return withLoading(async () => {
        const updatedTweet = await updateTweetStatusApi(boardId, tweetId, status, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in status update:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets(lastValidTweets.current);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Moves a tweet to another board.
   * @param {string} tweetId - Tweet UUID.
   * @param {string} targetBoardId - Target board UUID.
   * @returns {Promise<Object|null>}
   */
  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!boardId || !tweetId || !targetBoardId) {
        setError("Board ID, Tweet ID, and Target Board ID are required to move a tweet");
        return null;
      }
      setTweets((prev) => prev.filter((t) => t.tweet_id !== tweetId));
      return withLoading(async () => {
        const updatedTweet = await moveTweetApi(tweetId, targetBoardId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in moved tweet:", normalizedTweet);
          return null;
        }
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets(lastValidTweets.current);
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Pins a tweet with optimistic updates.
   * @param {string} tweetId - Tweet UUID.
   * @returns {Promise<Object|null>}
   */
  const pinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to pin a tweet");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t))
      );
      return withLoading(async () => {
        const updatedTweet = await pinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in pinned tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t))
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Unpins a tweet with optimistic updates.
   * @param {string} tweetId - Tweet UUID.
   * @returns {Promise<Object|null>}
   */
  const unpinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to unpin a tweet");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t))
      );
      return withLoading(async () => {
        const updatedTweet = await unpinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in unpinned tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t))
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Sets a reminder for a tweet with optimistic updates.
   * @param {string} tweetId - Tweet UUID.
   * @param {Object} reminder - Reminder settings.
   * @returns {Promise<Object|null>}
   */
  const setReminder = useCallback(
    async (tweetId, reminder) => {
      if (!boardId || !tweetId) {
        setError("Board ID and Tweet ID are required to set a reminder");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) =>
          t.tweet_id === tweetId
            ? { ...t, reminder: { ...reminder, enabled: true } }
            : t
        )
      );
      return withLoading(async () => {
        const updatedTweet = await setReminderApi(boardId, tweetId, reminder, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in reminder tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, reminder: null } : t))
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Shares a tweet with optimistic updates.
   * @param {string} tweetId - Tweet UUID.
   * @param {string} sharedTo - Share destination.
   * @returns {Promise<Object|null>}
   */
  const shareTweet = useCallback(
    async (tweetId, sharedTo) => {
      if (!boardId || !tweetId || !sharedTo) {
        setError("Board ID, Tweet ID, and Shared To are required to share a tweet");
        return null;
      }
      setTweets((prev) =>
        prev.map((t) =>
          t.tweet_id === tweetId
            ? {
                ...t,
                shared: [...(t.shared || []), { shared_to: sharedTo, shared_at: new Date().toISOString() }],
              }
            : t
        )
      );
      return withLoading(async () => {
        const updatedTweet = await shareTweetApi(boardId, tweetId, sharedTo, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);
        if (!normalizedTweet?.tweet_id || normalizedTweet.tweet_id === "") {
          console.warn("Invalid tweet_id in shared tweet:", normalizedTweet);
          return null;
        }
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch((err) => {
        handleAuthError(err);
        setTweets((prev) =>
          prev.map((t) =>
            t.tweet_id === tweetId
              ? { ...t, shared: (t.shared || []).filter((s) => s.shared_to !== sharedTo) }
              : t
          )
        );
        return null;
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading, tweets]
  );

  /**
   * Cancels ongoing API requests.
   */
  const cancelRequests = useCallback(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
  }, []);

  /**
   * Derived state for pinned tweets.
   */
  const pinnedTweets = useMemo(() => tweets.filter((t) => t.is_pinned), [tweets]);

  return {
    tweets,
    tweet,
    comments,
    pagination,
    boardInfo,
    loading,
    error,
    pinnedTweets,
    fetchTweets,
    fetchTweet,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    fetchTweetComments,
    updateTweetStatus,
    moveTweet,
    pinTweet,
    unpinTweet,
    setReminder,
    shareTweet,
    cancelRequests,
  };
};

export default useTweets;