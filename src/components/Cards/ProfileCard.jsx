// src/components/Cards/ProfileCard.jsx
import React, { useCallback, useState, useEffect } from "react";
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import ProfileHeader from "../Headers/ProfileHeader";
import ProfileSection from "../../sections/ProfileSection/ProfileSection";
import ProfileField from "../Fields/ProfileField";
import NotificationToggle from "../Toggles/NotificationToggle";
import { containerStyles } from "../../styles/ProfileStyles";
import { normalizeUserData } from "../../utils/profileUtils";

const ProfileCard = ({ profileData, isOwnProfile, pointsHistory, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(() => normalizeUserData(profileData));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setUserData(normalizeUserData(profileData));
  }, [profileData]);

  const handleChange = useCallback(
    (field, subfield) => (e) => {
      const value = e.target.value;
      if (subfield) {
        setUserData((prev) => ({
          ...prev,
          [field]: { ...prev[field], [subfield]: value },
        }));
      } else if (field === "onlineStatus" || field === "isPublic") {
        setUserData((prev) => ({
          ...prev,
          [field]: value === "Visible" ? true : value === "Hide" || value === "Anonymous" ? false : prev[field],
        }));
      } else if (field === "lastSeen") {
        setUserData((prev) => ({
          ...prev,
          [field]: value === "Visible" ? new Date() : null,
        }));
      } else {
        setUserData((prev) => ({ ...prev, [field]: value }));
      }
    },
    []
  );

  const handleSwitchChange = useCallback(
    (section, key) => () => {
      setUserData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          notifications: {
            ...prev[section].notifications,
            [key]: !prev[section].notifications[key],
          },
        },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    const updates = {
      username: userData.username,
      fullName: userData.fullName,
      bio: userData.bio,
      email: userData.email,
      phone: userData.phone,
      wallet_address: userData.wallet_address,
      profile_picture: userData.profile_picture,
      isPublic: userData.isPublic,
      social_links: userData.social_links,
      timezone: userData.timezone,
      gender: userData.gender,
      location: userData.location,
      ethnicity: userData.ethnicity,
      dateOfBirth: userData.dateOfBirth,
      nameVisibility: userData.nameVisibility,
      preferences: userData.preferences,
      onlineStatus: userData.onlineStatus,
    };
    try {
      const updatedProfile = await onUpdate(updates);
      if (updatedProfile) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError("Failed to update profile");
      console.error("Error updating profile:", err);
    }
  }, [userData, onUpdate]);

  const handleCloseSnackbar = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  if (!onUpdate || typeof onUpdate !== "function") {
    console.error("onUpdate prop is not a function. Received:", onUpdate);
    return <div>Error: onUpdate prop is missing or invalid.</div>;
  }

  return (
    <Box sx={containerStyles}>
      <ProfileHeader
        user={userData}
        isEditing={isEditing}
        isOwnProfile={isOwnProfile}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />

      <Grid container spacing={3}>
        {/* Personal Info */}
        <Grid item xs={12} md={6.5}>
          <ProfileSection title="Personal Info">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><ProfileField label="Full Name" value={userData.fullName || ""} field="fullName" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Username" value={userData.username || ""} field="username" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Email" value={userData.email || ""} field="email" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Location" value={userData.location || ""} field="location" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Timezone" value={userData.timezone || ""} field="timezone" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["UTC-12:00", "UTC+00:00", "UTC+14:00"]} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Ethnicity" value={userData.ethnicity || ""} field="ethnicity" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Asian", "Black", "Other"]} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Gender" value={userData.gender || ""} field="gender" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Male", "Female", "Other"]} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Date of Birth" value={userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split("T")[0] : ""} field="dateOfBirth" isEditing={isEditing && isOwnProfile} onChange={handleChange} type="date" /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Contact Number" value={userData.phone || ""} field="phone" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12} sm={6}><ProfileField label="Wallet Address" value={userData.wallet_address || ""} field="wallet_address" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Social Info */}
        <Grid item xs={12} md={3}>
          <ProfileSection title="Social Info">
            <Grid container spacing={2}>
              <Grid item xs={12}><ProfileField label="Language" value={userData.preferences?.language || ""} field="preferences" subfield="language" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["en", "ua", "es"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Public Profile" value={userData.isPublic ? "Visible" : "Anonymous"} field="isPublic" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Anonymous", "Visible"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Online Status" value={userData.onlineStatus ? "Visible" : "Hide"} field="onlineStatus" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Hide", "Visible"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Last Seen" value={userData.lastSeen ? "Visible" : "Hide"} field="lastSeen" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Hide", "Visible"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Name Visibility" value={userData.nameVisibility || ""} field="nameVisibility" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Public", "Friends", "Private"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Twitter" value={userData.social_links?.twitter || ""} field="social_links" subfield="twitter" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12}><ProfileField label="Instagram" value={userData.social_links?.instagram || ""} field="social_links" subfield="instagram" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
              <Grid item xs={12}><ProfileField label="LinkedIn" value={userData.social_links?.linkedin || ""} field="social_links" subfield="linkedin" isEditing={isEditing && isOwnProfile} onChange={handleChange} /></Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Notifications & Preferences */}
        <Grid item xs={12} md={2.5}>
          <ProfileSection title="Notifications">
            <Grid container spacing={3}>
              <Grid item xs={12}><NotificationToggle label="Email" checked={userData.preferences?.notifications?.email || false} onChange={handleSwitchChange("preferences", "email")} disabled={!isEditing || !isOwnProfile} /></Grid>
              <Grid item xs={12}><NotificationToggle label="SMS" checked={userData.preferences?.notifications?.sms || false} onChange={handleSwitchChange("preferences", "sms")} disabled={!isEditing || !isOwnProfile} /></Grid>
              <Grid item xs={12}><NotificationToggle label="Push" checked={userData.preferences?.notifications?.push || false} onChange={handleSwitchChange("preferences", "push")} disabled={!isEditing || !isOwnProfile} /></Grid>
            </Grid>
          </ProfileSection>
          <ProfileSection title="Preferences">
            <Grid container spacing={2}>
              <Grid item xs={12}><ProfileField label="Theme" value={userData.preferences?.theme || ""} field="preferences" subfield="theme" isEditing={isEditing && isOwnProfile} onChange={handleChange} select options={["Light", "Dark", "System"]} /></Grid>
              <Grid item xs={12}><ProfileField label="Content Language" value={userData.preferences?.contentLanguage || ""} field="preferences" subfield="contentLanguage" onChange={handleChange} isEditing={isEditing && isOwnProfile} select options={["en", "ua", "es"]} /></Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Points History */}
        {isOwnProfile && pointsHistory?.length > 0 && (
          <Grid item xs={12}>
            <ProfileSection title="Points History">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <List>
                    {pointsHistory.map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Points: ${entry.points}`}
                          secondary={`Reason: ${entry.reason} | Date: ${new Date(entry.created_at).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </ProfileSection>
          </Grid>
        )}
      </Grid>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileCard;