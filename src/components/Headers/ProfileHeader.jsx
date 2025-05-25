import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  useTheme,
} from "@mui/material";
import { MoreVert, Star, StarBorder } from "@mui/icons-material";
import { headerStyles, actionButtonStyles } from "../../styles/BaseStyles";
import StatusBadge from "../Badges/StatusBadge";

const ProfileHeader = ({ user, isOwnProfile, headerData, userRole, children }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleMenuAction = (action) => {
    action();
    handleMenuClose();
  };

  if (!user) {
    return (
      <Card sx={headerStyles.card}>
        <CardContent>
          <Box sx={headerStyles.content}>
            <Box>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={100} height={20} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Simplified user profile mode (no headerData)
  if (!headerData) {
    return (
      <Card sx={headerStyles.card}>
        <CardContent>
          <Box
            sx={{
              ...headerStyles.content,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, sm: 0 },
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  ...headerStyles.title,
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                }}
                aria-label={`Username: ${user.username}`}
              >
                {user.username}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...headerStyles.level,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                Level: <StatusBadge level={user.access_level} />
              </Typography>
            </Box>
            {isOwnProfile && children && (
              <Box
                sx={{
                  ...headerStyles.buttonGroup,
                  flexWrap: "wrap",
                  justifyContent: { xs: "flex-start", sm: "flex-end" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {children}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Dynamic mode for class/gate/user with headerData
  const isManageable = ["owner", "admin"].includes(userRole);
  const menuActions = headerData.actions?.filter((action) => action.isMenuItem) || [];
  const buttonActions = headerData.actions?.filter((action) => !action.isMenuItem) || [];

  return (
    <Card sx={headerStyles.card}>
      <CardContent>
        <Box
          sx={{
            ...headerStyles.content,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                ...headerStyles.title,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              }}
              aria-label={headerData.titleAriaLabel || `Title: ${headerData.title || user.username}`}
            >
              {headerData.title || user.username}
            </Typography>
            {headerData.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1, mb: 2, fontSize: { xs: "0.875rem", md: "1rem" }, lineHeight: 1.6 }}
                aria-label={headerData.descriptionAriaLabel || `Description: ${headerData.description}`}
              >
                {headerData.description}
              </Typography>
            )}
            {headerData.type === "user" ? (
              <Typography
                variant="body2"
                sx={{
                  ...headerStyles.level,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                Level: <StatusBadge level={user.access_level} />
              </Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {headerData.chips?.map((chip, index) => (
                  <Chip
                    key={index}
                    label={chip.label}
                    icon={chip.icon}
                    size="medium"
                    variant="outlined"
                    color={chip.color || "default"}
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: 1 }}
                    aria-label={chip.ariaLabel}
                  />
                ))}
              </Box>
            )}
          </Box>
          {isOwnProfile && (
            <Box
              sx={{
                ...headerStyles.buttonGroup,
                flexWrap: "wrap",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                width: { xs: "100%", sm: "auto" },
                alignItems: "center",
                gap: 1,
              }}
            >
              {buttonActions.map((action, index) => (
                <Tooltip key={index} title={action.tooltip}>
                  <Button
                    onClick={action.onClick}
                    startIcon={action.icon}
                    sx={{
                      ...actionButtonStyles,
                      ...(action.variant === "delete" && {
                        bgcolor: theme.palette.error.main,
                        color: theme.palette.common.white,
                        "&:hover": { bgcolor: theme.palette.error.dark },
                      }),
                      "&:hover": { bgcolor: theme.palette.primary.dark },
                      [theme.breakpoints.down("sm")]: { minWidth: 120, fontSize: "0.875rem" },
                    }}
                    disabled={action.disabled}
                    aria-label={action.ariaLabel}
                  >
                    {action.label}
                  </Button>
                </Tooltip>
              ))}
              {headerData.type !== "user" && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {headerData.onFavoriteToggle && (
                    <Tooltip
                      title={headerData.isFavorited ? `Remove ${headerData.type} from favorites` : `Add ${headerData.type} to favorites`}
                    >
                      <IconButton
                        onClick={headerData.onFavoriteToggle}
                        disabled={headerData.actionLoading}
                        aria-label={headerData.isFavorited ? "Remove from favorites" : "Add to favorites"}
                      >
                        {headerData.isFavorited ? <Star color="warning" /> : <StarBorder />}
                      </IconButton>
                    </Tooltip>
                  )}
                  {isManageable && menuActions.length > 0 && (
                    <>
                      <IconButton
                        onClick={handleMenuOpen}
                        disabled={headerData.actionLoading}
                        aria-label="More actions"
                      >
                        <MoreVert />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        PaperProps={{
                          sx: {
                            mt: 1,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        {menuActions.map((action, index) => (
                          <MenuItem
                            key={index}
                            onClick={() => handleMenuAction(action.onClick)}
                            sx={action.variant === "delete" ? { color: theme.palette.error.main } : {}}
                          >
                            {action.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    access_level: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool,
  headerData: PropTypes.shape({
    type: PropTypes.oneOf(["user", "class", "gate"]).isRequired,
    title: PropTypes.string,
    titleAriaLabel: PropTypes.string,
    description: PropTypes.string,
    descriptionAriaLabel: PropTypes.string,
    chips: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        icon: PropTypes.element,
        color: PropTypes.string,
        ariaLabel: PropTypes.string.isRequired,
      })
    ),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        icon: PropTypes.element,
        onClick: PropTypes.func.isRequired,
        tooltip: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        ariaLabel: PropTypes.string.isRequired,
        variant: PropTypes.oneOf(["default", "delete"]),
        isMenuItem: PropTypes.bool,
      })
    ),
    isFavorited: PropTypes.bool,
    onFavoriteToggle: PropTypes.func,
    actionLoading: PropTypes.bool,
  }),
  userRole: PropTypes.string,
  children: PropTypes.node,
};

export default React.memo(ProfileHeader);