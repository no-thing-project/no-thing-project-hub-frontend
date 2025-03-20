// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import ProfileCard from "../components/Cards/ProfileCard";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { anonymous_id } = useParams();
  const { token, authData: currentUser, isAuthenticated, handleLogout, updateAuthData, loading: authLoading } = useAuth(navigate);
  const {
    profileData: fetchedProfileData,
    setProfileData,
    isOwnProfile: fetchedIsOwnProfile,
    pointsHistory,
    loading: profileLoading,
    error: profileError,
    fetchProfileData,
    fetchProfilePointsHistory,
    updateProfileData,
    clearProfileState,
  } = useProfile(token, currentUser, handleLogout, navigate, updateAuthData);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      clearProfileState();
      navigate("/login");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      if (!anonymous_id) {
        handleLogout("Anonymous ID is missing. Please log in again.");
        return;
      }

      const isOwnProfile = anonymous_id === currentUser.anonymous_id;

      try {
        const promises = [];

        // Завантажуємо профіль лише для чужих сторінок
        if (!isOwnProfile) {
          promises.push(fetchProfileData(anonymous_id, signal));
        }

        // Завантажуємо історію балів лише для власного профілю
        if (isOwnProfile) {
          promises.push(fetchProfilePointsHistory(signal));
        }

        await Promise.all(promises);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading profile data in ProfilePage:", err);
          if (err.message === "Profile not found") {
            navigate("/not-found", { state: { message: `Profile with ID ${anonymous_id} not found.` } });
          }
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [
    anonymous_id,
    currentUser,
    token,
    isAuthenticated,
    authLoading,
    navigate,
    fetchProfileData,
    fetchProfilePointsHistory,
    handleLogout,
    clearProfileState,
  ]);

  const isOwnProfile = anonymous_id === currentUser?.anonymous_id;
  const profileData = isOwnProfile ? currentUser : fetchedProfileData;

  const isLoading = authLoading || (!isOwnProfile && profileLoading);
  const error = profileError;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profileData) return <ErrorMessage message="Profile not found. Please try again or check the profile ID." />;

  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <ProfileCard
        profileData={profileData}
        isOwnProfile={isOwnProfile}
        pointsHistory={pointsHistory}
        onUpdate={updateProfileData}
      />
    </AppLayout>
  );
};

export default ProfilePage;