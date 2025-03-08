//src/components/Profile/ProfileCard.jsx
import React from "react";
import { Card, CardContent, Box, Typography, Button, Grid } from "@mui/material";
import { Link } from "react-router-dom";

/**
 * Картка з даними профілю та списком бордів.
 */
const ProfileCard = ({ currentUser, boards }) => {
  const userFullName = currentUser.fullName || "Someone";
  const userName = currentUser.username || "Noone";
  const userEmail = currentUser.email || "userEmail";

  return (
    <>
      {/* Картка профілю */}
      <Card
        sx={{
          maxWidth: 800,
          margin: "0 auto",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          p: 2,
        }}
      >
        <CardContent>
          {/* Верхній блок: заголовок + кнопка Edit */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 500 }}>
                {userName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
            </Box>
            <Button variant="contained" color="primary">
              Edit
            </Button>
          </Box>

          {/* Основна інформація у Grid */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Full Name
              </Typography>
              <Typography variant="body1">{userFullName}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Username
              </Typography>
              <Typography variant="body1">{userName}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Gender
              </Typography>
              <Typography variant="body1">
                {currentUser.gender || "Any"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Country
              </Typography>
              <Typography variant="body1">
                {currentUser.country || "Everywhere"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Language
              </Typography>
              <Typography variant="body1">
                {currentUser.language || "Any"}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ color: "#666" }}>
                Time Zone
              </Typography>
              <Typography variant="body1">
                {currentUser.timezone || "Somewhere"}
              </Typography>
            </Grid>
          </Grid>

          {/* Додаткова інформація */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ color: "#666" }}>
              My email address
            </Typography>
            <Typography variant="body1">{userEmail}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Список бордів */}
      <Box sx={{ maxWidth: 800, margin: "24px auto 0" }}>
        <Typography variant="h6" gutterBottom>
          Доступні борди
        </Typography>
        <Grid container spacing={3}>
          {boards.map((board) => (
            <Grid item xs={12} sm={6} md={4} key={board._id}>
              <Card
                sx={{
                  borderRadius: 2,
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {board.name}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/board/${board._id}`}
                  >
                    Перейти
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default ProfileCard;
