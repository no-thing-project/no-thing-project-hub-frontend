// src/pages/HomePage.jsx
import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import HomeSection from "../sections/HomeSection/HomeSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";
import { useNotification } from "../context/NotificationContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { anonymous_id } = useParams();
  const { token, authData: currentUser, isAuthenticated, handleLogout, updateAuthData, loading: authLoading } = useAuth(navigate);
  
  const {
    profileData: fetchedProfileData,
    loading: profileLoading,
    error: profileError,
    fetchProfileData,
    clearProfileState,
  } = useProfile(token, currentUser, handleLogout, navigate, updateAuthData);

  const initialAnonymousIdRef = useRef(null);

  useEffect(() => {
    if (currentUser?.anonymous_id && !initialAnonymousIdRef.current) {
      initialAnonymousIdRef.current = currentUser.anonymous_id;
    }
  }, [currentUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      clearProfileState();
      navigate("/login");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadProfile = async () => {
      if (!initialAnonymousIdRef.current) {
        handleLogout("User data is incomplete. Please log in again.");
        return;
      }

      const targetId = anonymous_id || initialAnonymousIdRef.current;

      if (anonymous_id && anonymous_id !== initialAnonymousIdRef.current) {
        try {
          const result = await fetchProfileData(targetId, signal);
          if (!result?.profileData) {
            navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            if (err.message === "Profile not found") {
              navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
            } else {
              showNotification(err.message || "Failed to load profile", "error");
            }
          }
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [anonymous_id, currentUser, token, isAuthenticated, authLoading, navigate, fetchProfileData, handleLogout, clearProfileState, showNotification]);

  useEffect(() => {
    if (profileError) {
      showNotification(profileError, "error");
    }
  }, [profileError, showNotification]);

  const isOwnProfile = !anonymous_id || anonymous_id === initialAnonymousIdRef.current;
  const profileData = isOwnProfile ? currentUser : fetchedProfileData;

  const isLoading = authLoading || (anonymous_id && anonymous_id !== initialAnonymousIdRef.current && profileLoading);
  if (isLoading) return <LoadingSpinner />;
  if (!profileData) return null;

  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <HomeSection profileData={profileData} isOwnProfile={isOwnProfile} />
    </AppLayout>
  );
};

export default HomePage;
