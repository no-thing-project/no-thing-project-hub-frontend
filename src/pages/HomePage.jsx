// src/pages/HomePage.jsx
import React, { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import HomeSection from "../sections/HomeSection/HomeSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import useAuth from "../hooks/useAuth";
import useProfile from "../hooks/useProfile";

const HomePage = () => {
  const navigate = useNavigate();
  const { anonymous_id } = useParams();
  const { token, authData: currentUser, isAuthenticated, handleLogout, updateAuthData, loading: authLoading } = useAuth(navigate);
  
  const {
    profileData: fetchedProfileData,
    isOwnProfile: fetchedIsOwnProfile,
    loading: profileLoading,
    error: profileError,
    fetchProfileData,
    clearProfileState,
  } = useProfile(token, currentUser, handleLogout, navigate, updateAuthData);

  const initialAnonymousIdRef = useRef(null);

  useEffect(() => {
    if (currentUser && currentUser.anonymous_id && !initialAnonymousIdRef.current) {
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

      // Якщо anonymous_id є і він не дорівнює поточному користувачу, завантажуємо профіль
      if (anonymous_id && anonymous_id !== initialAnonymousIdRef.current) {
        try {
          console.log("Fetching profile for targetId:", targetId);
          const startTime = Date.now();
          const result = await fetchProfileData(targetId, signal);
          const endTime = Date.now();
          console.log(`Profile fetched in ${endTime - startTime}ms, result:`, result);

          if (!result || !result.profileData) {
            navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Error loading profile in HomePage:", err);
            if (err.message === "Profile not found") {
              navigate("/not-found", { state: { message: `Profile with ID ${targetId} not found.` } });
            }
          }
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [anonymous_id, token, isAuthenticated, authLoading, navigate, fetchProfileData, handleLogout, clearProfileState]);

  // Використовуємо currentUser, якщо це власний профіль і немає anonymous_id
  const isOwnProfile = !anonymous_id || anonymous_id === initialAnonymousIdRef.current;
  const profileData = isOwnProfile ? currentUser : fetchedProfileData;

  const isLoading = authLoading || (anonymous_id && anonymous_id !== initialAnonymousIdRef.current && profileLoading);
  if (isLoading) return <LoadingSpinner />;
  if (profileError) return <ErrorMessage message={profileError} />;
  if (!profileData) return <ErrorMessage message="Profile not found. Please try again or check the profile ID." />;

  console.log("Rendering HomePage with profileData:", profileData);
  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <HomeSection profileData={profileData} isOwnProfile={isOwnProfile} />
    </AppLayout>
  );
};

export default HomePage;