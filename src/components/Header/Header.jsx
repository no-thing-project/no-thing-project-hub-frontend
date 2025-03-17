// Header.jsx
import React, { useMemo } from "react";
import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const predictions = [
  "A pleasant surprise is waiting for you",
  "Your creativity will lead you to success",
  "Expect positive changes soon",
  "You will conquer new challenges today",
  "Good fortune will follow you",
];

function generateRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Функція форматування балів
const formatPoints = (points) => {
  if (points < 1000) return points.toString();
  if (points < 1000000) return (points / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (points < 1000000000) return (points / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  return (points / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
};

const Header = ({ currentUser, token }) => {
  const navigate = useNavigate();
  
  const userName = currentUser?.username || "Someone";
  const userAvatar = currentUser?.profile_picture || "";
  const userStatus = currentUser?.status || "online";
  const userPoints = currentUser?.total_points || 0;
  const statusColor = { online: "green", offline: "red", anonymous: "grey" }[userStatus];

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    return names.length === 1
      ? name.charAt(0).toUpperCase()
      : (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  };

  const randomPrediction = useMemo(() => {
    if (!token) {
      return "Welcome to GATE";
    }
    const predictionKey = `prediction_${token}`;
    let savedPrediction = localStorage.getItem(predictionKey);
    if (!savedPrediction) {
      savedPrediction = predictions[Math.floor(Math.random() * predictions.length)];
      localStorage.setItem(predictionKey, savedPrediction);
    }
    return savedPrediction;
  }, [token]);

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const currentDate = formatDate();

  const sessionAvatarBg = useMemo(() => {
    if (!token) {
      return "#888888";
    }
    const colorKey = `avatarBgColor_${token}`;
    let savedColor = localStorage.getItem(colorKey);
    if (!savedColor) {
      savedColor = generateRandomColor();
      localStorage.setItem(colorKey, savedColor);
    }
    return savedColor;
  }, [token]);

  // При кліку на аватар переходимо на сторінку профілю
  const handleAvatarClick = () => {
    navigate(`/profile/${currentUser.anonymous_id}`);
  };

  return (
    <AppBar position="sticky" elevation={0} className="top-bar">
      <Toolbar className="top-bar-toolbar">
        <Box className="top-bar-left">
          <Typography variant="h5" className="welcome-text">
            Welcome, {userName}. {randomPrediction}
          </Typography>
          <Typography variant="body1" className="date-text">
            {currentDate}
          </Typography>
        </Box>
        <Box className="top-bar-right">
          <Typography
            variant="body1"
            color="text.secondary"
            className="points-text"
          >
            Points: {formatPoints(userPoints)}
          </Typography>
          <div className="avatar-wrapper">
            <Avatar
              src={userAvatar || undefined}
              alt={userName}
              className="user-avatar"
              onClick={handleAvatarClick}
              sx={{
                backgroundColor: userAvatar ? "transparent" : sessionAvatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              {!userAvatar && getInitials(userName)}
            </Avatar>
            <span
              className="status-indicator"
              style={{ backgroundColor: statusColor }}
            />
          </div>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
