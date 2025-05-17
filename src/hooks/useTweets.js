import { useState, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash/debounce';
import ReactDOM from 'react-dom';
import {
  fetchTweetsApi,
  fetchTweetById,
  createTweetApi,
  updateTweetApi,
  toggleLikeApi,
  deleteTweetApi,
  updateTweetStatusApi,
  moveTweetApi,
  pinTweetApi,
  unpinTweetApi,
  setReminderApi,
  shareTweetApi,
  generatePresignedUrlApi,
} from '../api/tweetsApi';
import { normalizeTweet } from '../utils/tweetUtils';

const CACHE_TTL = 5 * 60 * 1000;
const CACHE_VERSION = 'v1';
const tweetCache = new Map();

const getCacheKey = (endpoint, params) => `${CACHE_VERSION}:${endpoint}:${JSON.stringify(params)}`;

const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, { expiry }] of tweetCache.entries()) {
    if (now > expiry) tweetCache.delete(key);
  }
};

const invalidateCache = (prefix) => {
  for (const key of tweetCache.keys()) {
    if (key.startsWith(`${CACHE_VERSION}:${prefix}`)) tweetCache.delete(key);
  }
};

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastValidTweets = useRef([]);

  const handleAuthError = useCallback((err) => {
    if (err.name === 'AbortError') return;
    ReactDOM.unstable_batchedUpdates(() => {
      if (err.status === 401 || err.status === 403) {
        onLogout('Session expired. Please log in again.');
        navigate('/login');
        setError('Unauthorized access. Please log in.');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    });
  }, [onLogout, navigate]);

  const withLoading = useMemo(
    () => async (fn) => {
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

  const uploadFileToS3 = useCallback(
    async (file, token, onProgress) => {
      try {
        const contentType = file.type.split('/')[0];
        const { presignedUrl, fileKey, contentType: fileContentType } = await generatePresignedUrlApi(
          file.type,
          contentType,
          token
        );

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress?.(percent);
          }
        };

        return new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve({
                fileKey,
                contentType: fileContentType,
                size: file.size,
                url: presignedUrl.split('?')[0],
              });
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(file);
        });
      } catch (err) {
        throw new Error(`Failed to upload file: ${err.message}`);
      }
    },
    []
  );

  const fetchTweets = useCallback(
    async (options = {}, signal) => {
      if (!boardId) {
        setError('Board ID is required to fetch tweets');
        return [];
      }

      const cacheKey = getCacheKey(`tweets:${boardId}`, options);
      clearExpiredCache();

      const cached = tweetCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        ReactDOM.unstable_batchedUpdates(() => {
          setTweets(cached.data.tweets);
          lastValidTweets.current = cached.data.tweets;
          setBoardInfo(cached.data.board);
          setPagination({
            page: cached.data.pagination.page,
            limit: cached.data.pagination.limit,
            total: cached.data.pagination.total,
          });
        });
        return cached.data.tweets;
      }

      return withLoading(async () => {
        try {
          const data = await fetchTweetsApi(boardId, token, { ...options, limit: options.limit || 20, include_parents: true }, signal);
          const normalizedTweets = data.tweets.map((tweet) => ({
            ...normalizeTweet(tweet, currentUser),
            children: tweet.children?.map((child) => normalizeTweet(child, currentUser)) || [],
          }));

          tweetCache.set(cacheKey, {
            data: { ...data, tweets: normalizedTweets },
            expiry: Date.now() + CACHE_TTL,
          });

          ReactDOM.unstable_batchedUpdates(() => {
            setTweets(normalizedTweets);
            lastValidTweets.current = normalizedTweets;
            setBoardInfo(data.board);
            setPagination({
              page: data.pagination.page,
              limit: data.pagination.limit,
              total: data.pagination.total,
            });
          });
          return normalizedTweets;
        } catch (err) {
          handleAuthError(err);
          return lastValidTweets.current;
        }
      });
    },
    [boardId, token, currentUser, handleAuthError, withLoading]
  );

  const fetchTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const cacheKey = getCacheKey(`tweet:${boardId}:${tweetId}`, {});
      clearExpiredCache();

      const cached = tweetCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        setTweet(cached.data);
        return cached.data;
      }

      return withLoading(async () => {
        const controller = new AbortController();
        try {
          const data = await fetchTweetById(boardId, tweetId, token, controller.signal);
          const normalizedTweet = normalizeTweet(data.tweets?.[0], currentUser);
          if (!normalizedTweet.tweet_id) {
            setError('Invalid tweet ID');
            return null;
          }

          tweetCache.set(cacheKey, {
            data: normalizedTweet,
            expiry: Date.now() + CACHE_TTL,
          });

          setTweet(normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          handleAuthError(err);
          return null;
        } finally {
          controller.abort();
        }
      });
    },
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

      const contentObj = {
        type: files.length ? files[0].type?.split('/')[0] || 'image' : content.type || 'text',
        value: content.value || '',
        metadata: {
          files: [],
          hashtags: content.metadata?.hashtags || [],
          mentions: content.metadata?.mentions || [],
          style: content.metadata?.style || {},
          poll_options: content.metadata?.poll_options || [],
          event_details: content.metadata?.event_details || {},
          quote_ref: content.metadata?.quote_ref || null,
          embed_data: content.metadata?.embed_data || null,
        },
      };

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
        stats: { like_count: 0, view_count: 0, comment_count: 0, share_count: 0 },
        status,
        scheduled_at: scheduledAt,
        reminder: reminder?.schedule ? reminder : null,
        is_pinned: false,
        children: [],
      };

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) => {
          const normalizedOptimistic = normalizeTweet(optimisticTweet, currentUser);
          if (parentTweetId) {
            return prev.map((t) =>
              t.tweet_id === parentTweetId
                ? {
                    ...t,
                    child_tweet_ids: [...(t.child_tweet_ids || []), optimisticTweet.tweet_id],
                    children: [...(t.children || []), normalizedOptimistic],
                    stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
                  }
                : t
            );
          }
          return [normalizedOptimistic, ...prev];
        });
      });

      try {
        const uploadedFiles = await Promise.all(
          files.map((file) => uploadFileToS3(file, token, (progress) => onProgress?.(progress / files.length)))
        );

        const finalContent = {
          ...contentObj,
          type: uploadedFiles.length ? uploadedFiles[0].contentType.split('/')[0] : contentObj.type,
          metadata: {
            ...contentObj.metadata,
            files: uploadedFiles,
          },
        };

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

        const normalizedTweet = normalizeTweet(
          { ...createdTweet, position: createdTweet.position || { x, y } },
          currentUser
        );

        if (!normalizedTweet.tweet_id) {
          throw new Error('Invalid tweet ID from server');
        }

        invalidateCache(`tweets:${boardId}:${parentTweetId || ''}`); // Specific invalidation

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => {
            if (parentTweetId) {
              return prev.map((t) =>
                t.tweet_id === parentTweetId
                  ? {
                      ...t,
                      child_tweet_ids: [
                        ...(t.child_tweet_ids || []).filter((id) => id !== optimisticTweet.tweet_id),
                        normalizedTweet.tweet_id,
                      ],
                      children: [
                        ...(t.children || []).filter((c) => c.tweet_id !== optimisticTweet.tweet_id),
                        normalizedTweet,
                      ],
                      stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
                    }
                  : prev.find((p) => p.tweet_id === optimisticTweet.tweet_id)
                    ? prev.filter((p) => p.tweet_id !== optimisticTweet.tweet_id)
                    : t
              );
            }
            return [
              normalizedTweet,
              ...prev.filter((t) => t.tweet_id !== optimisticTweet.tweet_id),
            ];
          });
          lastValidTweets.current = tweets;
          setPagination((prev) => ({
            ...prev,
            total: prev.total + 1,
          }));
        });

        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => {
            if (parentTweetId) {
              return prev.map((t) =>
                t.tweet_id === parentTweetId
                  ? {
                      ...t,
                      child_tweet_ids: (t.child_tweet_ids || []).filter(
                        (id) => id !== optimisticTweet.tweet_id
                      ),
                      children: (t.children || []).filter(
                        (c) => c.tweet_id !== optimisticTweet.tweet_id
                      ),
                      stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) - 1 },
                    }
                  : t
              );
            }
            return prev.filter((t) => t.tweet_id !== optimisticTweet.tweet_id);
          });
          handleAuthError(err);
          setError(err.message || 'Failed to create tweet');
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, uploadFileToS3, tweets]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates, files = [], onProgress) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }
      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }
      if (!updates || Object.keys(updates).length === 0) {
        setError('At least one update field is required');
        return null;
      }
      if (updates.content && !updates.content.value && !files.length && !currentTweet.content.metadata.files.length) {
        setError('Content must have text or files');
        return null;
      }
      if (updates.position && (isNaN(updates.position.x) || isNaN(updates.position.y))) {
        setError('Valid position is required');
        return null;
      }

      const contentObj = updates.content
        ? {
            type: files.length
              ? files[0].type?.split('/')[0] || 'image'
              : updates.content.type || currentTweet.content.type || 'text',
            value: updates.content.value || '',
            metadata: {
              files: currentTweet.content.metadata.files || [],
              hashtags: updates.content.metadata?.hashtags || currentTweet.content.metadata.hashtags || [],
              mentions: updates.content.metadata?.mentions || currentTweet.content.metadata.mentions || [],
              style: updates.content.metadata?.style || currentTweet.content.metadata.style || [],
              poll_options: updates.content.metadata?.poll_options || currentTweet.content.metadata.poll_options || [],
              event_details:
                updates.content.metadata?.event_details || currentTweet.content.metadata.event_details || {},
              quote_ref: updates.content.metadata?.quote_ref || currentTweet.content.metadata.quote_ref || null,
              embed_data: updates.content.metadata?.embed_data || currentTweet.content.metadata.embed_data || null,
            },
          }
        : currentTweet.content;

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

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) => {
          const normalizedOptimistic = normalizeTweet(optimisticTweet, currentUser);
          return prev.map((t) => (t.tweet_id === tweetId ? normalizedOptimistic : t));
        });
      });

      try {
        const uploadedFiles = await Promise.all(
          files.map((file) => uploadFileToS3(file, token, (progress) => onProgress?.(progress / files.length)))
        );

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
                  files: [...contentObj.metadata.files, ...uploadedFiles],
                },
              }
            : undefined,
          position: updates.position ? { x: updates.position.x, y: updates.position.y } : undefined,
          status: updates.status,
          scheduled_at: updates.scheduled_at !== undefined ? updates.scheduled_at : undefined,
          reminder: updates.reminder
            ? { ...updates.reminder, enabled: !!updates.reminder.schedule }
            : undefined,
        };

        Object.keys(finalUpdates).forEach((key) => finalUpdates[key] === undefined && delete finalUpdates[key]);

        const updatedTweet = await updateTweetApi(boardId, tweetId, finalUpdates, token);

        const normalizedTweet = normalizeTweet(
          { ...updatedTweet, position: updatedTweet.position || currentTweet.position },
          currentUser
        );

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to update tweet: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });

        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
          );
          handleAuthError(err);
          setError(err.message || 'Failed to update tweet');
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets, uploadFileToS3]
  );

  const updateTweetStatus = useCallback(
    async (tweetId, status) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }
      const validStatuses = ['pending', 'approved', 'rejected', 'announcement', 'reminder', 'pinned', 'archived'];
      if (!validStatuses.includes(status)) {
        setError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
        return null;
      }

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      return withLoading(async () => {
        const optimisticTweet = normalizeTweet({ ...currentTweet, status }, currentUser);
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? optimisticTweet : t)));

        try {
          const updatedTweet = await updateTweetStatusApi(boardId, tweetId, status, token);
          const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to update status: Invalid tweet ID');
          }

          invalidateCache(`tweet:${boardId}:${tweetId}`);

          ReactDOM.unstable_batchedUpdates(() => {
            setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
            lastValidTweets.current = tweets;
            setTweet(normalizedTweet);
          });
          return normalizedTweet;
        } catch (err) {
          ReactDOM.unstable_batchedUpdates(() => {
            handleAuthError(err);
            setTweets((prev) =>
              prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
            );
            setError(err.message || 'Failed to update tweet status');
          });
          throw err;
        }
      });
    },
    [boardId, token, currentUser, handleAuthError, tweets, withLoading]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError('Tweet ID is required');
        return null;
      }

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      ReactDOM.unstable_batchedUpdates(() => {
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
                    like_count: isLiked ? t.stats.like_count - 1 : t.stats.like_count + 1,
                  },
                  is_liked: !isLiked,
                }
              : t
          )
        );
      });

      try {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to toggle like: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
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
                      like_count: isLiked ? t.stats.like_count + 1 : t.stats.like_count - 1,
                    },
                    is_liked: isLiked,
            }
                : t
            )
          );
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return false;
      }

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return false;
      }

      const childTweetIds = currentTweet.child_tweet_ids || [];

      return withLoading(async () => {
        const parentTweetId = currentTweet.parent_tweet_id;
        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => {
            const updatedTweets = prev.filter((t) => !childTweetIds.includes(t.tweet_id) && t.tweet_id !== tweetId);
            if (parentTweetId) {
              return updatedTweets.map((t) =>
                t.tweet_id === parentTweetId
                  ? {
                      ...t,
                      child_tweet_ids: t.child_tweet_ids.filter((id) => id !== tweetId),
                      children: t.children.filter((c) => c.tweet_id !== tweetId),
                      stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) - 1 },
                    }
                  : t
              );
            }
            return updatedTweets;
          });
          setPagination((prev) => ({
            ...prev,
            total: prev.total - (1 + childTweetIds.length),
          }));
        });

        try {
          await deleteTweetApi(boardId, tweetId, token);

          invalidateCache(`tweets:${boardId}:${parentTweetId || ''}`);
          invalidateCache(`tweet:${boardId}:${tweetId}`);

          ReactDOM.unstable_batchedUpdates(() => {
            lastValidTweets.current = tweets;
            setTweet(null);
          });
          return true;
        } catch (err) {
          ReactDOM.unstable_batchedUpdates(() => {
            handleAuthError(err);
            setTweets((prev) => {
              const restoredTweets = [...prev, normalizeTweet(currentTweet, currentUser)];
              if (parentTweetId) {
                return restoredTweets.map((t) =>
                  t.tweet_id === parentTweetId
                    ? {
                        ...t,
                        child_tweet_ids: [...t.child_tweet_ids, tweetId],
                        children: [...t.children, normalizeTweet(currentTweet, currentUser)],
                        stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
                      }
                    : t
                );
              }
              return restoredTweets;
            });
            setPagination((prev) => ({
              ...prev,
              total: prev.total + (1 + childTweetIds.length),
            }));
            setError(err.message || 'Failed to delete tweet');
          });
          throw err;
        }
      });
    },
    [boardId, token, currentUser, handleAuthError, tweets, withLoading]
  );

  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!boardId || !tweetId || !targetBoardId) {
        setError('Board ID, Tweet ID, and Target Board ID are required');
        return null;
      }

      const movedTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!movedTweet) {
        setError('Tweet not found');
        return null;
      }

      const parentTweetId = movedTweet.parent_tweet_id;

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) => {
          const updatedTweets = prev.filter((t) => t.tweet_id !== tweetId);
          if (parentTweetId) {
            return updatedTweets.map((t) =>
              t.tweet_id === parentTweetId
                ? {
                    ...t,
                    child_tweet_ids: t.child_tweet_ids.filter((id) => id !== tweetId),
                    children: t.children.filter((c) => c.tweet_id !== tweetId),
                    stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) - 1 },
                  }
                : t
            );
          }
          return updatedTweets;
        });
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
      });

      try {
        const updatedTweet = await moveTweetApi(tweetId, targetBoardId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to move tweet: Invalid tweet ID');
        }

        invalidateCache(`tweets:${boardId}:${parentTweetId || ''}`);
        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          handleAuthError(err);
          if (movedTweet) {
            setTweets((prev) => {
              const restoredTweets = [...prev, normalizeTweet(movedTweet, currentUser)];
              if (parentTweetId) {
                return restoredTweets.map((t) =>
                  t.tweet_id === parentTweetId
                    ? {
                        ...t,
                        child_tweet_ids: [...t.child_tweet_ids, tweetId],
                        children: [...t.children, normalizeTweet(movedTweet, currentUser)],
                        stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
                      }
                    : t
                );
              }
              return restoredTweets;
            });
            setPagination((prev) => ({
              ...prev,
              total: prev.total + 1,
            }));
          }
          setError(err.message || 'Failed to move tweet');
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const pinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t)));
      });

      try {
        const updatedTweet = await pinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to pin tweet: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          handleAuthError(err);
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
          );
          setError(err.message || 'Failed to pin tweet');
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const unpinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t)));
      });

      try {
        const updatedTweet = await unpinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to unpin tweet: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          handleAuthError(err);
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
          );
          setError(err.message || 'Failed to unpin tweet');
        });
        throw err;
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

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) =>
          prev.map((t) =>
            t.tweet_id === tweetId ? { ...t, reminder: { ...reminder, enabled: true } } : t
          )
        );
      });

      try {
        const updatedTweet = await setReminderApi(boardId, tweetId, reminder, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to set reminder: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          handleAuthError(err);
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
          );
          setError(err.message || 'Failed to set reminder');
        });
        throw err;
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

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      ReactDOM.unstable_batchedUpdates(() => {
        setTweets((prev) =>
          prev.map((t) =>
            t.tweet_id === tweetId
              ? {
                  ...t,
                  analytics: {
                    ...t.analytics,
                    shares: [
                      ...(t.analytics?.shares || []),
                      { platform: sharedTo, timestamp: new Date().toISOString(), user_id: currentUser.anonymous_id },
                    ],
                  },
                  stats: {
                    ...t.stats,
                    share_count: (t.stats.share_count || 0) + 1,
                  },
                }
              : t
          )
        );
      });

      try {
        const sharedTweet = await shareTweetApi(boardId, tweetId, sharedTo, token);
        const normalizedTweet = normalizeTweet(sharedTweet, currentUser);

        if (!normalizedTweet.tweet_id) {
          throw new Error('Failed to share tweet: Invalid tweet ID');
        }

        invalidateCache(`tweet:${boardId}:${tweetId}`);

        ReactDOM.unstable_batchedUpdates(() => {
          setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
          lastValidTweets.current = tweets;
          setTweet(normalizedTweet);
        });
        return normalizedTweet;
      } catch (err) {
        ReactDOM.unstable_batchedUpdates(() => {
          handleAuthError(err);
          setTweets((prev) =>
            prev.map((t) => (t.tweet_id === tweetId ? normalizeTweet(currentTweet, currentUser) : t))
          );
          setError(err.message || 'Failed to share tweet');
        });
        throw err;
      }
    },
    [boardId, token, currentUser, handleAuthError, tweets]
  );

  const pinnedTweets = useMemo(() => tweets.filter((t) => t.is_pinned), [tweets]);

  return {
    tweets,
    setTweets,
    tweet,
    setTweet,
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
    updateTweetStatus,
    moveTweet,
    pinTweet,
    unpinTweet,
    setReminder,
    shareTweet,
  };
};