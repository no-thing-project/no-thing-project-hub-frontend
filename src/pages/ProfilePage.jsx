// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import ProfileCard from "../components/Cards/ProfileCard";
import useProfile  from "../hooks/useProfile";

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
    fetchProfile,
    updateProfile,
    fetchPointsHistory,
    getMessages,
    sendMessage,
    markMessageAsRead,
    deleteMessage,
  } = useProfile(token, currentUser, onLogout, navigate);

  useEffect(() => {
    // Fetch the profile data
    fetchProfile(anonymous_id);

    // Fetch points history if it's the user's own profile
    if (currentUser?.anonymous_id === anonymous_id) {
      fetchPointsHistory();
    }
  }, [anonymous_id, currentUser, fetchProfile, fetchPointsHistory]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ProfileCard
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        onUpdate={updateProfile}
        pointsHistory={pointsHistory}
        messages={messages}
        onSendMessage={sendMessage}
        onMarkMessageAsRead={markMessageAsRead}
        onDeleteMessage={deleteMessage}
        onGetMessages={() => getMessages(anonymous_id)} // Call when needed
      />
    </AppLayout>
  );
};

export default ProfilePage;