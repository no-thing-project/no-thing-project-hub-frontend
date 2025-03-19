// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import HomeSection from "../sections/HomeSection/HomeSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import { fetchProfileById } from "../utils/profileApi";

const HomePage = ({ currentUser, onLogout, token }) => {
  const { anonymous_id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (anonymous_id) {
          if (!currentUser) {
            throw new Error("Current user is not authenticated");
          }
          const { authData, isOwnProfile } = await fetchProfileById(anonymous_id, currentUser, token);
          setProfileData(authData);
          setIsOwnProfile(isOwnProfile);
        } else {
          setProfileData(currentUser);
          setIsOwnProfile(true);
        }
      } catch (err) {
        setError(err.message || "Failed to load profile");
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
      <HomeSection currentUser={currentUser} profileData={profileData} isOwnProfile={isOwnProfile} />
    </AppLayout>
  );
};

export default HomePage;