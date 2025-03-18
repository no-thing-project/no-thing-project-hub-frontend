import { useState, useCallback, useRef, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { normalizeUserData } from "../utils/profileUtils";

const useProfile = (token, currentUser, onLogout, navigate) => {
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelTokenSource = useRef(null);

  // Cleanup function to cancel ongoing requests on unmount or token/currentUser change
  useEffect(() => {
    return () => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel("Request canceled on cleanup");
      }
    };
  }, [token, currentUser]);

  // Fetch profile data by anonymous_id
  const fetchProfile = useCallback(
    async (anonymous_id) => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel("Previous request canceled");
      }

      cancelTokenSource.current = axios.CancelToken.source();
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/${anonymous_id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cancelToken: cancelTokenSource.current.token,
        });
        const { content } = response.data;
        setProfileData(content);
        setIsOwnProfile(currentUser?.anonymous_id === anonymous_id);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          onLogout();
          navigate("/login");
        } else {
          setError(err.response?.data?.errors?.[0] || "Failed to fetch profile");
        }
      } finally {
        setLoading(false);
        cancelTokenSource.current = null;
      }
    },
    [token, currentUser, onLogout, navigate]
  );

  // Update profile
  const updateProfile = useCallback(
    async (updates) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.put(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/update`, updates, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { content } = response.data;
        setProfileData(content);
        return true;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to update profile");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Delete profile
  const deleteProfile = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/delete`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onLogout();
        navigate("/");
        return true;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to delete profile");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, onLogout, navigate]
  );

  // Fetch points history
  const fetchPointsHistory = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/points/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.content;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to fetch points history");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Send message
  const sendMessage = useCallback(
    async (recipient_anonymous_id, content) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(
          `${config.REACT_APP_HUB_API_URL}/api/v1/profile/messages/send`,
          { recipient_anonymous_id, content },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data.content;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to send message");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Get messages
  const getMessages = useCallback(
    async (withUserId, limit = 50, offset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/messages`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { withUserId, limit, offset },
        });
        return response.data.content;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to fetch messages");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Mark message as read
  const markMessageAsRead = useCallback(
    async (messageId) => {
      setLoading(true);
      setError(null);
      try {
        await axios.put(
          `${config.REACT_APP_HUB_API_URL}/api/v1/profile/messages/${messageId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return true;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to mark message as read");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId) => {
      setLoading(true);
      setError(null);
      try {
        await axios.delete(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return true;
      } catch (err) {
        setError(err.response?.data?.errors?.[0] || "Failed to delete message");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token]
  );
  

  return {
    profileData,
    isOwnProfile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    deleteProfile,
    fetchPointsHistory,
    sendMessage,
    getMessages,
    markMessageAsRead,
    deleteMessage,
  };
};

export default useProfile;