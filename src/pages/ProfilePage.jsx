import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { Edit, Refresh } from '@mui/icons-material';
import _ from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import LoadingSpinner from '../components/Layout/LoadingSpinner';
import ProfileCard from '../components/Cards/ProfileCard';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import useProfile from '../hooks/useProfile';
import { actionButtonStyles, cancelButtonStyle } from '../styles/BaseStyles';
import { normalizeUserData } from '../utils/profileUtils';
import { useNotification } from '../context/NotificationContext';
import { useUserExtras } from '../hooks/useUserExtras';

const getChangedFields = (original, updated) => {
  const changes = {};
  const protectedFields = ['total_points', 'donated_points'];
  for (const key in updated) {
    if (Object.prototype.hasOwnProperty.call(updated, key) && !protectedFields.includes(key)) {
      if (!_.isEqual(original[key], updated[key])) {
        changes[key] = updated[key];
      }
    }
  }
  return changes;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { anonymous_id } = useParams();
  const { token, authData: currentUser, isAuthenticated, handleLogout, updateAuthData, loading: authLoading } = useAuth(navigate);
  const {
    profileData: fetchedProfileData,
    pointsHistory,
    loading: profileLoading,
    fetchProfileData,
    fetchProfilePointsHistory,
    updateProfileData,
    clearProfileState,
  } = useProfile(token, currentUser, handleLogout, navigate, updateAuthData);
  const { showNotification } = useNotification();
  const { refreshPrediction } = useUserExtras(token);

  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(() => normalizeUserData(currentUser || fetchedProfileData, currentUser));

  const isOwnProfile = useMemo(() => anonymous_id === currentUser?.anonymous_id, [anonymous_id, currentUser]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      clearProfileState();
      showNotification('Please log in to view your profile.', 'error');
      navigate('/login');
      return;
    }

    if (!anonymous_id) {
      handleLogout('Anonymous ID is missing. Please log in again.');
      showNotification('Anonymous ID is missing.', 'error');
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      try {
        const promises = [];
        if (!isOwnProfile) {
          promises.push(fetchProfileData(anonymous_id, signal));
        }
        if (isOwnProfile) {
          promises.push(fetchProfilePointsHistory(signal));
        }
        await Promise.all(promises);

        const normalizedData = normalizeUserData(isOwnProfile ? currentUser : fetchedProfileData, currentUser);
        if (!normalizedData) {
          showNotification('Profile not found. Please try again or check the profile ID.', 'error');
          navigate('/not-found', { state: { message: `Profile with ID ${anonymous_id} not found.` } });
          return;
        }
        setUserData(normalizedData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading profile data in ProfilePage:', err);
          showNotification(err.message || 'Failed to load profile data', 'error');
          if (err.message === 'Profile not found') {
            navigate('/not-found', { state: { message: `Profile with ID ${anonymous_id} not found.` } });
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
    isOwnProfile,
    navigate,
    fetchProfileData,
    fetchProfilePointsHistory,
    handleLogout,
    clearProfileState,
    fetchedProfileData,
    showNotification,
  ]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = useCallback(async () => {
    const changes = getChangedFields(normalizeUserData(currentUser), userData);

    if (Object.keys(changes).length === 0) {
      showNotification('No changes to save.', 'info');
      setIsEditing(false);
      return;
    }

    try {
      const updatedProfile = await updateProfileData(changes);
      if (updatedProfile) {
        const normalizedProfile = normalizeUserData(updatedProfile, currentUser);
        setUserData(normalizedProfile);
        updateAuthData(normalizedProfile);
        showNotification('Profile updated successfully!', 'success');
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update profile', 'error');
    }
  }, [userData, currentUser, updateProfileData, updateAuthData, showNotification]);

  const handleCancelEdit = () => {
    setUserData(normalizeUserData(currentUser));
    setIsEditing(false);
  };

  const handleUpdatePrediction = () => {
    refreshPrediction();
    showNotification('Prediction updated!', 'success');
  };

  const isLoading = authLoading || (!isOwnProfile && profileLoading);

  if (isLoading) return <LoadingSpinner />;

  if (!userData) return null;

  return (
    <AppLayout currentUser={currentUser} onLogout={handleLogout} token={token}>
      <Box sx={{ maxWidth: 1500, margin: '0 auto', p: { xs: 1, sm: 2 } }}>
        <ProfileHeader user={userData} isOwnProfile={isOwnProfile}>
          {isOwnProfile && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {!isEditing ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleEditProfile}
                    startIcon={<Edit />}
                    sx={{ ...actionButtonStyles, minWidth: { xs: '100px', sm: '120px' } }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpdatePrediction}
                    startIcon={<Refresh />}
                    sx={{ ...actionButtonStyles, minWidth: { xs: '100px', sm: '120px' } }}
                  >
                    Update Prediction
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    sx={{ ...actionButtonStyles, minWidth: { xs: '100px', sm: '120px' } }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCancelEdit}
                    sx={{ ...cancelButtonStyle, minWidth: { xs: '100px', sm: '120px' } }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          )}
        </ProfileHeader>
        <ProfileCard
          profileData={userData}
          isOwnProfile={isOwnProfile}
          pointsHistory={pointsHistory}
          isEditing={isEditing}
          setUserData={setUserData}
        />
      </Box>
    </AppLayout>
  );
};

export default ProfilePage;