import React, { useMemo, useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  useMediaQuery,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { Add, ArrowBack } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useNotification } from "../../../context/NotificationContext";
import { useUserExtras } from "../../../hooks/useUserExtras";
import { ProfileAvatar } from "../../../utils/avatarUtils";
import { formatPoints } from "../../../utils/formatPoints";
import { APP_CONSTANTS } from "./headerConstants";
import { baseButtonStyles, baseTypographyStyles, BASE_SHADOW } from "../../../styles/BaseStyles";
import { alpha } from "@mui/material";

/**
 * Header component displaying user info, points, prediction, and navigation.
 * @param {Object} props
 * @param {Object} props.currentUser - Current user data
 * @param {string} props.token - Authentication token
 * @param {string} [props.title] - Optional custom title
 * @param {Function} props.onLogout - Logout handler
 * @returns {JSX.Element} Header component
 */
const Header = ({ currentUser, token, title, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // <700px
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // 700px-1200px
  const { randomPrediction, refreshPrediction } = useUserExtras(token);
  const { showNotification } = useNotification();
  const [anchorEl, setAnchorEl] = useState(null);

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

  // Memoized header text including prediction
  const headerText = useMemo(
    () => title || `${randomPrediction || ""}`,
    [title, randomPrediction]
  );

  // Handle avatar click to open menu
  const handleAvatarClick = useCallback((event) => {
    if (currentUser?.anonymous_id) {
      setAnchorEl(event.currentTarget);
    } else {
      console.warn("No anonymous_id found for profile navigation");
    }
  }, [currentUser]);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Handle menu item actions
  const handleMenuAction = useCallback(
    (action) => {
      handleMenuClose();
      if (action === "profile") {
        navigate(`/profile/${currentUser.anonymous_id}`);
      } else if (action === "logout") {
        onLogout();
      }
    },
    [currentUser, navigate, onLogout, handleMenuClose]
  );

  // Handle Add Points click
  const handleAddPointsClick = useCallback(() => {
    window.open(APP_CONSTANTS.ADD_POINTS_URL, "_blank", "noopener,noreferrer");
  }, []);

  // Handle prediction refresh
  const handleRefreshPrediction = useCallback(() => {
    refreshPrediction();
    // showNotification("Prediction updated!", "success"); // Commented out as per request
  }, [refreshPrediction]);

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
          <Box className="top-bar-left" sx={{ flex: 1 }}>
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
            <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
              <Typography
                variant={isMobile ? "caption" : "body2"}
                className="date-text"
                sx={{
                  ...baseTypographyStyles,
                  color: "text.secondary",
                  fontSize: { xs: "clamp(0.7rem, 3vw, 0.8rem)", sm: "0.9rem" },
                  mt: { xs: 0.5, sm: 1 },
                  pl: { xs: 0.5, sm: 1 },
                }}
                aria-label={`Current date: ${currentDate}`}
              >
                {currentDate}
              </Typography>
            </Box>
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
            pl: { xs: 0.8, md: 10 },
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              "&:hover": { opacity: 0.9 },
            }}
            onClick={handleRefreshPrediction}
            role="button"
            aria-label="Refresh prediction"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleRefreshPrediction();
              }
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              className="welcome-text"
              sx={{
                ...baseTypographyStyles,
                color: "text.primary",
                fontSize: {
                  xs: "clamp(0.75rem, 3vw, 0.85rem)",
                  sm: "clamp(0.9rem, 2vw, 1rem)",
                  md: "clamp(1rem, 1.5vw, 1.1rem)",
                },
                fontWeight: 400,
                textOverflow: "ellipsis",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.4,
              }}
              aria-hidden="true"
            >
              {headerText}
            </Typography>
          </Box>
          <Typography
            variant={isMobile ? "caption" : "body2"}
            className="date-text"
            sx={{
              ...baseTypographyStyles,
              color: "text.secondary",
              fontSize: {
                xs: "clamp(0.65rem, 2.5vw, 0.75rem)",
                sm: "0.85rem",
                md: "0.9rem",
              },
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
            gap: { xs: 0.75, sm: 1, md: 1.25 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 0.75 },
            }}
          >
            <Typography
              variant={isMobile ? "caption" : "body2"}
              className="points-text"
              sx={{
                ...baseTypographyStyles,
                color: "text.secondary",
                fontSize: {
                  xs: "clamp(0.7rem, 2.5vw, 0.8rem)",
                  sm: "0.85rem",
                  md: "0.9rem",
                },
                mr: { xs: 0.5, sm: 0.75 },
              }}
              aria-label={`User points: ${formatPoints(userData.points)}`}
            >
              Points: {formatPoints(userData.points)}
            </Typography>
            <Tooltip title="Add more points">
              <IconButton
                size={isMobile ? "small" : "medium"}
                onClick={handleAddPointsClick}
                aria-label="Add points"
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  borderRadius: "50%",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    transform: "scale(1.02)",
                  },
                  "&:active": { transform: "scale(0.98)" },
                  "&:focus": {
                    outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    outlineOffset: 2,
                  },
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddPointsClick();
                  }
                }}
              >
                <Add fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
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
              badgeSize={isMobile ? 8 : isTablet ? 9 : 10}
              status={userData.status}
              onClicEvent={handleAvatarClick}
              aria-label={`Open profile menu for ${userData.name}`}
              aria-controls={anchorEl ? "profile-menu" : undefined}
              aria-haspopup="true"
              sx={{
                cursor: currentUser?.anonymous_id ? "pointer" : "default",
                "&:focus": { outline: `2px solid ${theme.palette.primary.main}` },
              }}
              tabIndex={currentUser?.anonymous_id ? 0 : -1}
              onKeyPress={(e) => {
                if (e.key === "Enter" && currentUser?.anonymous_id) {
                  handleAvatarClick(e);
                }
              }}
            />
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              sx={{
                "& .MuiPaper-root": {
                  backgroundColor: "background.paper",
                  boxShadow: BASE_SHADOW,
                  borderRadius: theme.shape.borderRadiusMedium,
                  minWidth: 160,
                },
              }}
              MenuListProps={{
                "aria-labelledby": `Open profile menu for ${userData.name}`,
              }}
            >
              <MenuItem
                onClick={() => handleMenuAction("profile")}
                sx={{
                  ...baseTypographyStyles,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  py: 1,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.grey[200], 0.3),
                  },
                }}
              >
                My Profile
              </MenuItem>
              <MenuItem
                onClick={() => handleMenuAction(onLogout)}
                sx={{
                  ...baseTypographyStyles,
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                  py: 1,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.grey[200], 0.3),
                  },
                }}
              >
                Logout
              </MenuItem>
            </Menu>
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
  onLogout: PropTypes.func.isRequired,
};

export default React.memo(Header);