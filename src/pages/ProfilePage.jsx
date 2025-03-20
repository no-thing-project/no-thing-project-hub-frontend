// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import ProfileCard from "../components/Cards/ProfileCard";
import useProfile from "../hooks/useProfile";

const ProfilePage = ({ currentUser, onLogout, token }) => {
  const { anonymous_id } = useParams();
  const navigate = useNavigate();
  const {
    profileData,
    isOwnProfile,
    pointsHistory,
    messages,
    loading,
    error,
    fetchProfileData,
    fetchProfilePointsHistory,
    // fetchProfileMessages,
    sendProfileMessage,
    markProfileMessageAsRead,
    deleteProfileMessage,
    updateProfileData,
  } = useProfile(token, currentUser, onLogout, navigate);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      try {
        // Fetch the profile data
        await fetchProfileData(anonymous_id, signal);

        // Fetch points history and messages if it's the user's own profile
        if (isOwnProfile) {
          await Promise.all([
            fetchProfilePointsHistory(signal),
            // fetchProfileMessages(currentUser?.anonymous_id, 50, 0, signal),
          ]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading profile data:", err);
        }
      }
    };

    if (anonymous_id) {
      loadData();
    }

    return () => controller.abort();
  }, [
    anonymous_id,
    currentUser,
    fetchProfileData,
    fetchProfilePointsHistory,
    // fetchProfileMessages,
    isOwnProfile,
  ]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profileData) return <ErrorMessage message="Profile not found" />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ProfileCard
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        pointsHistory={pointsHistory}
        messages={messages}
        onUpdate={updateProfileData}
        onSendMessage={sendProfileMessage}
        onMarkMessageAsRead={markProfileMessageAsRead}
        onDeleteMessage={deleteProfileMessage}
        // onGetMessages={() => fetchProfileMessages(anonymous_id, 50, 0)}
      />
    </AppLayout>
  );
};

export default ProfilePage;