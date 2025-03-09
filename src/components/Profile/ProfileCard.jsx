import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Edit, Save } from "@mui/icons-material";
import axios from "axios";
import config from "../../config";

// Компонент для відображення/редагування поля
const ProfileField = ({ label, value, field, isEditing, onChange }) => (
  <Grid item xs={12} md={6}>
    <Typography variant="subtitle2" sx={{ color: "#666" }}>{label}</Typography>
    {isEditing ? (
      <TextField fullWidth value={value || ""} onChange={onChange(field)} />
    ) : (
      <Typography variant="body1">{value || "Not set"}</Typography>
    )}
  </Grid>
);

// Компонент для соціальних посилань
const SocialLinks = ({ links, isEditing, onChange }) => (
  <Grid item xs={12}>
    <Typography variant="subtitle2" sx={{ color: "#666" }}>Social Links</Typography>
    {isEditing ? (
      <>
        {["twitter", "instagram", "linkedin"].map((platform) => (
          <TextField
            key={platform}
            label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            fullWidth
            value={links[platform] || ""}
            onChange={onChange(platform)}
            sx={{ mt: 1 }}
          />
        ))}
      </>
    ) : (
      <Box>
        {["twitter", "instagram", "linkedin"].map((platform) => (
          <Typography key={platform} variant="body1">
            {platform.charAt(0).toUpperCase() + platform.slice(1)}: {links[platform] || "Not set"}
          </Typography>
        ))}
      </Box>
    )}
  </Grid>
);

const ProfileCard = React.memo(({ currentUser, boards, isOwnProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    fullName: currentUser.fullName || "Someone",
    username: currentUser.username || "Noone",
    email: currentUser.email || "userEmail",
    gender: currentUser.gender || "Any",
    country: currentUser.country || "Everywhere",
    language: currentUser.language || "Any",
    timezone: currentUser.timezone || "Somewhere",
    bio: currentUser.bio || "",
    isPublic: currentUser.isPublic || false,
    points: currentUser.points || 0,
    socialLinks: {
      twitter: currentUser.social_links?.twitter || "",
      instagram: currentUser.social_links?.instagram || "",
      linkedin: currentUser.social_links?.linkedin || "",
    },
  });
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Мемоізована функція для завантаження тікетів
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const response = await axios.get(`${config.REACT_APP_HUB_API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTickets(response.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to fetch tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (isOwnProfile) fetchTickets();
  }, [isOwnProfile, fetchTickets]);

  const handleChange = useCallback((field) => (e) => {
    setUserData((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleSocialChange = useCallback((platform) => (e) => {
    setUserData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: e.target.value },
    }));
  }, []);

  const handlePublicToggle = useCallback(() => {
    setUserData((prev) => ({ ...prev, isPublic: !prev.isPublic }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const response = await axios.put(
        `${config.REACT_APP_HUB_API_URL}/profile/update`,
        userData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const updatedData = response.data.authData;
      setUserData((prev) => ({
        ...prev,
        ...updatedData,
        socialLinks: updatedData.social_links || prev.socialLinks,
      }));
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

  const formatStatus = (status) => (status === "INACTIVE" ? "INACTIVE" : status);

  return (
    <>
      <Card sx={{ maxWidth: 800, margin: "0 auto", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", p: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 500 }}>{userData.username}</Typography>
              <Typography variant="body2" color="text.secondary">{userData.email}</Typography>
            </Box>
            {isOwnProfile && (
              <IconButton onClick={isEditing ? handleSave : () => setIsEditing(true)} color="primary">
                {isEditing ? <Save /> : <Edit />}
              </IconButton>
            )}
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <ProfileField label="Full Name" value={userData.fullName} field="fullName" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Points</Typography>
              <Typography variant="body1">{userData.points}</Typography>
            </Grid>
            <ProfileField label="Username" value={userData.username} field="username" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <ProfileField label="Gender" value={userData.gender} field="gender" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <ProfileField label="Country" value={userData.country} field="country" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <ProfileField label="Language" value={userData.language} field="language" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <ProfileField label="Time Zone" value={userData.timezone} field="timezone" isEditing={isEditing && isOwnProfile} onChange={handleChange} />
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Bio</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth multiline rows={3} value={userData.bio || ""} onChange={handleChange("bio")} />
              ) : (
                <Typography variant="body1">{userData.bio || "No bio yet"}</Typography>
              )}
            </Grid>
            {isOwnProfile && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={userData.isPublic} onChange={handlePublicToggle} disabled={!isEditing} />}
                  label="Public Profile"
                />
              </Grid>
            )}
            <SocialLinks links={userData.socialLinks} isEditing={isEditing && isOwnProfile} onChange={handleSocialChange} />
            {isOwnProfile && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: "#666" }}>My Tickets</Typography>
                {loadingTickets ? (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                ) : tickets.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                    {tickets.map((ticket) => (
                      <Card key={ticket.ticket_id} sx={{ minWidth: 150, borderRadius: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", p: 1 }}>
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{ticket.ticketClass}</Typography>
                          <Typography variant="body2">GATE: {ticket.gate}</Typography>
                          <Typography variant="body2">SEAT: {ticket.seat}</Typography>
                          <Typography variant="body2">STATUS: {formatStatus(ticket.status)}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1">No tickets yet</Typography>
                )}
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {isOwnProfile && boards.length > 0 && (
        <Box sx={{ maxWidth: 800, margin: "24px auto 0" }}>
          <Typography variant="h6" gutterBottom>Доступні борди</Typography>
          <Grid container spacing={3}>
            {boards.map((board) => (
              <Grid item xs={12} sm={6} md={4} key={board._id}>
                <Card sx={{ borderRadius: 2, transition: "transform 0.3s ease, box-shadow 0.3s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{board.name}</Typography>
                    <Button variant="contained" color="primary" component={Link} to={`/board/${board._id}`}>
                      Перейти
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
    </>
  );
});

export default ProfileCard;