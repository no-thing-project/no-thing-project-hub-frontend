import { useState, useCallback, useMemo } from 'react';
import {
  fetchProfile,
  updateProfile,
  deleteProfile,
  fetchPointsHistory,
} from '../api/profileApi';

const useProfile = (token, currentUser, onLogout, navigate, updateAuthData) => {
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401 || err.status === 403) {
        onLogout('Your session has expired. Please log in again.');
        navigate('/login');
        throw new Error('Session expired');
      }
      throw err;
    },
    [onLogout, navigate]
  );

  const clearProfileState = useCallback(() => {
    setProfileData(null);
    setIsOwnProfile(false);
    setPointsHistory([]);
    setError(null);
    setLoading(false);
  }, []);

  const fetchProfileData = useCallback(
    async (anonymous_id, signal) => {
      if (!token || !currentUser?.anonymous_id) {
        throw new Error('Authentication required');
      }
      if (!anonymous_id) {
        throw new Error('Profile ID is required');
      }

      setLoading(true);
      try {
        const profile = await fetchProfile(anonymous_id, token, signal);
        const existingPoints = profileData || currentUser;
        profile.total_points = Number(profile.total_points) >= 0 ? Number(profile.total_points) : (existingPoints?.total_points ?? 0);
        profile.donated_points = Number(profile.donated_points) >= 0 ? Number(profile.donated_points) : (existingPoints?.donated_points ?? 0);
        const isOwn = anonymous_id === currentUser.anonymous_id;
        setProfileData(profile);
        setIsOwnProfile(isOwn);
        if (isOwn && JSON.stringify(profile) !== JSON.stringify(currentUser)) {
          updateAuthData(profile);
        }
        return { profileData: profile, isOwnProfile: isOwn };
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch profile');
          handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, updateAuthData, handleAuthError, profileData]
  );

  const updateProfileData = useCallback(
    async (updates, signal) => {
      if (!token) {
        throw new Error('Token missing');
      }
      setLoading(true);
      try {
        const updatedProfile = await updateProfile(updates, token, signal);
        const existingPoints = profileData || currentUser;
        const mergedProfile = {
          ...profileData,
          ...updatedProfile,
          total_points: Number(updatedProfile.total_points) >= 0 ? Number(updatedProfile.total_points) : (existingPoints?.total_points ?? 0),
          donated_points: Number(updatedProfile.donated_points) >= 0 ? Number(updatedProfile.donated_points) : (existingPoints?.donated_points ?? 0),
        };
        setProfileData(mergedProfile);
        if (isOwnProfile) {
          updateAuthData(mergedProfile);
        }
        return mergedProfile;
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to update profile');
          throw err;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, isOwnProfile, updateAuthData, profileData, currentUser]
  );

  const deleteProfileData = useCallback(
    async (signal) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      setLoading(true);
      try {
        await deleteProfile(token, signal);
        clearProfileState();
        onLogout('Your profile has been deleted.');
        navigate('/');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to delete profile');
          handleAuthError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [token, onLogout, navigate, clearProfileState, handleAuthError]
  );

  const fetchProfilePointsHistory = useCallback(
    async (signal) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      setLoading(true);
      try {
        const history = await fetchPointsHistory(token, signal);
        setPointsHistory(history);
        return history;
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch points history');
          handleAuthError(err);
        }
        return [];
      } finally {
        setLoading(false);
      }
    },
    [token, handleAuthError]
  );

  return useMemo(
    () => ({
      profileData,
      isOwnProfile,
      pointsHistory,
      loading,
      error,
      fetchProfileData,
      updateProfileData,
      deleteProfileData,
      fetchProfilePointsHistory,
      clearProfileState,
    }),
    [
      profileData,
      isOwnProfile,
      pointsHistory,
      loading,
      error,
      fetchProfileData,
      updateProfileData,
      deleteProfileData,
      fetchProfilePointsHistory,
      clearProfileState,
    ]
  );
};

export default useProfile;