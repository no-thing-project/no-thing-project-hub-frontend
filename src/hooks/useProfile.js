// src/hooks/useProfile.js
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import {
  fetchProfile,
  updateProfile,
  deleteProfile,
  fetchPointsHistory,
  sendMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../utils/profileApi";
import { useEventCallback } from "@mui/material";

const useProfile = (token, currentUser, onLogout, navigate) => {
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch profile by anonymous_id
  const fetchProfileData = useCallback(
    async (anonymous_id, signal) => {
      if (!anonymous_id) {
        setError("Anonymous ID is required to fetch profile");
        return;
      }
      if (!currentUser || !token) {
        setError("Not authenticated");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { authData, isOwnProfile } = await fetchProfile(
          anonymous_id,
          currentUser,
          token,
          signal
        );
        setProfileData(authData);
        setIsOwnProfile(isOwnProfile);
        // If it's the user's own profile, messages are included in the response
        if (isOwnProfile && authData.messages) {
          setMessages(authData.messages);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, token, handleAuthError]
  );

  // Update profile (debounced)
  const updateProfileData = useEventCallback(
    debounce(async (updates, signal) => {
      if (!profileData) {
        setError("No profile data to update");
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        const updatedProfile = await updateProfile(updates, token, signal);
        setProfileData(updatedProfile);
        return true;
      } catch (err) {
        console.error("Error updating profile:", err);
        handleAuthError(err);
        return false;
      } finally {
        setLoading(false);
      }
    }, 500),
    [profileData, token, handleAuthError]
  );

  // Delete profile
  const deleteProfileData = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProfile(token, signal);
      onLogout();
      navigate("/");
      return true;
    } catch (err) {
      console.error("Error deleting profile:", err);
      handleAuthError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, onLogout, navigate, handleAuthError]);

  // Fetch points history
  const fetchProfilePointsHistory = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const history = await fetchPointsHistory(token, signal);
      setPointsHistory(history);
      return history;
    } catch (err) {
      console.error("Error fetching points history:", err);
      handleAuthError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Send message
  const sendProfileMessage = useCallback(
    async (recipientId, content, signal) => {
      setLoading(true);
      setError(null);
      try {
        const message = await sendMessage(recipientId, content, token, signal);
        setMessages((prev) => [...prev, message]);
        return message;
      } catch (err) {
        console.error("Error sending message:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Get messages
  const getProfileMessages = useCallback(
    async (withUserId, limit = 50, offset = 0, signal) => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getMessages(withUserId, limit, offset, token, signal);
        setMessages(fetchedMessages);
        return fetchedMessages;
      } catch (err) {
        console.error("Error fetching messages:", err);
        handleAuthError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Mark message as read
  const markProfileMessageAsRead = useCallback(
    async (messageId, signal) => {
      setLoading(true);
      setError(null);
      try {
        const success = await markMessageAsRead(messageId, token, signal);
        if (success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === messageId ? { ...msg, is_read: true } : msg
            )
          );
        }
        return success;
      } catch (err) {
        console.error("Error marking message as read:", err);
        handleAuthError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Delete message
  const deleteProfileMessage = useCallback(
    async (messageId, signal) => {
      setLoading(true);
      setError(null);
      try {
        const success = await deleteMessage(messageId, token, signal);
        if (success) {
          setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
        }
        return success;
      } catch (err) {
        console.error("Error deleting message:", err);
        handleAuthError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    profileData,
    isOwnProfile,
    pointsHistory,
    messages,
    loading,
    error,
    fetchProfile: fetchProfileData,
    updateProfile: updateProfileData,
    deleteProfile: deleteProfileData,
    fetchPointsHistory: fetchProfilePointsHistory,
    sendMessage: sendProfileMessage,
    getMessages: getProfileMessages,
    markMessageAsRead: markProfileMessageAsRead,
    deleteMessage: deleteProfileMessage,
  };
};

export default useProfile;