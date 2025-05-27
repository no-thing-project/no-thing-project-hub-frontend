import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useUserExtras } from "../../../hooks/useUserExtras";
import { ProfileAvatar } from "../../../utils/avatarUtils";
import { formatPoints } from "../../../utils/formatPoints";
import { APP_CONSTANTS } from "./headerConstants";
import { baseButtonStyles, baseTypographyStyles, BASE_SHADOW } from "../../../styles/BaseStyles";
import { alpha } from "@mui/material";

/**
 * Header component displaying user info, points, and navigation.
 * @param {Object} props
 * @param {Object} props.currentUser - Current user data
 * @param {string} props.token - Authentication token
 * @param {string} [props.title] - Optional custom title
 * @returns {JSX.Element} Header component
 */
const Header = ({ currentUser, token, title }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <770px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 770px-900px

  const { randomPrediction } = useUserExtras(token);

  // Memoized user data for performance
  const userData = useMemo(
    () => ({
      name: currentUser?.username || APP_CONSTANTS.DEFAULT_USER_NAME,
      points: currentUser?.total_points || 0,
      status: currentUser?.online_status,
    }),
    [currentUser]
  );

  // Memoized date to update only once per session
  const currentDate = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString(navigator.language || "en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Memoized header text based on screen size and title
  const headerText = useMemo(
    () =>
      isMobile
        ? title || APP_CONSTANTS.DEFAULT_HEADER_TITLE
        : title || `Передбачення для ${userData.name}. ${randomPrediction || ""}`,
    [isMobile, title, userData.name, randomPrediction]
  );

  // Handle avatar click for profile navigation
  const handleAvatarClick = useCallback(() => {
    if (currentUser?.anonymous_id) {
      navigate(`/profile/${currentUser.anonymous_id}`);
    } else {
      console.warn("No anonymous_id found for profile navigation");
    }
  }, [currentUser, navigate]);

  // Handle Add Points button click
  const handleAddPointsClick = useCallback(() => {
    window.open(APP_CONSTANTS.ADD_POINTS_URL, "_blank", "noopener,noreferrer");
  }, []);

  // Fallback UI if currentUser is missing
  if (!currentUser) {
    return (
      <AppBar
        position="fixed"
        elevation={0}
        className="top-bar"
        sx={{
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: alpha(theme.background?.paper || "#ffffff", 0.1),
          backdropFilter: "blur(10px) saturate(150%)",
          boxShadow: BASE_SHADOW,
          borderBottom: `1px solid ${alpha(theme.palette.grey[300], 0.6)}`,
          zIndex: theme.zIndex.appBar,
          "@supports not backdrop-filter": {
            backgroundColor: alpha(theme.background?.paper || "#ffffff", 0.3),
          },
        }}
        role="banner"
        aria-label="Application header"
      >
        <Toolbar
          className="top-bar-toolbar"
          sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1 } }}
        >
          <Box className="top-bar-left">
            <Typography
              variant={isMobile ? "h6" : "h5"}
              className="welcome-text"
              sx={{
                ...baseTypographyStyles,
                color: "text.primary",
                fontSize: { xs: "clamp(0.9rem, 4vw, 1rem)", sm: "1.5rem" },
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
              aria-label="Header title: Loading"
            >
              {isMobile ? APP_CONSTANTS.DEFAULT_HEADER_TITLE : "Loading..."}
            </Typography>
            <Typography
              variant={isMobile ? "caption" : "body2"}
              className="date-text"
              sx={{
                ...baseTypographyStyles,
                color: "text.secondary",
                fontSize: { xs: "clamp(0.7rem, 3vw, 0.8rem)", sm: "0.9rem" },
                mt: { xs: 0.5, sm: 1 },
              }}
              aria-label={`Current date: ${currentDate}`}
            >
              {currentDate}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className="top-bar"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: alpha(theme.background?.paper || "#ffffff", 0.1),
        backdropFilter: "blur(10px) saturate(150%)",
        boxShadow: BASE_SHADOW,
        borderBottom: `1px solid ${alpha(theme.palette.grey[300], 0.6)}`,
        zIndex: theme.zIndex.appBar,
        // Fallback for browsers without backdropFilter support
        "@supports not backdrop-filter": {
          backgroundColor: alpha(theme.background?.paper || "#ffffff", 0.3),
        },
      }}
      role="banner"
      aria-label="Application header"
    >
      <Toolbar
        className="top-bar-toolbar"
        sx={{
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 1, sm: 1 },
          justifyContent: "space-between",
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Box
          className="top-bar-left"
          sx={{
            display: "flex",
            flexDirection: "column",
            maxWidth: { xs: "55%", sm: "60%", md: "50%" },
            paddingLeft: {xs: "0.3rem", sm: "3rem"}
          }}
        >
          <Typography
            variant={isMobile ? "h6" : "h5"}
            className="welcome-text"
            sx={{
              ...baseTypographyStyles,
              color: "text.primary",
              fontSize: {
                xs: "clamp(0.9rem, 4vw, 0.7rem)", // 14px-16px
                sm: "clamp(1.2rem, 3vw, 1rem)", // 19px-24px
              },
              fontWeight: 400,
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
            aria-label={`Header title: ${headerText}`}
          >
            {headerText}
          </Typography>
          <Typography
            variant={isMobile ? "caption" : "body2"}
            className="date-text"
            sx={{
              ...baseTypographyStyles,
              color: "text.secondary",
              fontSize: { xs: "clamp(0.7rem, 3vw, 0.8rem)", sm: "0.9rem" },
              mt: { xs: 0.5, sm: 1 },
            }}
            aria-label={`Current date: ${currentDate}`}
          >
            {currentDate}
          </Typography>
        </Box>
        <Box
          className="top-bar-right"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.75, sm: 1, md: 1.5 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <Typography
              variant={isMobile ? "caption" : "body2"}
              className="points-text"
              sx={{
                ...baseTypographyStyles,
                color: "text.secondary",
                fontSize: { xs: "clamp(0.75rem, 3vw, 0.85rem)", sm: "0.9rem" },
                mr: { xs: 0.5, sm: 1 },
              }}
              aria-label={`User points: ${formatPoints(userData.points)}`}
            >
              Points: {formatPoints(userData.points)}
            </Typography>
            <Tooltip title="Add more points">
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? "small" : "medium"}
                className="add-points-button"
                onClick={handleAddPointsClick}
                aria-label="Add points"
                startIcon={<Add fontSize={isMobile ? "small" : "medium"} />}
                sx={{
                  ...baseButtonStyles,
                  minWidth: { xs: 40, sm: 100 }, // Larger touch target on mobile
                  height: { xs: 36, sm: 40 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.75 },
                  fontSize: { xs: "0.75rem", sm: "0.9rem" },
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {isMobile ? "" : isTablet ? "Add" : "Add Points"}
              </Button>
            </Tooltip>
          </Box>
          <Box
            className="avatar-wrapper"
            sx={{
              position: "relative",
              "&:hover": { cursor: "pointer", opacity: 0.9 },
            }}
          >
            <ProfileAvatar
              user={currentUser}
              badgeSize={isMobile ? 8 : isTablet ? 9 : 10} // Larger badge on mobile
              status={userData.status}
              onClicEvent={handleAvatarClick}
              aria-label={`View profile of ${userData.name}`}
              sx={{
                cursor: currentUser?.anonymous_id ? "pointer" : "default",
                "&:focus": { outline: `2px solid ${theme.palette.primary.main}` },
              }}
              tabIndex={currentUser?.anonymous_id ? 0 : -1}
              onKeyPress={(e) => {
                if (e.key === "Enter" && currentUser?.anonymous_id) {
                  handleAvatarClick();
                }
              }}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    total_points: PropTypes.number,
    anonymous_id: PropTypes.string,
    online_status: PropTypes.string,
  }),
  token: PropTypes.string,
  title: PropTypes.string,
};

export default React.memo(Header);