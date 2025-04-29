// src/components/Layout/Header/Header.jsx
import { AppBar, Box, Toolbar, Typography, useMediaQuery } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useUserExtras } from "../../../hooks/useUserExtras";
import { ProfileAvatar } from "../../../utils/avatarUtils";
import { formatPoints } from "../../../utils/formatPoints";

const Header = ({ currentUser, token, title }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { randomPrediction } = useUserExtras(token);

  const userName = currentUser?.username || "Someone";
  const userPoints = currentUser?.total_points || 0;

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

  const headerText = `Передбачення для ${userName}. ${randomPrediction}`;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="top-bar"
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      role="banner"
    >
      <Toolbar className="top-bar-toolbar">
        <Box className="top-bar-left">
          <Typography
            variant={isMobile ? "h7" : "h5"}
            className="welcome-text"
            sx={{ color: "text.primary" }}
          >
            {title ? title : headerText}
          </Typography>
          <Typography
            variant={isMobile ? "caption" : "body1"}
            className="date-text"
            sx={{ color: "text.secondary" }}
          >
            {currentDate}
          </Typography>
        </Box>
        <Box
          className="top-bar-right"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Typography
            variant={isMobile ? "caption" : "body1"}
            color="text.secondary"
            className="points-text"
            sx={{ mr: 2 }}
          >
            Points: {formatPoints(userPoints)}
          </Typography>
          <Box className="avatar-wrapper" sx={{ position: "relative" }}>
            <ProfileAvatar
              user={currentUser}
              badgeSize={isMobile ? 5 : 10}
              status={currentUser?.online_status}
              onClicEvent={handleAvatarClick}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;