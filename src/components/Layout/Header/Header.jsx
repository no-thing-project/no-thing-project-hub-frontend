// src/components/Layout/Header/Header.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUserExtras } from "../../../hooks/useUserExtras";
import { formatPoints } from "../../../utils/formatPoints";


const Header = ({ currentUser, token }) => {
  const navigate = useNavigate();
  const { randomPrediction, sessionAvatarBg } = useUserExtras(token);

  const userName = currentUser?.username || "Someone";
  const userAvatar = currentUser?.profile_picture || "";
  const userStatus = currentUser?.onlineStatus || "offline";
  const userPoints = currentUser?.total_points || 0;
  const statusColor = { online: "green", offline: "red", anonymous: "grey" }[userStatus];

  const getInitials = (name) => {
    if (!name) return "";
    const names = name.split(" ");
    return names.length === 1
      ? name.charAt(0).toUpperCase()
      : (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  };

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

  const handleAvatarClick = () => {
    if (currentUser?.anonymous_id) {
      navigate(`/profile/${currentUser.anonymous_id}`);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="top-bar"
      sx={{ backgroundColor: "background.default" }}
      role="banner"
    >
      <Toolbar className="top-bar-toolbar">
        <Box className="top-bar-left">
          <Typography variant="h5" className="welcome-text" sx={{ color: "text.primary" }}>
            Передбачення для {userName}. {randomPrediction}
          </Typography>
          <Typography variant="body1" className="date-text" sx={{ color: "text.secondary" }}>
            {currentDate}
          </Typography>
        </Box>
        <Box className="top-bar-right" sx={{ display: "flex", alignItems: "center" }}>
          <Typography
            variant="body1"
            color="text.secondary"
            className="points-text"
            sx={{ mr: 2 }}
          >
            Points: {formatPoints(userPoints)}
          </Typography>
          <Box className="avatar-wrapper" sx={{ position: "relative" }}>
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
              aria-label={`Profile of ${userName}`}
            >
              {!userAvatar && getInitials(userName)}
            </Avatar>
            <span
              className="status-indicator"
              style={{
                backgroundColor: statusColor,
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid white",
              }}
              aria-label={`User status: ${userStatus}`}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;