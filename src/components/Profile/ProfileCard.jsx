//src/components/Profile/ProfileCard.jsx
import React, { useState, useEffect } from "react";
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

/**
 * Картка з даними профілю та списком бордів.
 */
const ProfileCard = ({ currentUser, boards, isOwnProfile }) => {
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

  useEffect(() => {
    if (isOwnProfile) {
      fetchTickets();
    }
  }, [isOwnProfile]);

  const fetchTickets = async () => {
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
  };

  const handleChange = (field) => (e) => setUserData({ ...userData, [field]: e.target.value });

  const handleSocialChange = (platform) => (e) =>
    setUserData({
      ...userData,
      socialLinks: { ...userData.socialLinks, [platform]: e.target.value },
    });

  const handlePublicToggle = () => setUserData({ ...userData, isPublic: !userData.isPublic });

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${config.REACT_APP_HUB_API_URL}/profile/update`,
        userData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const updatedData = response.data.authData;
      setUserData({
        ...userData,
        ...updatedData,
        socialLinks: updatedData.social_links || userData.socialLinks,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to update profile");
    }
  };

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  // Функція для форматування статусу
  const formatStatus = (status) => {
    return status === "INACTIVE" ? "INACTIVE" : status;
  };

  return (
    <>
      <Card sx={{ maxWidth: 800, margin: "0 auto", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", p: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                {userData.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userData.email}
              </Typography>
            </Box>
            {isOwnProfile && (
              isEditing ? (
                <IconButton onClick={handleSave} color="primary">
                  <Save />
                </IconButton>
              ) : (
                <IconButton onClick={() => setIsEditing(true)} color="primary">
                  <Edit />
                </IconButton>
              )
            )}
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Full Name</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.fullName} onChange={handleChange("fullName")} />
              ) : (
                <Typography variant="body1">{userData.fullName}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Username</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.username} onChange={handleChange("username")} />
              ) : (
                <Typography variant="body1">{userData.username}</Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Gender</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.gender} onChange={handleChange("gender")} />
              ) : (
                <Typography variant="body1">{userData.gender}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Country</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.country} onChange={handleChange("country")} />
              ) : (
                <Typography variant="body1">{userData.country}</Typography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Language</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.language} onChange={handleChange("language")} />
              ) : (
                <Typography variant="body1">{userData.language}</Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Time Zone</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth value={userData.timezone} onChange={handleChange("timezone")} />
              ) : (
                <Typography variant="body1">{userData.timezone}</Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Bio</Typography>
              {isEditing && isOwnProfile ? (
                <TextField fullWidth multiline rows={3} value={userData.bio} onChange={handleChange("bio")} />
              ) : (
                <Typography variant="body1">{userData.bio || "No bio yet"}</Typography>
              )}
            </Grid>

            {isOwnProfile && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userData.isPublic}
                      onChange={handlePublicToggle}
                      disabled={!isEditing}
                    />
                  }
                  label="Public Profile"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>Social Links</Typography>
              {isEditing && isOwnProfile ? (
                <>
                  <TextField
                    label="Twitter"
                    fullWidth
                    value={userData.socialLinks.twitter}
                    onChange={handleSocialChange("twitter")}
                    sx={{ mt: 1 }}
                  />
                  <TextField
                    label="Instagram"
                    fullWidth
                    value={userData.socialLinks.instagram}
                    onChange={handleSocialChange("instagram")}
                    sx={{ mt: 1 }}
                  />
                  <TextField
                    label="LinkedIn"
                    fullWidth
                    value={userData.socialLinks.linkedin}
                    onChange={handleSocialChange("linkedin")}
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <Box>
                  <Typography variant="body1">Twitter: {userData.socialLinks.twitter || "Not set"}</Typography>
                  <Typography variant="body1">Instagram: {userData.socialLinks.instagram || "Not set"}</Typography>
                  <Typography variant="body1">LinkedIn: {userData.socialLinks.linkedin || "Not set"}</Typography>
                </Box>
              )}
            </Grid>

            {isOwnProfile && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: "#666" }}>My Tickets</Typography>
                {loadingTickets ? (
                  <CircularProgress size={24} sx={{ mt: 1 }} />
                ) : tickets.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                    {tickets.map((ticket) => (
                      <Card
                        key={ticket.ticket_id}
                        sx={{
                          minWidth: 150,
                          borderRadius: 2,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          p: 1,
                        }}
                      >
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {ticket.ticketClass}
                          </Typography>
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
                <Card
                  sx={{
                    borderRadius: 2,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" },
                  }}
                >
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

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>{error}</Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
    </>
  );
};

export default ProfileCard;