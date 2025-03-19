import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch all tweets for a board
export const fetchTweetsApi = async (boardId, token, options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }) => {
  try {
    const { status, page, limit, sort } = options;
    const response = await api.get(`/api/v1/tweets/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { status, page, limit, sort },
    });
    return response.data.content.tweets;
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Fetch a single tweet by ID
export const fetchTweetByIdApi = async (boardId, tweetId, token) => {
  try {
    const response = await api.get(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

// Create a tweet
export const createTweetApi = async (boardId, content, x, y, parentTweetId, isAnonymous, token) => {
  try {
    const payload = {
      board_id: boardId,
      content: typeof content === "string" ? { type: "text", value: content } : content,
      position: { x, y },
      parent_tweet_id: parentTweetId || null,
      is_anonymous: isAnonymous,
    };
    const response = await api.post(`/api/v1/tweets/${boardId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a tweet
export const updateTweetApi = async (boardId, tweetId, updates, token) => {
  try {
    const { content, position } = updates;
    const payload = {};
    if (content) payload.content = typeof content === "string" ? { type: "text", value: content } : content;
    if (position) payload.position = position;

    await api.put(`/api/v1/tweets/${boardId}/${tweetId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Toggle like
export const toggleLikeApi = async (tweetId, isLiked, token) => {
  try {
    const endpoint = isLiked ? "unlike" : "like";
    const response = await api.post(`/api/v1/tweets/${tweetId}/${endpoint}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a tweet
export const deleteTweetApi = async (boardId, tweetId, token) => {
  try {
    await api.delete(`/api/v1/tweets/${boardId}/${tweetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Get tweet comments
export const getTweetCommentsApi = async (tweetId, token, options = { page: 1, limit: 20 }) => {
  try {
    const { page, limit } = options;
    const response = await api.get(`/api/v1/tweets/${tweetId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    return response.data.content.comments;
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

// Update tweet status
export const updateTweetStatusApi = async (boardId, tweetId, status, token) => {
  try {
    const payload = { status };
    await api.put(`/api/v1/tweets/${boardId}/${tweetId}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};