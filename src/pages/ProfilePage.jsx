import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import ProfileCard from "../components/Cards/ProfileCard";
import { fetchProfile } from "../utils/apiPages";
import config from "../config";

const ProfilePage = ({ currentUser, onLogout, token }) => {
  const { anonymous_id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleUpdateProfile = async (updates) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.REACT_APP_HUB_API_URL}/api/v1/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      const { content } = await response.json();
      setProfileData(content);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const { authData, isOwnProfile } = await fetchProfile(anonymous_id, currentUser, token);
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
  }, [anonymous_id, currentUser, token]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ProfileCard
        currentUser={profileData}
        isOwnProfile={isOwnProfile}
        onUpdate={handleUpdateProfile}
      />
    </AppLayout>
  );
};

export default ProfilePage;