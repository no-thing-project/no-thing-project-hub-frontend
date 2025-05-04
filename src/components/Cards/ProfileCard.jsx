// src/components/Cards/ProfileCard.jsx
import React, { useCallback } from "react";
import { Box, List, ListItem, ListItemText, Grid2 } from "@mui/material";
import ProfileSection from "../../sections/ProfileSection/ProfileSection";
import ProfileField from "../Fields/ProfileField";
import NotificationToggle from "../Toggles/NotificationToggle";
import { containerStyles } from "../../styles/ProfileStyles";

const ProfileCard = ({
  profileData,
  isOwnProfile,
  pointsHistory,
  isEditing,
  setUserData,
}) => {
  const handleChange = useCallback(
    (field, subfield) => (e) => {
      const value = e.target.value;
      setUserData(prev => {
        if (subfield) {
          return { ...prev, [field]: { ...prev[field], [subfield]: value } };
        }
        if (field === "onlineStatus" || field === "isPublic") {
          return {
            ...prev,
            [field]:
              value === "Visible"
                ? true
                : value === "Hide" || value === "Anonymous"
                ? false
                : prev[field],
          };
        }
        if (field === "lastSeen") {
          return { ...prev, [field]: value === "Visible" ? new Date() : null };
        }
        return { ...prev, [field]: value };
      });
    },
    [setUserData]
  );

  const handleSwitchChange = useCallback(
    (section, key) => () => {
      setUserData(prev => ({
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
    [setUserData]
  );

  return (
    <Box
      sx={{
        ...containerStyles,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 3,
        rowGap: 0
      }}
    >
      {/* Personal Info */}
      <Box sx={{ display: "flex" }}>
        <ProfileSection
          title="Personal Info"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <Grid2 container spacing={3} sx={{ flex: 1 }}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Full Name"
                value={profileData.fullName || ""}
                field="fullName"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Username"
                value={profileData.username || ""}
                field="username"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Email"
                value={profileData.email || ""}
                field="email"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Location"
                value={profileData.location || ""}
                field="location"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Timezone"
                value={profileData.timezone || ""}
                field="timezone"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["UTC-12:00", "UTC+00:00", "UTC+14:00"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Ethnicity"
                value={profileData.ethnicity || ""}
                field="ethnicity"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Asian", "Black", "Other"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Gender"
                value={profileData.gender || ""}
                field="gender"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Male", "Female", "Other"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Date of Birth"
                value={
                  profileData.dateOfBirth
                    ? new Date(profileData.dateOfBirth)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                field="dateOfBirth"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                type="date"
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Contact Number"
                value={profileData.phone || ""}
                field="phone"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Wallet Address"
                value={profileData.wallet_address || ""}
                field="wallet_address"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
          </Grid2>
        </ProfileSection>
      </Box>

      {/* Social Info */}
      <Box sx={{ display: "flex" }}>
        <ProfileSection
          title="Social Info"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <Grid2 container spacing={3} sx={{ flex: 1 }}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Language"
                value={profileData.preferences?.language || ""}
                field="preferences"
                subfield="language"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["en", "ua", "es"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Public Profile"
                value={profileData.isPublic ? "Visible" : "Anonymous"}
                field="isPublic"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Anonymous", "Visible"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Online Status"
                value={profileData.onlineStatus ? "Visible" : "Hide"}
                field="onlineStatus"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Hide", "Visible"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Last Seen"
                value={profileData.lastSeen ? "Visible" : "Hide"}
                field="lastSeen"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Hide", "Visible"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Name Visibility"
                value={profileData.nameVisibility || ""}
                field="nameVisibility"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
                select
                options={["Public", "Friends", "Private"]}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Twitter"
                value={profileData.social_links?.twitter || ""}
                field="social_links"
                subfield="twitter"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="Instagram"
                value={profileData.social_links?.instagram || ""}
                field="social_links"
                subfield="instagram"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <ProfileField
                label="LinkedIn"
                value={profileData.social_links?.linkedin || ""}
                field="social_links"
                subfield="linkedin"
                isEditing={isEditing && isOwnProfile}
                onChange={handleChange}
              />
            </Grid2>
          </Grid2>
        </ProfileSection>
      </Box>

      {/* Notifications & Preferences */}
      <Box sx={{ gridColumn: "2", display: "flex" }}>
        <ProfileSection
          title="Notifications & Preferences"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <Grid2 container spacing={3} sx={{ flex: 1 }}>
            <Grid2 size={{ xs: 12, md: 6}}>
              <Grid2 container spacing={4}>
                <Grid2 size={12}>
                  <NotificationToggle
                    label="Email"
                    checked={profileData.preferences?.notifications?.email || false}
                    onChange={handleSwitchChange("preferences", "email")}
                    disabled={!isEditing || !isOwnProfile}
                  />
                </Grid2>
                <Grid2 size={12}>
                  <NotificationToggle
                    label="SMS"
                    checked={profileData.preferences?.notifications?.sms || false}
                    onChange={handleSwitchChange("preferences", "sms")}
                    disabled={!isEditing || !isOwnProfile}
                  />
                </Grid2>
                <Grid2 size={12}>
                  <NotificationToggle
                    label="Push"
                    checked={profileData.preferences?.notifications?.push || false}
                    onChange={handleSwitchChange("preferences", "push")}
                    disabled={!isEditing || !isOwnProfile}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Grid2 container spacing={3}>
                <Grid2 size={12}>
                  <ProfileField
                    label="Theme"
                    value={profileData.preferences?.theme || ""}
                    field="preferences"
                    subfield="theme"
                    isEditing={isEditing && isOwnProfile}
                    onChange={handleChange}
                    select
                    options={["Light", "Dark", "System"]}
                  />
                </Grid2>
                <Grid2 size={12}>
                  <ProfileField
                    label="Content Language"
                    value={profileData.preferences?.contentLanguage || ""}
                    field="preferences"
                    subfield="contentLanguage"
                    isEditing={isEditing && isOwnProfile}
                    onChange={handleChange}
                    select
                    options={["en", "ua", "es"]}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
          </Grid2>
        </ProfileSection>
      </Box>

      {/* Points History */}
      {isOwnProfile && pointsHistory?.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1", display: "flex" }}>
          <ProfileSection
            title="Points History"
            sx={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <List>
                {pointsHistory.map((entry, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={`Points: ${entry.points}`}
                      secondary={`Reason: ${entry.reason} | Date: ${new Date(
                        entry.created_at
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </ProfileSection>
        </Box>
      )}
    </Box>
  );
};

export default ProfileCard;
