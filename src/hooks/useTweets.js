/**
 * @module useTweets
 * @description React hook for managing tweets with caching and debounced API calls.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import {
  fetchTweetsApi,
  createTweetApi,
  updateTweetApi,
  toggleLikeApi,
  deleteTweetApi,
  moveTweetApi,
  pinTweetApi,
  unpinTweetApi,
  setReminderApi,
  shareTweetApi,
  generatePresignedUrlApi,
} from '../api/tweetsApi';
import { normalizeTweet } from '../utils/tweetUtils';

// Constants
const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required.',
  BOARD_ID_MISSING: 'Board ID is missing.',
  TWEET_ID_MISSING: 'Tweet ID is missing.',
  CONTENT_MISSING: 'Tweet must have text or files.',
  POSITION_INVALID: 'Valid position (x, y) is required.',
  TARGET_BOARD_ID_MISSING: 'Target board ID is missing.',
  REMINDER_INVALID: 'Invalid reminder data.',
  SHARE_PLATFORM_MISSING: 'Share platform is missing.',
  FILE_UPLOAD_FAILED: 'Failed to upload file.',
  GENERIC: 'An error occurred.',
};

const CONFIG = {
  MAX_CACHE_SIZE: 10,
  CACHE_EXPIRY_MS: 30 * 60 * 1000, // 30 minutes
  DEBOUNCE_MS: 300,
  DEFAULT_LIMIT: 20,
  CACHE_VERSION: 'v1',
};

// LRU Cache implementation
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const { value, timestamp } = this.cache.get(key);
    if (Date.now() - timestamp > CONFIG.CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, { value, timestamp });
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const tweetCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

/**
 * Hook for managing tweets.
 * @param {string|null} token - Authentication token.
 * @param {string|null} boardId - ID of the board.
 * @param {object} currentUser - Current user data.
 * @param {function} onLogout - Logout callback.
 * @param {function} navigate - Navigation callback.
 * @param {boolean} skipInitialFetch - Skip initial tweets fetch.
 * @returns {object} Tweet management functions and state.
 */
export const useTweets = (token, boardId, currentUser, onLogout, navigate, skipInitialFetch = false) => {
  const [tweets, setTweets] = useState([]);
  const [tweet, setTweet] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
  const [boardInfo, setBoardInfo] = useState(null);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const handleError = useCallback(
    (err, message) => {
      if (err.name === 'AbortError') return Promise.resolve(null);
      const status = err.status || 500;
      if (status === 401 || status === 403) {
        onLogout('Session expired. Please log in again.');
        navigate('/login');
      }
      const errorMessage = message || err.message || ERROR_MESSAGES.GENERIC;
      setError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    },
    [onLogout, navigate]
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
        return handleError(err, ERROR_MESSAGES.FILE_UPLOAD_FAILED);
      }
    },
    [handleError]
  );

  const fetchTweetsList = useCallback(
    async (filters = {}, signal, append = false) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);

      const { page = 1, limit = CONFIG.DEFAULT_LIMIT } = filters;
      const cacheKey = `${CONFIG.CACHE_VERSION}:tweets:${boardId}:${JSON.stringify({ ...filters, page, limit })}`;
      const cachedData = tweetCache.get(cacheKey);

      if (cachedData && !append) {
        setTweets(cachedData.tweets || []);
        setPagination(cachedData.pagination || { page, limit, total: 0, hasMore: true });
        setBoardInfo(cachedData.board || null);
        return Promise.resolve(cachedData);
      }

      setError(null);

      try {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const effectiveSignal = signal || abortControllerRef.current.signal;

        const data = await fetchTweetsApi(boardId, token, { ...filters, page, limit }, effectiveSignal);
        if (!data) throw new Error('No data received');

        const normalizedTweets = data.tweets.map((tweet) => ({
          ...normalizeTweet(tweet, currentUser),
          children: tweet.children?.map((child) => normalizeTweet(child, currentUser)) || [],
        }));

        setTweets((prev) => (append ? [...prev, ...normalizedTweets] : normalizedTweets));
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          total: data.pagination?.total || 0,
          hasMore: normalizedTweets.length === limit,
        });
        setBoardInfo(data.board || null);

        const cacheData = { tweets: normalizedTweets, pagination: data.pagination, board: data.board };
        tweetCache.set(cacheKey, cacheData);
        return Promise.resolve(cacheData);
      } catch (err) {
        if (err.name === 'AbortError') return Promise.resolve(null);
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError]
  );

  const debouncedFetchTweetsList = useMemo(() => {
    return debounce((filters, signal, append, callback) => {
      fetchTweetsList(filters, signal, append)
        .then((result) => callback(null, result))
        .catch((err) => callback(err, null));
    }, CONFIG.DEBOUNCE_MS);
  }, [fetchTweetsList]);

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
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (isNaN(x) || isNaN(y)) return handleError(new Error(), ERROR_MESSAGES.POSITION_INVALID);
      if (!content?.value?.trim() && !files.length) return handleError(new Error(), ERROR_MESSAGES.CONTENT_MISSING);

      setError(null);

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

      setTweets((prev) => [...prev, optimisticTweet]);

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

        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === optimisticTweet.tweet_id ? normalizedTweet : t))
        );
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));

        if (parentTweetId) {
          setTweets((prev) =>
            prev.map((t) =>
              t.tweet_id === parentTweetId
                ? {
                    ...t,
                    child_tweet_ids: [...(t.child_tweet_ids || []), normalizedTweet.tweet_id],
                    children: [...(t.children || []), normalizedTweet],
                    stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
                  }
                : t
            )
          );
        }

        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) => prev.filter((t) => t.tweet_id !== optimisticTweet.tweet_id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, uploadFileToS3]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates, files = [], onProgress) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);
      if (!updates || !Object.keys(updates).length) return handleError(new Error(), 'At least one update field is required');

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      if (updates.content && !updates.content.value?.trim() && !files.length && !currentTweet.content.metadata.files.length) {
        return handleError(new Error(), ERROR_MESSAGES.CONTENT_MISSING);
      }
      if (updates.position && (isNaN(updates.position.x) || isNaN(updates.position.y))) {
        return handleError(new Error(), ERROR_MESSAGES.POSITION_INVALID);
      }
      setError(null);

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

      setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? optimisticTweet : t)));

      try {
        const uploadedFiles = await Promise.all(
          files.map((file) => uploadFileToS3(file, token, (progress) => onProgress?.(progress / files.length)))
        );

        const finalUpdates = {
          ...updates,
          content: updates.content
            ? {
                ...contentObj,
                type: uploadedFiles.length ? uploadedFiles[0].contentType.split('/')[0] : contentObj.type,
                metadata: {
                  ...contentObj.metadata,
                  files: [...contentObj.metadata.files, ...uploadedFiles],
                },
              }
            : undefined,
          position: updates.position ? { x: updates.position.x, y: updates.position.y } : undefined,
          status: updates.status,
          scheduled_at: updates.scheduled_at !== undefined ? updates.scheduled_at : undefined,
          reminder: updates.reminder ? { ...updates.reminder, enabled: !!updates.reminder.schedule } : undefined,
        };

        Object.keys(finalUpdates).forEach((key) => finalUpdates[key] === undefined && delete finalUpdates[key]);

        const updatedTweet = await updateTweetApi(boardId, tweetId, finalUpdates, token);
        const normalizedTweet = normalizeTweet(
          { ...updatedTweet, position: updatedTweet.position || currentTweet.position },
          currentUser
        );

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? currentTweet : t)));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets, uploadFileToS3]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      const optimisticTweet = {
        ...currentTweet,
        liked_by: isLiked
          ? currentTweet.liked_by.filter((l) => l.anonymous_id !== currentUser.anonymous_id)
          : [...currentTweet.liked_by, { anonymous_id: currentUser.anonymous_id, username: currentUser.username }],
        stats: {
          ...currentTweet.stats,
          like_count: isLiked ? currentTweet.stats.like_count - 1 : currentTweet.stats.like_count + 1,
        },
        is_liked: !isLiked,
      };

      setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? optimisticTweet : t)));

      try {
        const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? currentTweet : t)));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, currentUser, handleError, tweets]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      const childTweetIds = currentTweet.child_tweet_ids || [];
      const parentTweetId = currentTweet.parent_tweet_id;

      setTweets((prev) =>
        prev
          .filter((t) => t.tweet_id !== tweetId && !childTweetIds.includes(t.tweet_id))
          .map((t) =>
            t.tweet_id === parentTweetId
              ? {
                  ...t,
                  child_tweet_ids: t.child_tweet_ids.filter((id) => id !== tweetId),
                  children: t.children.filter((c) => c.tweet_id !== tweetId),
                  stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) - 1 },
                }
              : t
          )
      );
      setPagination((prev) => ({ ...prev, total: prev.total - (1 + childTweetIds.length) }));
      setTweet((prev) => (prev?.tweet_id === tweetId ? null : prev));

      try {
        await deleteTweetApi(boardId, tweetId, token);
        tweetCache.clear();
        return Promise.resolve(true);
      } catch (err) {
        setTweets((prev) => [
          ...prev,
          currentTweet,
          ...childTweetIds.map((id) => tweets.find((t) => t.tweet_id === id)).filter(Boolean),
        ].map((t) =>
          t.tweet_id === parentTweetId
            ? {
                ...t,
                child_tweet_ids: [...t.child_tweet_ids, tweetId],
                children: [...t.children, currentTweet],
                stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
              }
            : t
        ));
        setPagination((prev) => ({ ...prev, total: prev.total + (1 + childTweetIds.length) }));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, handleError, tweets]
  );

  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);
      if (!targetBoardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TARGET_BOARD_ID_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      const parentTweetId = currentTweet.parent_tweet_id;

      setTweets((prev) =>
        prev
          .filter((t) => t.tweet_id !== tweetId)
          .map((t) =>
            t.tweet_id === parentTweetId
              ? {
                  ...t,
                  child_tweet_ids: t.child_tweet_ids.filter((id) => id !== tweetId),
                  children: t.children.filter((c) => c.tweet_id !== tweetId),
                  stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) - 1 },
                }
              : t
          )
      );
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

      try {
        const updatedTweet = await moveTweetApi(tweetId, targetBoardId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        setTweet(normalizedTweet);
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) => [
          ...prev,
          currentTweet,
        ].map((t) =>
          t.tweet_id === parentTweetId
            ? {
                ...t,
                child_tweet_ids: [...t.child_tweet_ids, tweetId],
                children: [...t.children, currentTweet],
                stats: { ...t.stats, comment_count: (t.stats.comment_count || 0) + 1 },
              }
            : t
        ));
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets]
  );

  const pinTweet = useCallback(
    async (tweetId) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t))
      );

      try {
        const updatedTweet = await pinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t))
        );
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets]
  );

  const unpinTweet = useCallback(
    async (tweetId) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: false } : t))
      );

      try {
        const updatedTweet = await unpinTweetApi(boardId, tweetId, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, is_pinned: true } : t))
        );
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets]
  );

  const setReminder = useCallback(
    async (tweetId, reminder) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);
      if (!reminder?.schedule) return handleError(new Error(), ERROR_MESSAGES.REMINDER_INVALID);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      setTweets((prev) =>
        prev.map((t) => (t.tweet_id === tweetId ? { ...t, reminder: { ...reminder, enabled: true } } : t))
      );

      try {
        const updatedTweet = await setReminderApi(boardId, tweetId, reminder, token);
        const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) =>
          prev.map((t) => (t.tweet_id === tweetId ? { ...t, reminder: currentTweet.reminder } : t))
        );
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets]
  );

  const shareTweet = useCallback(
    async (tweetId, sharedTo) => {
      if (!token) return handleError(new Error(), ERROR_MESSAGES.AUTH_REQUIRED);
      if (!boardId?.trim()) return handleError(new Error(), ERROR_MESSAGES.BOARD_ID_MISSING);
      if (!tweetId?.trim()) return handleError(new Error(), ERROR_MESSAGES.TWEET_ID_MISSING);
      if (!sharedTo?.trim()) return handleError(new Error(), ERROR_MESSAGES.SHARE_PLATFORM_MISSING);

      const currentTweet = tweets.find((t) => t.tweet_id === tweetId);
      if (!currentTweet) return handleError(new Error(), 'Tweet not found');

      setError(null);

      const optimisticTweet = {
        ...currentTweet,
        analytics: {
          ...currentTweet.analytics,
          shares: [
            ...(currentTweet.analytics?.shares || []),
            { platform: sharedTo, timestamp: new Date().toISOString(), user_id: currentUser.anonymous_id },
          ],
        },
        stats: {
          ...currentTweet.stats,
          share_count: (currentTweet.stats.share_count || 0) + 1,
        },
      };

      setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? optimisticTweet : t)));

      try {
        const sharedTweet = await shareTweetApi(boardId, tweetId, sharedTo, token);
        const normalizedTweet = normalizeTweet(sharedTweet, currentUser);

        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? normalizedTweet : t)));
        tweetCache.clear();
        return Promise.resolve(normalizedTweet);
      } catch (err) {
        setTweets((prev) => prev.map((t) => (t.tweet_id === tweetId ? currentTweet : t)));
        return handleError(err, ERROR_MESSAGES.GENERIC);
      }
    },
    [token, boardId, currentUser, handleError, tweets]
  );

  const resetState = useCallback(() => {
    setTweets([]);
    setTweet(null);
    setPagination({ page: 1, limit: CONFIG.DEFAULT_LIMIT, total: 0, hasMore: true });
    setBoardInfo(null);
    setError(null);
    tweetCache.clear();
  }, []);

  useEffect(() => {
    if (!token || !boardId || skipInitialFetch) {
      resetState();
      return;
    }

    const controller = new AbortController();
    debouncedFetchTweetsList({}, controller.signal, false, (err, result) => {
      if (err && err.name !== 'AbortError') {
        setError(err.message || ERROR_MESSAGES.GENERIC);
      }
    });

    return () => {
      controller.abort();
      debouncedFetchTweetsList.cancel();
    };
  }, [token, boardId, skipInitialFetch, resetState, debouncedFetchTweetsList]);

  return useMemo(
    () => ({
      tweets,
      tweet,
      setTweet,
      setTweets,
      pagination,
      boardInfo,
      error,
      fetchTweetsList: debouncedFetchTweetsList,
      createNewTweet,
      updateExistingTweet,
      toggleLikeTweet,
      deleteExistingTweet,
      moveTweet,
      pinTweet,
      unpinTweet,
      setReminder,
      shareTweet,
      resetState,
    }),
    [
      tweets,
      tweet,
      pagination,
      boardInfo,
      error,
      debouncedFetchTweetsList,
      createNewTweet,
      updateExistingTweet,
      toggleLikeTweet,
      deleteExistingTweet,
      moveTweet,
      pinTweet,
      unpinTweet,
      setReminder,
      shareTweet,
      resetState,
    ]
  );
};

export default useTweets;