import React, { useState, useCallback, useMemo } from "react";
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
  Chip,
  useTheme,
} from "@mui/material";
import { MoreVert, Star, StarBorder, HelpOutline } from "@mui/icons-material";
import { headerStyles, actionButtonStyles } from "../../styles/BaseStyles";
import StatusBadge from "../Badges/StatusBadge";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';

const ProfileHeader = React.memo(({ user, isOwnProfile, headerData, userRole, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeChipIndex, setActiveChipIndex] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);
  const handleMenuAction = useCallback((action) => {
    action();
    handleMenuClose();
  }, [handleMenuClose]);
  const handleChipClick = useCallback((index) => {
    setActiveChipIndex((prev) => (prev === index ? null : index));
  }, []);

  // Memoized computed values
  const isManageable = useMemo(() => ["owner", "admin"].includes(userRole), [userRole]);
  const menuActions = useMemo(() => headerData?.actions?.filter((action) => action.isMenuItem) || [], [headerData?.actions]);
  const buttonActions = useMemo(() => headerData?.actions?.filter((action) => !action.isMenuItem) || [], [headerData?.actions]);
  const hasFavoriteToggle = useMemo(() => headerData?.type !== "user" && headerData?.type !== "page" && !!headerData?.onFavoriteToggle, [headerData?.type, headerData?.onFavoriteToggle]);
  const hasMenuActions = useMemo(() => headerData?.type !== "user" && headerData?.type !== "page" && isManageable && menuActions.length > 0, [headerData?.type, isManageable, menuActions.length]);
  const hasMainButton = useMemo(() => (headerData?.type === "page" && !!children) || buttonActions.length > 0, [headerData?.type, children, buttonActions.length]);

  // Loading state
  if (!user) {
    return (
      <Card sx={{ ...headerStyles.card, width: { xs: "100%", customSm: "auto" } }}>
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

  // Minimal header without headerData
  if (!headerData) {
    return (
      <Card sx={{ ...headerStyles.card, width: { xs: "100%", customSm: "auto" } }}>
        <CardContent>
          <Box sx={headerStyles.content}>
            <Box sx={headerStyles.leftSection}>
              <Typography
                variant="h4"
                sx={{
                  ...headerStyles.title,
                  fontSize: { xs: "1.5rem", customSm: "2rem", md: "2.5rem" },
                }}
                aria-label={`Username: ${user.username}`}
              >
                {user.username}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ...headerStyles.level,
                  fontSize: { xs: "0.875rem", customSm: "1rem" },
                }}
              >
                Level: <StatusBadge level={user.access_level} />
              </Typography>
            </Box>
            {isOwnProfile && children && (
              <Box sx={headerStyles.buttonGroup}>
                {children}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render action buttons (reused for mobile and desktop)
  const renderActionButtons = () => (
    <>
      {headerData.type === "page" && children}
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
            }}
            disabled={action.disabled}
            aria-label={action.ariaLabel}
          >
            {action.label}
          </Button>
        </Tooltip>
      ))}
      {(hasFavoriteToggle || hasMenuActions) && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {hasFavoriteToggle && (
            <Tooltip
              title={headerData.isFavorited ? `Remove ${headerData.type} from favorites` : `Add ${headerData.type} to favorites`}
            >
              <IconButton
                onClick={headerData.onFavoriteToggle}
                disabled={headerData.actionLoading}
                aria-label={headerData.isFavorited ? "Remove from favorites" : "Add to favorites"}
                sx={{ display: { xs: "none", customSm: "inline-flex" } }}
              >
                {headerData.isFavorited ? <Star color="warning" /> : <StarBorder />}
              </IconButton>
            </Tooltip>
          )}
          {hasMenuActions && (
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
                PaperProps={{ sx: { mt: 1, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" } }}
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
    </>
  );

  return (
    <Card sx={{ ...headerStyles.card, width: { xs: "100%", customSm: "auto" }, position: "relative" }}>
      <CardContent>
        {hasFavoriteToggle && (
          <Box
            sx={{
              display: { xs: "block", customSm: "none" },
              position: "absolute",
              top: 8,
              right: 8,
            }}
          >
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
          </Box>
        )}
        <Box sx={headerStyles.content}>
          <Box sx={headerStyles.leftSection}>
            <Typography
              variant="h4"
              sx={{
                ...headerStyles.title,
                fontSize: { xs: "1.5rem", customSm: "2rem", md: "2.5rem" },
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
                  fontSize: { xs: "0.875rem", customSm: "1rem" },
                }}
              >
                Level: <StatusBadge level={user.access_level} />
              </Typography>
            ) : headerData.type === "page" ? (
              <Box sx={{ display: "flex", alignItems: "left", gap: 1, justifyContent: { xs: "center", sm: "flex-start" } }}>
                <Typography
                  variant="body2"
                  sx={{
                    ...headerStyles.level,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                  aria-label={`Page description: ${headerData.shortDescription}`}
                >
                  {headerData.shortDescription}
                </Typography>
                {headerData.tooltipDescription && !isMobile && (
                  <Tooltip
                    title={headerData.tooltipDescription}
                    placement="top"
                    arrow
                    slotProps={{
                      popper: {
                        sx: {
                          [`& .${tooltipClasses.tooltip}`]: { padding: 2 },
                        },
                        modifiers: [{ name: "offset", options: { offset: [0, -10] } }],
                      },
                    }}
                  >
                    <IconButton size="small" aria-label="More information about this page" sx={{ p: 0 }}>
                      <HelpOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ) : (
              <Box sx={headerStyles.chipContainer}>
                {headerData.chips?.map((chip, index) => (
                  <Box key={index} sx={{ position: "relative" }}>
                    <Chip
                      label={chip.label}
                      icon={chip.icon}
                      size="medium"
                      variant="outlined"
                      color={chip.color || "default"}
                      onClick={() => handleChipClick(index)}
                      sx={{
                        ...headerStyles.chip,
                        ...(activeChipIndex === index ? headerStyles.chipExpanded : headerStyles.chipCollapsed),
                      }}
                      aria-label={chip.ariaLabel}
                      aria-expanded={activeChipIndex === index}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {isOwnProfile && (hasMainButton || hasFavoriteToggle || hasMenuActions) && (
            <Box sx={headerStyles.rightSection}>
              <Box sx={headerStyles.buttonGroup}>
                {renderActionButtons()}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    access_level: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool,
  headerData: PropTypes.shape({
    type: PropTypes.oneOf(["user", "class", "gate", "page"]).isRequired,
    title: PropTypes.string,
    titleAriaLabel: PropTypes.string,
    description: PropTypes.string,
    descriptionAriaLabel: PropTypes.string,
    shortDescription: PropTypes.string,
    tooltipDescription: PropTypes.string,
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

export default ProfileHeader;