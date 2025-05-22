import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';
import { Edit, Refresh } from '@mui/icons-material';
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
      const originalValue = original[key];
      const updatedValue = updated[key];

      if (typeof updatedValue === 'object' && updatedValue !== null && !Array.isArray(updatedValue)) {
        const nestedChanges = getChangedFields(originalValue || {}, updatedValue);
        if (Object.keys(nestedChanges).length > 0) {
          changes[key] = nestedChanges;
        }
      } else if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changes[key] = updatedValue;
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

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !currentUser || !token) {
      clearProfileState();
      showNotification('Please log in to view your profile.', 'error');
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      if (!anonymous_id) {
        handleLogout('Anonymous ID is missing. Please log in again.');
        showNotification('Anonymous ID is missing.', 'error');
        return;
      }

      const isOwnProfile = anonymous_id === currentUser.anonymous_id;

      try {
        const promises = [];
        if (!isOwnProfile) {
          promises.push(fetchProfileData(anonymous_id, signal));
        }
        if (isOwnProfile) {
          promises.push(fetchProfilePointsHistory(signal));
        }
        await Promise.all(promises);

        const normalizedData = normalizeUserData(isOwnProfile ? currentUser : fetchedProfileData, isOwnProfile ? currentUser : fetchedProfileData);
        if (!normalizedData) {
          showNotification('Profile not found. Please try again or check the profile ID.', 'error');
          navigate('/not-found', { state: { message: `Profile with ID ${anonymous_id} not found.` } });
          return;
        }
        setUserData(normalizedData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading profile data in ProfilePage:', err);
          if (err.message === 'Profile not found') {
            showNotification(`Profile with ID ${anonymous_id} not found.`, 'error');
            navigate('/not-found', { state: { message: `Profile with ID ${anonymous_id} not found.` } });
          } else {
            showNotification(err.message || 'Failed to load profile data', 'error');
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
    fetchedProfileData,
    showNotification,
  ]);

  const isOwnProfile = anonymous_id === currentUser?.anonymous_id;

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
      <Box sx={{ maxWidth: 1500, margin: '0 auto', p: 2 }}>
        <ProfileHeader user={userData} isOwnProfile={isOwnProfile}>
          {isOwnProfile && (
            <>
              {!isEditing ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleEditProfile}
                    startIcon={<Edit />}
                    sx={{ ...actionButtonStyles, mr: 1 }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpdatePrediction}
                    startIcon={<Refresh />}
                    sx={actionButtonStyles}
                  >
                    Update Prediction
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSaveProfile}
                    sx={{ ...actionButtonStyles, mr: 1 }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleCancelEdit}
                    sx={cancelButtonStyle}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
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