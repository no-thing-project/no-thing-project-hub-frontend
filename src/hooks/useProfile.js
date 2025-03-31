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
        navigate('/login', { replace: true });
        throw new Error('Session expired');
      }
      setError(err.message || 'An error occurred');
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
        setError('Authentication required');
        return null;
      }
      if (!anonymous_id) {
        setError('Profile ID is required');
        return null;
      }

      setLoading(true);
      try {
        const profile = await fetchProfile(anonymous_id, token, signal);
        const isOwn = anonymous_id === currentUser.anonymous_id;
        setProfileData(profile);
        setIsOwnProfile(isOwn);
        if (isOwn && JSON.stringify(profile) !== JSON.stringify(currentUser)) {
          updateAuthData(profile);
          console.log("fetchProfileData updated authData with:", profile);
        }
        return { profileData: profile, isOwnProfile: isOwn };
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, currentUser, updateAuthData, handleAuthError]
  );

  const updateProfileData = useCallback(
    async (updates, signal) => {
      if (!token) {
        setError('Token missing');
        return null;
      }
      setLoading(true);
      try {
        const updatedProfile = await updateProfile(updates, token, signal);
        console.log("updateProfileData received from server:", updatedProfile);
        setProfileData(updatedProfile);
        if (isOwnProfile) {
          updateAuthData(updatedProfile);
          console.log("updateProfileData updated authData with:", updatedProfile);
        }
        return updatedProfile;
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleAuthError(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, isOwnProfile, updateAuthData, handleAuthError]
  );

  const deleteProfileData = useCallback(
    async (signal) => {
      if (!token) {
        setError('Authentication required');
        return;
      }
      setLoading(true);
      try {
        await deleteProfile(token, signal);
        clearProfileState();
        onLogout('Your profile has been deleted.');
        navigate('/', { replace: true });
      } catch (err) {
        if (err.name !== 'AbortError') {
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
        setError('Authentication required');
        return [];
      }
      setLoading(true);
      try {
        const history = await fetchPointsHistory(token, signal);
        setPointsHistory(history);
        return history;
      } catch (err) {
        if (err.name !== 'AbortError') {
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