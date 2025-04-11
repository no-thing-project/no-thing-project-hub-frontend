import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch all tweets for a board
export const fetchTweetsApi = async (
  boardId,
  token,
  options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" },
  signal
) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const { status, page, limit, sort } = options;
    const response = await api.get(`/api/v1/tweets/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status, page, limit, sort },
      signal,
    });
    return response.data.content || { tweets: [], board: null, pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

// Fetch a single tweet by ID
export const fetchTweetById = async (boardId, tweetId, token, signal) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const response = await api.get(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Create a tweet
export const createTweetApi = async (
  boardId,
  content,
  x,
  y,
  parentTweetId,
  isAnonymous,
  status = "approved",
  scheduledAt,
  token
) => {
  if (!boardId) throw new Error("Board ID is required");
  try {
    const payload = {
      content: typeof content === "string" ? { type: "text", value: content } : content,
      position: { x, y },
      parent_tweet_id: parentTweetId || null,
      is_anonymous: isAnonymous,
      status,
      scheduled_at: scheduledAt || null,
    };
    const response = await api.post(`/api/v1/tweets/${boardId}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Update a tweet
export const updateTweetApi = async (boardId, tweetId, updates, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const { content, position, status, scheduled_at } = updates;
    const payload = {};
    if (content) payload.content = typeof content === "string" ? { type: "text", value: content } : content;
    if (position) payload.position = position;
    if (status) payload.status = status;
    if (scheduled_at !== undefined) payload.scheduled_at = scheduled_at;

    const response = await api.put(`/api/v1/tweets/${boardId}/${tweetId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Toggle like
export const toggleLikeApi = async (tweetId, isLiked, token) => {
  if (!tweetId) throw new Error("Tweet ID is required");
  try {
    const endpoint = isLiked ? "unlike" : "like";
    const response = await api.post(`/api/v1/tweets/${tweetId}/${endpoint}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Delete a tweet
export const deleteTweetApi = async (boardId, tweetId, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const response = await api.delete(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Get tweet comments
export const getTweetCommentsApi = async (
  tweetId,
  token,
  options = { page: 1, limit: 20 },
  signal
) => {
  if (!tweetId) throw new Error("Tweet ID is required");
  try {
    const { page, limit } = options;
    const response = await api.get(`/api/v1/tweets/${tweetId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
      signal,
    });
    return response.data.content || { comments: [], pagination: {} };
  } catch (err) {
    return handleApiError(err);
  }
};

// Update tweet status
export const updateTweetStatusApi = async (boardId, tweetId, status, token) => {
  if (!boardId || !tweetId) throw new Error("Board ID and Tweet ID are required");
  try {
    const payload = { status };
    const response = await api.put(`/api/v1/tweets/${boardId}/${tweetId}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};

// Move tweet to another board
export const moveTweetApi = async (tweetId, targetBoardId, token) => {
  if (!tweetId || !targetBoardId) throw new Error("Tweet ID and Target Board ID are required");
  try {
    const payload = { targetBoardId };
    const response = await api.put(`/api/v1/tweets/${tweetId}/move`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    return handleApiError(err);
  }
};