import { useState, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
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

export const useTweets = (token, boardId, currentUser, onLogout, navigate) => {
  const [tweetsMap, setTweetsMap] = useState(new Map());
  const [tweet, setTweet] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [boardInfo, setBoardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastValidTweets = useRef(new Map());
  const abortControllerRef = useRef(null);

  const handleAuthError = useCallback((err) => {
    if (err.name === 'AbortError') return;
    ReactDOM.unstable_batchedUpdates(() => {
      setError('Session expired. Please log in again.');
      showLoginPrompt();
    });
  }, [onLogout]);

  const showLoginPrompt = useCallback(() => {
    // Implement a UI prompt (e.g., modal) to re-authenticate
    console.log('Show login prompt');
  }, []);


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

  const updateTweet = useCallback((tweetId, tweet, isNew = false) => {
    ReactDOM.unstable_batchedUpdates(() => {
      setTweetsMap((prev) => {
        const newMap = new Map(prev);
        if (tweet === null) {
          newMap.delete(tweetId);
        } else {
          newMap.set(tweetId, tweet);
        }
        return newMap;
      });
      if (isNew) {
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      }
    });
  }, []);

  const fetchTweets = useCallback(
    async (options = {}, signal) => {
      if (!boardId) {
        setError('Board ID is required to fetch tweets');
        return [];
      }

        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        const effectiveSignal = signal || abortControllerRef.current.signal;

        try {
          const data = await fetchTweetsApi(boardId, token, { ...options, limit: options.limit || 20, include_parents: true }, effectiveSignal);
          const normalizedTweets = data.tweets.map((tweet) => ({
            ...normalizeTweet(tweet, currentUser),
            children: tweet.children?.map((child) => normalizeTweet(child, currentUser)) || [],
          }));

          const newMap = new Map();
          normalizedTweets.forEach((t) => newMap.set(t.tweet_id, t));

          ReactDOM.unstable_batchedUpdates(() => {
            setTweetsMap(newMap);
            lastValidTweets.current = new Map(newMap);
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
          return Array.from(lastValidTweets.current.values());
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError]
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

      updateTweet(optimisticTweet.tweet_id, optimisticTweet, true);

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

          ReactDOM.unstable_batchedUpdates(() => {
            updateTweet(optimisticTweet.tweet_id, null);
            updateTweet(normalizedTweet.tweet_id, normalizedTweet, true);
            if (parentTweetId) {
              setTweetsMap((prev) => {
                const newMap = new Map(prev);
                const parentTweet = newMap.get(parentTweetId);
                if (parentTweet) {
                  newMap.set(parentTweetId, {
                    ...parentTweet,
                    child_tweet_ids: [...(parentTweet.child_tweet_ids || []), normalizedTweet.tweet_id],
                    children: [...(parentTweet.children || []), normalizedTweet],
                    stats: { ...parentTweet.stats, comment_count: (parentTweet.stats.comment_count || 0) + 1 },
                  });
                }
                return newMap;
              });
            }
          });

          return normalizedTweet;
        } catch (err) {
          ReactDOM.unstable_batchedUpdates(() => {
            updateTweet(optimisticTweet.tweet_id, null);
            setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
          });
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, uploadFileToS3, updateTweet]
  );

  const updateExistingTweet = useCallback(
    async (tweetId, updates, files = [], onProgress) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }
      const currentTweet = tweetsMap.get(tweetId);
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

      updateTweet(tweetId, optimisticTweet);

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

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, uploadFileToS3, updateTweet]
  );

  const toggleLikeTweet = useCallback(
    async (tweetId, isLiked) => {
      if (!tweetId) {
        setError('Tweet ID is required');
        return null;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

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

      updateTweet(tweetId, optimisticTweet);

        try {
          const updatedTweet = await toggleLikeApi(tweetId, isLiked, token);
          const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to toggle like: Invalid tweet ID');
          }

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const deleteExistingTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return false;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return false;
      }

      const childTweetIds = currentTweet.child_tweet_ids || [];
      const parentTweetId = currentTweet.parent_tweet_id;

      ReactDOM.unstable_batchedUpdates(() => {
        setTweetsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tweetId);
          childTweetIds.forEach((id) => newMap.delete(id));
          if (parentTweetId) {
            const parentTweet = newMap.get(parentTweetId);
            if (parentTweet) {
              newMap.set(parentTweetId, {
                ...parentTweet,
                child_tweet_ids: parentTweet.child_tweet_ids.filter((id) => id !== tweetId),
                children: parentTweet.children.filter((c) => c.tweet_id !== tweetId),
                stats: { ...parentTweet.stats, comment_count: (parentTweet.stats.comment_count || 0) - 1 },
              });
            }
          }
          return newMap;
        });
        setPagination((prev) => ({
          ...prev,
          total: prev.total - (1 + childTweetIds.length),
        }));
        setTweet(null);
      });

        try {
          await deleteTweetApi(boardId, tweetId, token);
          lastValidTweets.current = new Map(tweetsMap);
          return true;
        } catch (err) {
          ReactDOM.unstable_batchedUpdates(() => {
            setTweetsMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(tweetId, currentTweet);
              childTweetIds.forEach((id) => {
                const childTweet = lastValidTweets.current.get(id);
                if (childTweet) newMap.set(id, childTweet);
              });
              if (parentTweetId) {
                const parentTweet = newMap.get(parentTweetId);
                if (parentTweet) {
                  newMap.set(parentTweetId, {
                    ...parentTweet,
                    child_tweet_ids: [...parentTweet.child_tweet_ids, tweetId],
                    children: [...parentTweet.children, currentTweet],
                    stats: { ...parentTweet.stats, comment_count: (parentTweet.stats.comment_count || 0) + 1 },
                  });
                }
              }
              return newMap;
            });
            setPagination((prev) => ({
              ...prev,
              total: prev.total + (1 + childTweetIds.length),
            }));
          });
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const moveTweet = useCallback(
    async (tweetId, targetBoardId) => {
      if (!boardId || !tweetId || !targetBoardId) {
        setError('Board ID, Tweet ID, and Target Board ID are required');
        return null;
      }

      const movedTweet = tweetsMap.get(tweetId);
      if (!movedTweet) {
        setError('Tweet not found');
        return null;
      }

      const parentTweetId = movedTweet.parent_tweet_id;

      ReactDOM.unstable_batchedUpdates(() => {
        setTweetsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(tweetId);
          if (parentTweetId) {
            const parentTweet = newMap.get(parentTweetId);
            if (parentTweet) {
              newMap.set(parentTweetId, {
                ...parentTweet,
                child_tweet_ids: parentTweet.child_tweet_ids.filter((id) => id !== tweetId),
                children: parentTweet.children.filter((c) => c.tweet_id !== tweetId),
                stats: { ...parentTweet.stats, comment_count: (parentTweet.stats.comment_count || 0) - 1 },
              });
            }
          }
          return newMap;
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

          ReactDOM.unstable_batchedUpdates(() => {
            lastValidTweets.current = new Map(tweetsMap);
            setTweet(normalizedTweet);
          });
          return normalizedTweet;
        } catch (err) {
          ReactDOM.unstable_batchedUpdates(() => {
            setTweetsMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(tweetId, movedTweet);
              if (parentTweetId) {
                const parentTweet = newMap.get(parentTweetId);
                if (parentTweet) {
                  newMap.set(parentTweetId, {
                    ...parentTweet,
                    child_tweet_ids: [...parentTweet.child_tweet_ids, tweetId],
                    children: [...parentTweet.children, movedTweet],
                    stats: { ...parentTweet.stats, comment_count: (parentTweet.stats.comment_count || 0) + 1 },
                  });
                }
              }
              return newMap;
            });
            setPagination((prev) => ({
              ...prev,
              total: prev.total + 1,
            }));
          });
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const pinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      updateTweet(tweetId, { ...currentTweet, is_pinned: true });

        try {
          const updatedTweet = await pinTweetApi(boardId, tweetId, token);
          const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to pin tweet: Invalid tweet ID');
          }

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const unpinTweet = useCallback(
    async (tweetId) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      updateTweet(tweetId, { ...currentTweet, is_pinned: false });

        try {
          const updatedTweet = await unpinTweetApi(boardId, tweetId, token);
          const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to unpin tweet: Invalid tweet ID');
          }

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const setReminder = useCallback(
    async (tweetId, reminder) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

      updateTweet(tweetId, { ...currentTweet, reminder: { ...reminder, enabled: true } });

        try {
          const updatedTweet = await setReminderApi(boardId, tweetId, reminder, token);
          const normalizedTweet = normalizeTweet(updatedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to set reminder: Invalid tweet ID');
          }

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const shareTweet = useCallback(
    async (tweetId, sharedTo) => {
      if (!boardId || !tweetId) {
        setError('Board ID and Tweet ID are required');
        return null;
      }

      const currentTweet = tweetsMap.get(tweetId);
      if (!currentTweet) {
        setError('Tweet not found');
        return null;
      }

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

      updateTweet(tweetId, optimisticTweet);

        try {
          const sharedTweet = await shareTweetApi(boardId, tweetId, sharedTo, token);
          const normalizedTweet = normalizeTweet(sharedTweet, currentUser);

          if (!normalizedTweet.tweet_id) {
            throw new Error('Failed to share tweet: Invalid tweet ID');
          }

          updateTweet(tweetId, normalizedTweet);
          return normalizedTweet;
        } catch (err) {
          updateTweet(tweetId, currentTweet);
          handleAuthError(err);
          throw err;
        }
    },
    [boardId, token, currentUser.anonymous_id, currentUser.username, handleAuthError, tweetsMap, updateTweet]
  );

  const tweets = useMemo(() => Array.from(tweetsMap.values()), [tweetsMap]);
  const pinnedTweets = useMemo(() => tweets.filter((t) => t.is_pinned), [tweets]);

  return {
    tweets,
    updateTweet,
    tweet,
    setTweet,
    pagination,
    boardInfo,
    loading,
    error,
    pinnedTweets,
    fetchTweets,
    createNewTweet,
    updateExistingTweet,
    toggleLikeTweet,
    deleteExistingTweet,
    moveTweet,
    pinTweet,
    unpinTweet,
    setReminder,
    shareTweet,
  };
};