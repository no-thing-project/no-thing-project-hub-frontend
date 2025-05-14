import { useState, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
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
} from '../api/tweetsApi';
import { uploadFiles } from '../api/mediaApi';
import { normalizeTweet } from '../utils/tweetUtils';

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

  const handleAuthError = useCallback(
    err => {
      if (err.name === 'AbortError') return;
      if (err.status === 401 || err.status === 403) {
        onLogout('Session expired. Please log in again.');
        navigate('/login');
      }
      setError(err.message || 'An error occurred');
    },
    [onLogout, navigate]
  );

  const withLoading = useCallback(
    async fn => {
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

  const debouncedApiCall = useCallback(
    fn => {
      const debouncedFn = debounce(
        (resolve, reject, ...args) => {
          fn(...args).then(resolve).catch(reject);
        },
        300,
        { leading: false, trailing: true }
      );
      return (...args) => new Promise((resolve, reject) => debouncedFn(resolve, reject, ...args));
    },
    []
  );

  const fetchTweets = useCallback(
    debouncedApiCall(
      async (options = {}, signal = abortControllerRef.current.signal) => {
        if (!boardId) {
          setError('Board ID is required to fetch tweets');
          return [];
        }
        return withLoading(async () => {
          const data = await fetchTweetsApi(boardId, token, options, signal);
          const flattenTweets = (tweet, acc = []) => {
            const normalized = normalizeTweet(tweet, currentUser);
            if (normalized.tweet_id) acc.push(normalized);
            if (tweet.children?.length) {
              tweet.children.forEach(child => flattenTweets(child, acc));
            }
            return acc;
          };
          const allTweets = data.tweets.flatMap(t => flattenTweets(t));
          setTweets(allTweets);
          lastValidTweets.current = allTweets;
          setBoardInfo(data.board);
          setPagination(data.pagination);
          return allTweets;
        }).catch(err => {
          handleAuthError(err);
          return lastValidTweets.current;
        });
      }
    ),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const fetchTweet = useCallback(
    debouncedApiCall(async (tweetId, signal = abortControllerRef.current.signal) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }
      return withLoading(async () => {
        const tweetData = await fetchTweetById(boardId, tweetId, token, signal);
        const normalizedTweet = normalizeTweet(tweetData, currentUser);
        if (!normalizedTweet.tweet_id) {
          setError('Invalid tweet ID');
          return null;
        }
        setTweet(normalizedTweet);
        return normalizedTweet;
      }).catch(err => {
        handleAuthError(err);
        return null;
      });
    }),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const createNewTweet = useCallback(
    async (
      content,
      x,
      y,
      parentTweetId = null,
      isAnonymous = false,
      status = 'approved',
      scheduledAt = null,
      reminder = null,
      files = [],
      onProgress
    ) => {
      // Validate inputs
      if (!boardId) {
        setError('Board ID is required');
        return null;
      }
      if (isNaN(x) || isNaN(y)) {
        setError('Valid position is required');
        return null;
      }
      if (!content?.value && !files.length) {
        setError('Tweet must have text or files');
        return null;
      }
  
      // Construct content object
      const contentObj = {
        type: files.length ? files[0].type.split('/')[0] : (content.type || 'text'),
        value: content.value || '',
        metadata: {
          files: [],
          ...(content.metadata?.hashtags?.length && { hashtags: content.metadata.hashtags }),
          ...(content.metadata?.mentions?.length && { mentions: content.metadata.mentions }),
        },
      };
  
      // Create optimistic tweet
      const optimisticTweet = {
        tweet_id: `temp-${Date.now()}`,
        content: contentObj,
        position: { x, y },
        parent_tweet_id: parentTweetId,
        child_tweet_ids: [],
        is_anonymous: isAnonymous,
        anonymous_id: currentUser.anonymous_id,
        username: isAnonymous ? 'Anonymous' : currentUser.username,
        created_at: new Date().toISOString(),
        liked_by: [],
        stats: { likes: 0, like_count: 0, view_count: 0 },
        status,
        scheduled_at: scheduledAt,
        reminder: reminder?.schedule ? reminder : null,
        is_pinned: false,
      };
  
      // Optimistic update
      setTweets(prev => {
        const normalizedOptimistic = normalizeTweet(optimisticTweet, currentUser);
        if (parentTweetId) {
          return prev.map(t =>
            t.tweet_id === parentTweetId
              ? {
                  ...t,
                  child_tweet_ids: [...(t.child_tweet_ids || []), optimisticTweet.tweet_id],
                  children: [...(t.children || []), normalizedOptimistic],
                }
              : t
          );
        }
        return [normalizedOptimistic, ...prev];
      });
  
      try {
        // Upload files if present
        const uploadedFiles = files.length
          ? await uploadFiles(files, token, onProgress)
          : [];
  
        // Final content with uploaded files
        const finalContent = {
          ...contentObj,
          type: uploadedFiles.length
            ? uploadedFiles[0].contentType.split('/')[0]
            : contentObj.type,
          metadata: {
            ...contentObj.metadata,
            files: uploadedFiles,
          },
        };
  
        // Create tweet via API
        const createdTweet = await createTweetApi(
          boardId,
          finalContent,
          x,
          y,
          parentTweetId,
          isAnonymous,
          currentUser.anonymous_id,
          status,
          scheduledAt,
          reminder?.schedule ? reminder : null,
          uploadedFiles,
          token
        );
  
        // Normalize and validate response
        const normalizedTweet = normalizeTweet(
          { ...createdTweet, position: createdTweet.position || { x, y } },
          currentUser
        );
  
        if (!normalizedTweet.tweet_id) {
          throw new Error('Invalid tweet ID from server');
        }
  
        // Replace optimistic tweet
        setTweets(prev => {
          if (parentTweetId) {
            return prev.map(t =>
              t.tweet_id === parentTweetId
                ? {
                    ...t,
                    child_tweet_ids: [
                      ...(t.child_tweet_ids || []).filter(id => id !== optimisticTweet.tweet_id),
                      normalizedTweet.tweet_id,
                    ],
                    children: [
                      ...(t.children || []).filter(c => c.tweet_id !== optimisticTweet.tweet_id),
                      normalizedTweet,
                    ],
                  }
                : t
            );
          }
          return prev.map(t =>
            t.tweet_id === optimisticTweet.tweet_id ? normalizedTweet : t
          );
        });
  
        lastValidTweets.current = tweets;
        return normalizedTweet;
      } catch (err) {
        // Rollback optimistic update
        setTweets(prev => {
          if (parentTweetId) {
            return prev.map(t =>
              t.tweet_id === parentTweetId
                ? {
                    ...t,
                    child_tweet_ids: (t.child_tweet_ids || []).filter(id => id !== optimisticTweet.tweet_id),
                    children: (t.children || []).filter(c => c.tweet_id !== optimisticTweet.tweet_id),
                  }
                : t
            );
          }
          return prev.filter(t => t.tweet_id !== optimisticTweet.tweet_id);
        });
  
        handleAuthError(err);
        setError(err.message || 'Failed to create tweet');
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates, files = [], onProgress) => {
      // Validate inputs
      if (!boardId) {
        setError('Board ID is required');
        return null;
      }
      if (!tweetId) {
        setError('Tweet ID is required');
        return null;
      }
      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }
      if (!updates || Object.keys(updates).length === 0) {
        setError('At least one update field is required');
        return null;
      }
      if (updates.content && !updates.content.value && !files.length) {
        setError('Content must have text or files');
        return null;
      }
      if (updates.position && (isNaN(updates.position.x) || isNaN(updates.position.y))) {
        setError('Valid position is required');
        return null;
      }
  
      // Construct optimistic content object
      const contentObj = updates.content
        ? {
            type: files.length
              ? files[0].type.split('/')[0]
              : (updates.content.type || currentTweet.content.type || 'text'),
            value: typeof updates.content === 'string' ? updates.content : (updates.content.value || ''),
            metadata: {
              files: currentTweet.content.metadata.files || [],
              hashtags: updates.content.metadata?.hashtags || currentTweet.content.metadata.hashtags || [],
              mentions: updates.content.metadata?.mentions || currentTweet.content.metadata.mentions || [],
              ...(updates.content.metadata?.style && { style: updates.content.metadata.style }),
              ...(updates.content.metadata?.poll_options && { poll_options: updates.content.metadata.poll_options }),
              ...(updates.content.metadata?.event_details && { event_details: updates.content.metadata.event_details }),
              ...(updates.content.metadata?.quote_ref && { quote_ref: updates.content.metadata.quote_ref }),
              ...(updates.content.metadata?.embed_data && { embed_data: updates.content.metadata.embed_data }),
            },
          }
        : currentTweet.content;
  
      // Create optimistic tweet
      const optimisticTweet = {
        ...currentTweet,
        ...updates,
        content: contentObj,
        position: updates.position || currentTweet.position,
        status: updates.status || currentTweet.status,
        scheduled_at: updates.scheduled_at !== undefined ? updates.scheduled_at : currentTweet.scheduled_at,
        reminder: updates.reminder || currentTweet.reminder,
        updated_at: new Date().toISOString(),
      };
  
      // Optimistic update
      setTweets(prev => {
        const normalizedOptimistic = normalizeTweet(optimisticTweet, currentUser);
        return prev.map(t => (t.tweet_id === tweetId ? normalizedOptimistic : t));
      });
  
      try {
        // Upload files if present
        const uploadedFiles = files.length ? await uploadFiles(files, token, onProgress) : [];
  
        // Construct final updates
        const finalUpdates = {
          ...updates,
          content: updates.content
            ? {
                ...contentObj,
                type: uploadedFiles.length
                  ? uploadedFiles[0].contentType.split('/')[0]
                  : contentObj.type,
                metadata: {
                  ...contentObj.metadata,
                  files: uploadedFiles.length
                    ? uploadedFiles // Replace files with uploaded ones
                    : contentObj.metadata.files,
                },
              }
            : undefined,
          position: updates.position ? { x: updates.position.x, y: updates.position.y } : undefined,
          status: updates.status,
          scheduled_at: updates.scheduled_at !== undefined ? updates.scheduled_at : undefined,
          reminder: updates.reminder ? { ...updates.reminder, enabled: !!updates.reminder.schedule } : undefined,
        };
  
        // Remove undefined fields to satisfy updateTweetBodySchema
        Object.keys(finalUpdates).forEach(key => finalUpdates[key] === undefined && delete finalUpdates[key]);
  
        // Call updateTweetApi
        const updatedTweet = await updateTweetApi(boardId, tweetId, finalUpdates, token);
  
        // Normalize and validate response
        const normalizedTweet = normalizeTweet(
          { ...updatedTweet, position: updatedTweet.position || currentTweet.position },
          currentUser
        );
  
        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to update tweet: Invalid tweet ID');
        }
  
        // Update state with normalized tweet
        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        // Rollback optimistic update
        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t)));
        handleAuthError(err);
        setError(err.message || 'Failed to update tweet');
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets, setTweet]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError('Tweet ID is required');
        return null;
      }

      setTweets(prev =>
        prev.map(t =>
          t.tweet_id === tweetId
            ? {
                ...t,
                liked_by: isLiked
                  ? t.liked_by.filter(l => l.anonymous_id !== currentUser.anonymous_id)
                  : [...t.liked_by, { anonymous_id: currentUser.anonymous_id, username: currentUser.username }],
                stats: {
                  ...t.stats,
                  likes: isLiked ? t.stats.likes - 1 : t.stats.likes + 1,
                  like_count: isLiked ? t.stats.like_count - 1 : t.stats.like_count + 1,
                },
                likedByUser: !isLiked,
              }
            : t
        )
      );

      try {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to toggle like: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  liked_by: isLiked
                    ? [...t.liked_by, { anonymous_id: currentUser.anonymous_id, username: currentUser.username }]
                    : t.liked_by.filter(l => l.anonymous_id !== currentUser.anonymous_id),
                  stats: {
                    ...t.stats,
                    likes: isLiked ? t.stats.likes + 1 : t.stats.likes - 1,
                    like_count: isLiked ? t.stats.like_count + 1 : t.stats.like_count - 1,
                  },
                  likedByUser: isLiked,
                }
              : t
          )
        );
        return null;
      }
    },
    [token, currentUser, handleAuthError, tweets]
  );

  const deleteExistingTweet = useCallback(
    async tweetId => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return;
      }

      const deletedTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev => prev.filter(t => t.tweet_id !== tweetId));

      try {
        await deleteTweetApi(boardId, tweetId, token);
        lastValidTweets.current = tweets;
        setTweet(null);
      } catch (err) {
        handleAuthError(err);
        if (deletedTweet) setTweets(prev => [...prev, deletedTweet]);
      }
    },
    [boardId, token, handleAuthError, tweets]
  );

  const fetchTweetComments = useCallback(
    debouncedApiCall(
      async (tweetId, options = {}, signal = abortControllerRef.current.signal) => {
        if (!boardId || !tweetId) {
          setError('Board ID and Tweet ID are required');
          return null;
        }
        return withLoading(async () => {
          const data = await getTweetCommentsApi(boardId, tweetId, token, options, signal);
          const normalizedComments = data.comments
            .map(c => normalizeTweet(c, currentUser))
            .filter(c => c.tweet_id);
          setComments(normalizedComments);
          setPagination(data.pagination);
          return normalizedComments;
        }).catch(err => {
          handleAuthError(err);
          return null;
        });
      }
    ),
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }
      const validStatuses = ['pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived'];
      if (!validStatuses.includes(status)) {
        setError(`Invalid status: ${status}`);
        return null;
      }

      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? { ...t, status } : t)));

      try {
        const updatedTweet = await updateTweetStatusApi(boardId, tweetId, status, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to update status: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
        );
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!boardId || !tweetId || !targetBoardId) {
        setError('Board ID, Tweet ID, and Target Board ID are required');
        return null;
      }

      const movedTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev => prev.filter(t => t.tweet_id !== tweetId));

      try {
        const updatedTweet = await moveTweetApi(tweetId, targetBoardId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to move tweet: Invalid tweet ID');
        }

        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        if (movedTweet) setTweets(prev => [...prev, movedTweet]);
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const pinTweet = useCallback(
    async tweetId => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t)));

      try {
        const updatedTweet = await pinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to pin tweet: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
        );
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const unpinTweet = useCallback(
    async tweetId => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t)));

      try {
        const updatedTweet = await unpinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to unpin tweet: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
        );
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const setReminder = useCallback(
    async (tweetId, reminder) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev =>
        prev.map(t =>
          t.tweet_id === tweetId ? { ...t, reminder: { ...reminder, enabled: true } } : t
        )
      );

      try {
        const updatedTweet = await setReminderApi(boardId, tweetId, reminder, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to set reminder: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
        );
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const shareTweet = useCallback(
    async (tweetId, sharedTo) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find(t => t.tweet_id === tweetId);
      setTweets(prev =>
        prev.map(t =>
          t.tweet_id === tweetId
            ? { ...t, shared: [...(t.shared || []), { platform: sharedTo, timestamp: new Date().toISOString() }] }
            : t
        )
      );

      try {
        const sharedTweet = await shareTweetApi(boardId, tweetId, sharedTo, token);
        const normalizedTweet = normalizeTweet(sharedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to share tweet: Invalid tweet ID');
        }

        setTweets(prev => prev.map(t => (t.tweet_id === tweetId ? normalizedTweet : t)));
        lastValidTweets.current = tweets;
        setTweet(normalizedTweet);
        return normalizedTweet;
      } catch (err) {
        handleAuthError(err);
        setTweets(prev =>
          prev.map(t => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
        );
        return null;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const pinnedTweets = useMemo(() => tweets.filter(t => t.is_pinned), [tweets]);

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
  };
};