import { Edit, Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useCallback, useState } from "react";
import config from "../../../../config";
import StatusBadge from "../../../basic/badges/StatusBadge";

/**
 * Кастомні стилі для тоглів (Switch), щоб виглядали як на скріні
 */
const customSwitchSx = {
  width: 42,
  height: 24,
  padding: 0,
  "&:active .MuiSwitch-thumb": {
    width: 15,
  },
  "& .MuiSwitch-switchBase": {
    padding: 0.25,
    "&.Mui-checked": {
      transform: "translateX(18px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "background.button",
        opacity: 1,
      },
    },
    "&.Mui-disabled": {
      color: "#9e9e9e",
      "& + .MuiSwitch-track": {
        backgroundColor: "background.toggleDisabled",
        opacity: 1,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    width: 20,
    height: 20,
    borderRadius: 10,
    transition: "all 0.2s ease",
    backgroundColor: "background.default",
    "&.Mui-disabled": {
      backgroundColor: "background.default",
      boxShadow: "none",
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: 12,
    backgroundColor: "background.toggleOff",
    opacity: 1,
    transition: "all 0.2s ease",
    "&.Mui-disabled": {
      backgroundColor: "background.toggleDisabled",
      opacity: 0.7,
    },
  },
};

/**
 * Поле профілю (label + value або <TextField> при редагуванні)
 * Якщо переданий пропс `select` та `options`, рендериться як селект.
 */
const ProfileField = ({
  label,
  value,
  field,
  isEditing,
  onChange,
  editSx = {},
  select = false,
  options = [],
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
      {label}
    </Typography>
    {isEditing ? (
      select ? (
        <TextField
          select
          fullWidth
          variant="outlined"
          size="small"
          value={value || ""}
          onChange={onChange(field)}
          sx={{
            // Прибираємо рамки
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            backgroundColor: "background.default",
            borderRadius: 0.8,
            ...editSx,
          }}
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={value || ""}
          onChange={onChange(field)}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            backgroundColor: "background.default",
            borderRadius: 0.8,
            ...editSx,
          }}
        />
      )
    ) : (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {value || "Not set"}
      </Typography>
    )}
  </Box>
);

/**
 * Головний компонент профілю
 */
const ProfileCard = React.memo(({ currentUser, isOwnProfile }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Стан користувача
  const [userData, setUserData] = useState({
    username: currentUser.username || "-",
    anonName: currentUser.anonName || "-",
    email: currentUser.email || "-",
    location: currentUser.location || "-",
    timezone: currentUser.timezone || "-",
    gender: currentUser.gender || "-",
    birthday: currentUser.dateOfBirth || "-",
    bio: currentUser.bio || "",
    language: currentUser.language || "-",
    socialPresence: currentUser.socialPresence || "-",
    onlineStatus: currentUser.onlineStatus || "-",
    isPublic: currentUser.isPublic || false,
    theme: currentUser.theme || "-",
    contentLanguage: currentUser.contentLanguage || "-",
    notifications: {
      email: currentUser.preferences?.notifications?.email ?? true,
      push: currentUser.preferences?.notifications?.push ?? false,
    },
    access_level: currentUser.access_level || "-",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Хендлер змін у звичайних полях
  const handleChange = useCallback(
    (field) => (e) => {
      setUserData((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  // Хендлер для свічів
  const handleSwitchChange = useCallback(
    (section, key) => () => {
      setUserData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: !prev[section][key],
        },
      }));
    },
    []
  );

  // Збереження профілю
  const handleSave = useCallback(async () => {
    try {
      // Тут ви викликаєте свій API для збереження
      await axios.put(
        `${config.REACT_APP_HUB_API_URL}/api/v1/profile/update`,
        userData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to update profile");
    }
  }, [userData]);

  const handleCloseSnackbar = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  return (
    <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
      {/* Верхній блок із ім'ям, класом та кнопками оновлення */}
      <Card
        sx={{
          borderRadius: 1.5,
          mb: 3,
          backgroundColor: "background.paper",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
              mb: 1,
              ml: 3,
              mr: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 400, color: "text.primary" }}
              >
                {userData.username}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Level: {<StatusBadge level={userData.access_level} />}
              </Typography>
            </Box>
            {isOwnProfile &&
              (isEditing ? (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    startIcon={<Save />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 0.8,
                      boxShadow: "none",
                      padding: "10px 20px",
                      transition: "all 0.5s ease",
                      backgroundColor: "background.button",
                      color: "background.paper",
                      ":hover": {
                        boxShadow: "none",
                        backgroundColor: "background.default",
                        color: "text.primary",
                        transition: "all 0.5s ease",
                      },
                    }}
                  >
                    Save Profile
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(false)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      borderRadius: 0.8,
                      boxShadow: "none",
                      padding: "10px 20px",
                      transition: "all 0.5s ease",
                      backgroundColor: "background.default",
                      color: "text.primary",
                      ":hover": {
                        boxShadow: "none",
                        backgroundColor: "background.button",
                        color: "background.paper",
                        transition: "all 0.5s ease",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  startIcon={<Edit />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: 0.8,
                    boxShadow: "none",
                    padding: "10px 20px",
                    transition: "all 0.5s ease",
                    backgroundColor: "background.button",
                    color: "background.paper",
                    ":hover": {
                      boxShadow: "none",
                      backgroundColor: "background.default",
                      color: "text.primary",
                      transition: "all 0.5s ease",
                    },
                  }}
                >
                  Update Profile
                </Button>
              ))}
          </Box>
        </CardContent>
      </Card>

      {/* Основна сітка з 3 колонками */}
      <Grid container spacing={3}>
        {/* PERSONAL INFO */}
        <Grid item xs={12} md={6.5}>
          <Card
            sx={{
              borderRadius: 1.5,
              backgroundColor: "background.paper",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ m: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 5 }}>
                Personal Info
              </Typography>

              {/* Розбивка на дві колонки */}
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
                    options={[
                      "Prefer not to say",
                      "She/Her",
                      "He/Him",
                      "They/Them",
                      "Other"
                    ]}
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
                    value={userData.birthday}
                    field="contactNumber"
                    isEditing={isEditing && isOwnProfile}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SOCIAL INFO */}
        <Grid item xs={12} md={3}>
          <Card
            sx={{
              borderRadius: 1.5,
              backgroundColor: "background.paper",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ m: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 5 }}>
                Social Info
              </Typography>

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
                    value={userData.onlineStatus}
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
                    value={userData.onlineStatus}
                    field="timezone"
                    isEditing={isEditing && isOwnProfile}
                    onChange={handleChange}
                    select
                    options={["Hide", "Visible"]}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* NOTIFICATIONS & PREFERENCES */}
        <Grid item xs={12} md={2.5}>
          {/* Notifications */}
          <Card
            sx={{
              borderRadius: 1.5,
              backgroundColor: "background.paper",
              boxShadow: "none",
              mb: 3,
            }}
          >
            <CardContent sx={{ m: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 5 }}>
                Notifications
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={12}>
                  <FormControlLabel
                    labelPlacement="start"
                    sx={{
                      gap: 2,
                      "& .MuiFormControlLabel-label": { minWidth: "120px", fontWeight: 400 },
                    }}
                    control={
                      <Switch
                        checked={userData.notifications.email}
                        onChange={handleSwitchChange("notifications", "email")}
                        sx={customSwitchSx}
                        disabled={false}
                      />
                    }
                    label="Email"
                  />
                </Grid>
                <Grid item xs={12} sm={12}>
                  <FormControlLabel
                    labelPlacement="start"
                    sx={{
                      gap: 2,
                      "& .MuiFormControlLabel-label": { minWidth: "120px", fontWeight: 400  },
                    }}
                    control={
                      <Switch
                        checked={userData.notifications.push}
                        onChange={handleSwitchChange("notifications", "push")}
                        sx={customSwitchSx}
                        disabled={true}
                      />
                    }
                    label="Push"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card
            sx={{
              borderRadius: 1.5,
              backgroundColor: "background.paper",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ m: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 5 }}>
                Preferences
              </Typography>

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
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Повідомлення про помилки/успіх */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default ProfileCard;
