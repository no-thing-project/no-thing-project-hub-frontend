import api from "./apiClient";
import { handleApiError } from "./apiClient";

// Fetch all tweets for a board
export const fetchTweetsApi = async (board_id, token, options = { status: "approved", page: 1, limit: 20, sort: "created_at:-1" }) => {
  try {
    const { status, page, limit, sort } = options;
    const response = await api.get(`/api/v1/tweets/${board_id}`, {
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
export const fetchTweetById = async ( tweet_id, token) => {
  try {
    const response = await api.get(`/api/v1/tweets/${tweet_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

// Create a tweet
export const createTweetApi = async (board_id, content, x, y, parentTweetId, isAnonymous, token) => {
  try {
    const payload = {
      board_id: board_id,
      content: typeof content === "string" ? { type: "text", value: content } : content,
      position: { x, y },
      parent_tweet_id: parentTweetId || null,
      is_anonymous: isAnonymous,
    };
    const response = await api.post(`/api/v1/tweets/${board_id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Update a tweet
export const updateTweetApi = async (board_id, tweet_id, updates, token) => {
  try {
    const { content, position } = updates;
    const payload = {};
    if (content) payload.content = typeof content === "string" ? { type: "text", value: content } : content;
    if (position) payload.position = position;

    await api.put(`/api/v1/tweets/${board_id}/${tweet_id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Toggle like
export const toggleLikeApi = async (tweet_id, isLiked, token) => {
  try {
    const endpoint = isLiked ? "unlike" : "like";
    const response = await api.post(`/api/v1/tweets/${tweet_id}/${endpoint}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content || response.data;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Delete a tweet
export const deleteTweetApi = async (board_id, tweet_id, token) => {
  try {
    await api.delete(`/api/v1/tweets/${board_id}/${tweet_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

// Get tweet comments
export const getTweetCommentsApi = async (tweet_id, token, options = { page: 1, limit: 20 }) => {
  try {
    const { page, limit } = options;
    const response = await api.get(`/api/v1/tweets/${tweet_id}/comments`, {
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
export const updateTweetStatusApi = async (board_id, tweet_id, status, token) => {
  try {
    const payload = { status };
    await api.put(`/api/v1/tweets/${board_id}/${tweet_id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};