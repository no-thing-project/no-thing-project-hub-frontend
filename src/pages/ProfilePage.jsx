import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import ProfileCard from "../components/cards/ProfileCard/ProfileCard";
import { fetchProfile } from "../utils/apiPages";

const ProfilePage = ({ currentUser, onLogout, token }) => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { authData, isOwnProfile } = await fetchProfile(userId, currentUser, token);
        setProfileData(authData);
        setIsOwnProfile(isOwnProfile);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && token) {
      loadProfile();
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [userId, currentUser, token]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ProfileCard currentUser={profileData} isOwnProfile={isOwnProfile} />
    </AppLayout>
  );
};

export default ProfilePage;