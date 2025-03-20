// src/components/Cards/ProfileCard.jsx
import React, { useCallback, useState } from "react";
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import { MarkEmailRead, Delete, Send } from "@mui/icons-material";
import ProfileHeader from "../Headers/ProfileHeader";
import ProfileSection from "../../sections/ProfileSection/ProfileSection";
import ProfileField from "../Fields/ProfileField";
import NotificationToggle from "../Toggles/NotificationToggle";
import { containerStyles } from "../../styles/ProfileStyles";
import { normalizeUserData } from "../../utils/profileUtils";

const ProfileCard = ({
  profileData,
  isOwnProfile,
  pointsHistory,
  messages,
  onUpdate,
  onSendMessage,
  onMarkMessageAsRead,
  onDeleteMessage,
  onGetMessages,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(() => normalizeUserData(profileData));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [messageContent, setMessageContent] = useState("");

  // Update userData when profileData changes
  React.useEffect(() => {
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

  const handleSendMessage = useCallback(async () => {
    if (!messageContent.trim()) {
      setError("Message content cannot be empty");
      return;
    }
    try {
      await onSendMessage(profileData.anonymous_id, messageContent);
      setSuccess("Message sent successfully!");
      setMessageContent("");
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    }
  }, [messageContent, onSendMessage, profileData]);

  const handleCloseSnackbar = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  // Validate onUpdate prop
  if (!onUpdate || typeof onUpdate !== "function") {
    console.error("onUpdate prop is not a function. Received:", onUpdate);
    return (
      <div>
        Error: onUpdate prop is missing or invalid. Please check the parent component (ProfilePage).
      </div>
    );
  }

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
                  value={userData.fullName}
                  field="fullName"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Username"
                  value={userData.username}
                  field="username"
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
                  select
                  options={[
                    "UTC-12:00",
                    "UTC-11:00",
                    "UTC-10:00",
                    "UTC-09:00",
                    "UTC-08:00",
                    "UTC-07:00",
                    "UTC-06:00",
                    "UTC-05:00",
                    "UTC-04:00",
                    "UTC-03:00",
                    "UTC-02:00",
                    "UTC-01:00",
                    "UTC+00:00",
                    "UTC+01:00",
                    "UTC+02:00",
                    "UTC+03:00",
                    "UTC+04:00",
                    "UTC+05:00",
                    "UTC+06:00",
                    "UTC+07:00",
                    "UTC+08:00",
                    "UTC+09:00",
                    "UTC+10:00",
                    "UTC+11:00",
                    "UTC+12:00",
                    "UTC+13:00",
                    "UTC+14:00",
                  ]}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Ethnicity"
                  value={userData.ethnicity}
                  field="ethnicity"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={[
                    "Asian",
                    "Black",
                    "Hispanic",
                    "White",
                    "Native American",
                    "Pacific Islander",
                    "Mixed",
                    "Other",
                    "Prefer not to say",
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
                  options={["Male", "Female", "Non-binary", "Other", "Prefer not to say"]}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Date of Birth"
                  value={
                    userData.dateOfBirth
                      ? new Date(userData.dateOfBirth).toISOString().split("T")[0]
                      : ""
                  }
                  field="dateOfBirth"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  type="date"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Contact Number"
                  value={userData.phone}
                  field="phone"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ProfileField
                  label="Wallet Address"
                  value={userData.wallet_address}
                  field="wallet_address"
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
                  value={userData.preferences.language}
                  field="preferences"
                  subfield="language"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["en", "ua", "es", "fr"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Public Profile"
                  value={userData.isPublic ? "Visible" : "Anonymous"}
                  field="isPublic"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Anonymous", "Visible"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Online Status"
                  value={userData.onlineStatus ? "Visible" : "Hide"}
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
                  value={userData.lastSeen ? "Visible" : "Hide"}
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
                  value={userData.nameVisibility}
                  field="nameVisibility"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Public", "Friends", "Private"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Twitter"
                  value={userData.social_links.twitter}
                  field="social_links"
                  subfield="twitter"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Instagram"
                  value={userData.social_links.instagram}
                  field="social_links"
                  subfield="instagram"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="LinkedIn"
                  value={userData.social_links.linkedin}
                  field="social_links"
                  subfield="linkedin"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
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
                  checked={userData.preferences.notifications.email}
                  onChange={handleSwitchChange("preferences", "email")}
                  disabled={!isEditing || !isOwnProfile}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <NotificationToggle
                  label="SMS"
                  checked={userData.preferences.notifications.sms}
                  onChange={handleSwitchChange("preferences", "sms")}
                  disabled={!isEditing || !isOwnProfile}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <NotificationToggle
                  label="Push"
                  checked={userData.preferences.notifications.push}
                  onChange={handleSwitchChange("preferences", "push")}
                  disabled={!isEditing || !isOwnProfile}
                />
              </Grid>
            </Grid>
          </ProfileSection>

          <ProfileSection title="Preferences">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Theme"
                  value={userData.preferences.theme}
                  field="preferences"
                  subfield="theme"
                  isEditing={isEditing && isOwnProfile}
                  onChange={handleChange}
                  select
                  options={["Light", "Dark", "System"]}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <ProfileField
                  label="Content Language"
                  value={userData.preferences.contentLanguage}
                  field="preferences"
                  subfield="contentLanguage"
                  onChange={handleChange}
                  isEditing={isEditing && isOwnProfile}
                  select
                  options={["en", "ua", "es", "fr"]}
                />
              </Grid>
            </Grid>
          </ProfileSection>
        </Grid>

        {/* Points History (only for own profile) */}
        {isOwnProfile && pointsHistory.length > 0 && (
          <Grid item xs={12}>
            <ProfileSection title="Points History">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <List>
                    {pointsHistory.map((entry, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`Points: ${entry.points}`}
                          secondary={`Reason: ${entry.reason} | Date: ${new Date(
                            entry.created_at
                          ).toLocaleDateString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </ProfileSection>
          </Grid>
        )}

        {/* Messages Section */}
        <Grid item xs={12}>
          <ProfileSection title={isOwnProfile ? "Your Messages" : "Send a Message"}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {isOwnProfile ? (
                  messages.length > 0 ? (
                    <List>
                      {messages.map((message) => (
                        <React.Fragment key={message._id}>
                          <ListItem
                            secondaryAction={
                              <>
                                {!message.is_read && (
                                  <IconButton
                                    edge="end"
                                    onClick={() => onMarkMessageAsRead(message._id)}
                                  >
                                    <MarkEmailRead />
                                  </IconButton>
                                )}
                                <IconButton
                                  edge="end"
                                  onClick={() => onDeleteMessage(message._id)}
                                >
                                  <Delete />
                                </IconButton>
                              </>
                            }
                          >
                            <ListItemText
                              primary={message.content}
                              secondary={`From: ${
                                message.sender_id === profileData?.anonymous_id
                                  ? "You"
                                  : message.sender_id
                              } | Date: ${new Date(message.created_at).toLocaleDateString()}`}
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box>No messages available.</Box>
                  )
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Message"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        margin="normal"
                      />
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleSendMessage}
                        disabled={!messageContent.trim()}
                      >
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                )}
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