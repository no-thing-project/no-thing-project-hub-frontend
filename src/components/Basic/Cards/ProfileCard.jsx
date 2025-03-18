import React, { useCallback, useState } from "react";
import { Box, Grid, Snackbar, Alert } from "@mui/material";
import axios from "axios";
import config from "../../../config";
import ProfileHeader from "../Headers/ProfileHeader";
import ProfileSection from "../../../sections/ProfileSection/ProfileSection";
import ProfileField from "../Fields/ProfileField";
import NotificationToggle from "../Toggles/NotificationToggle";
import { handleApiError, normalizeUserData } from "../../../utils/profileUtils";
import { containerStyles } from "../../../styles/ProfileStyles";

const ProfileCard = ({ currentUser, isOwnProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(normalizeUserData(currentUser));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = useCallback(
    (field) => (e) => {
      setUserData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const handleSwitchChange = useCallback(
    (section, key) => () => {
      setUserData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [key]: !prev[section][key] },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    try {
      await axios.put(
        `${config.REACT_APP_HUB_API_URL}/api/v1/profile/update`,
        userData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      handleApiError(err, setError);
    }
  }, [userData]);

  const handleCloseSnackbar = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  return (
    <Box sx={containerStyles}>
      <ProfileHeader
        username={userData.username}
        accessLevel={userData.access_level}
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
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Full Name"
                  value={userData.username}
                  field="username"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Anonymous Username"
                  value={userData.anonName}
                  field="anonName"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Email"
                  value={userData.email}
                  field="email"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Location"
                  value={userData.location}
                  field="location"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Timezone"
                  value={userData.timezone}
                  field="timezone"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Ethnicity"
                  value={userData.gender}
                  field="ethnicity"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={[
                    "Prefer not to say",
                    "Caucasian",
                    "Hispanic",
                    "African American",
                    "Asian",
                    "Middle Eastern",
                    "Native American",
                    "Pacific Islander",
                  ]}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Gender"
                  value={userData.gender}
                  field="gender"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Prefer not to say", "She/Her", "He/Him", "They/Them", "Other"]}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Date of Birth"
                  value={userData.birthday}
                  field="birthday"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Contact Number"
                  value={userData.birthday} // Помилка: має бути contactNumber
                  field="contactNumber"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Social Info */}
        <Grid item xs={12} md={3}>
          <ProfileSection title="Social Info">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Language"
                  value={userData.language}
                  field="language"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["English", "Spanish", "French", "German", "Ukranian"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Social Presence"
                  value={userData.socialPresence}
                  field="socialPresence"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Anonymous", "Visible"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Online Status"
                  value={userData.onlineStatus}
                  field="onlineStatus"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Hide", "Visible"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Last Seen"
                  value={userData.lastSeen || userData.onlineStatus} // Виправлено
                  field="lastSeen"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Hide", "Visible"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Name Visibility"
                  value={userData.nameVisibility || userData.onlineStatus} // Виправлено
                  field="nameVisibility"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Hide", "Visible"]}
                />
              </Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Notifications & Preferences */}
        <Grid item xs={12} md={2.5}>
          <ProfileSection title="Notifications">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={12}>
                <NotificationToggle
                  label="Email"
                  checked={userData.notifications.email}
                  onChange={handleSwitchChange("notifications", "email")}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <NotificationToggle
                  label="Push"
                  checked={userData.notifications.push}
                  onChange={handleSwitchChange("notifications", "push")}
                  disabled={true}
                />
              </Grid>
            </Grid>
          </ProfileSection>

          <ProfileSection title="Preferences">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Theme"
                  value={userData.theme}
                  field="theme"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Light", "Dark"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Content Language"
                  value={userData.contentLanguage}
                  field="contentLanguage"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["English", "Spanish", "French", "German", "Ukranian"]}
                />
              </Grid>
            </Grid>
          </ProfileSection>
        </Grid>
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileCard;