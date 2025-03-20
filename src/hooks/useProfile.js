// src/hooks/useProfile.js
import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { useEventCallback } from "@mui/material";
import {
  fetchProfile,
  fetchProfileById,
  updateProfile,
  deleteProfile,
  fetchPointsHistory,
  sendMessage,
  getMessages,
  markMessageAsRead,
  deleteMessage,
} from "../utils/profileApi";

/**
 * Custom hook for managing profile-related operations.
 * @param {string} token - Authentication token
 * @param {Object} currentUser - Current user data
 * @param {() => void} onLogout - Callback to handle logout on auth errors
 * @param {import("react-router-dom").NavigateFunction} navigate - Navigation function for redirects
 * @returns {Object} - Profile state and operations
 */
const useProfile = (token, currentUser, onLogout, navigate) => {
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle authentication errors (401/403)
  const handleAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout("Session expired. Please log in again.");
        navigate("/login");
      }
      setError(err.message || "Authentication error");
    },
    [onLogout, navigate]
  );

  // Fetch profile by anonymous_id (special case for own profile)
  const fetchProfileData = useCallback(
    async (anonymous_id, signal) => {
      if (!anonymous_id) {
        setError("Anonymous ID is required to fetch profile");
        throw new Error("Anonymous ID is required");
      }
      if (!currentUser || !token) {
        setError("Not authenticated");
        throw new Error("Not authenticated");
      }
      setLoading(true);
      setError(null);
      try {
        const { authData, isOwnProfile } = await fetchProfile(anonymous_id, currentUser, token, signal);
        setProfileData(authData);
        setIsOwnProfile(isOwnProfile);
        // If it's the user's own profile, messages might be included in the response
        if (isOwnProfile && authData.messages) {
          setMessages(authData.messages);
        }
        return { authData, isOwnProfile };
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching profile:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentUser, token, handleAuthError]
  );

  // Fetch profile by ID (for other users)
  const fetchProfileByIdData = useCallback(
    async (anonymous_id, signal) => {
      if (!anonymous_id) {
        setError("Anonymous ID is required to fetch profile");
        throw new Error("Anonymous ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchProfileById(anonymous_id, token, signal);
        setProfileData(profile);
        setIsOwnProfile(false);
        return profile;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching profile by ID:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Update profile (debounced)
  const updateProfileData = useEventCallback(
    debounce(async (updates, signal) => {
      if (!profileData) {
        setError("No profile data to update");
        throw new Error("No profile data to update");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedProfile = await updateProfile(updates, token, signal);
        setProfileData(updatedProfile);
        return updatedProfile;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error updating profile:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    }, 500),
    [profileData, token, handleAuthError]
  );

  // Delete profile
  const deleteProfileData = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        await deleteProfile(token, signal);
        setProfileData(null);
        setIsOwnProfile(false);
        setMessages([]);
        setPointsHistory([]);
        onLogout();
        navigate("/");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error deleting profile:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, onLogout, navigate, handleAuthError]
  );

  // Fetch points history
  const fetchProfilePointsHistory = useCallback(
    async (signal) => {
      setLoading(true);
      setError(null);
      try {
        const history = await fetchPointsHistory(token, signal);
        setPointsHistory(history);
        return history;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching points history:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Send message
  const sendProfileMessage = useCallback(
    async (recipientId, content, signal) => {
      if (!recipientId || !content) {
        setError("Recipient ID and content are required to send a message");
        throw new Error("Recipient ID and content are required");
      }
      setLoading(true);
      setError(null);
      try {
        const message = await sendMessage(recipientId, content, token, signal);
        setMessages((prev) => [...prev, message]);
        return message;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error sending message:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Get messages
  const fetchProfileMessages = useCallback(
    async (user_id, limit = 50, offset = 0, signal) => {
      if (!user_id) {
        setError("User ID is required to fetch messages");
        throw new Error("User ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getMessages(user_id, limit, offset, token, signal);
        setMessages(fetchedMessages);
        return fetchedMessages;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching messages:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Mark message as read
  const markProfileMessageAsRead = useCallback(
    async (messageId, signal) => {
      if (!messageId) {
        setError("Message ID is required to mark as read");
        throw new Error("Message ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const success = await markMessageAsRead(messageId, token, signal);
        if (success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId ? { ...msg, is_read: true } : msg
            )
          );
        }
        return success;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error marking message as read:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  // Delete message
  const deleteProfileMessage = useCallback(
    async (messageId, signal) => {
      if (!messageId) {
        setError("Message ID is required to delete message");
        throw new Error("Message ID is required");
      }
      setLoading(true);
      setError(null);
      try {
        const success = await deleteMessage(messageId, token, signal);
        if (success) {
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        }
        return success;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error deleting message:", err);
          handleAuthError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return {
    profileData, // Profile data (own or other user's)
    isOwnProfile, // Boolean indicating if it's the current user's profile
    pointsHistory, // Points history for the profile
    messages, // Messages for the profile
    loading,
    error,
    fetchProfileData, // Fetch profile (special case for own profile)
    fetchProfileById: fetchProfileByIdData, // Fetch profile by ID (for other users)
    updateProfileData, // Update profile (debounced)
    deleteProfileData, // Delete profile
    fetchProfilePointsHistory, // Fetch points history
    sendProfileMessage, // Send a message
    fetchProfileMessages, // Fetch messages
    markProfileMessageAsRead, // Mark message as read
    deleteProfileMessage, // Delete a message
  };
};

export default useProfile;