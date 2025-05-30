import React, { memo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Edit,
  Delete,
  Star,
  StarBorder,
  Public,
  Lock,
  People,
  Forum,
  GroupAdd,
  School,
  Dashboard,
  Group,
} from "@mui/icons-material";
import PropTypes from "prop-types";

// Configuration for different entity types
const ENTITY_CONFIG = {
  classe: {
    typeLabel: (item) => (item.type === "group" ? "Group" : "Personal"),
    tagText: (item) => (item.tags?.length > 0 ? `#${item.tags[0]}` : ENTITY_CONFIG.classe.typeLabel(item)),
    navigatePath: (itemId) => `/class/${itemId}`,
    icon: School,
    counters: [
      { key: "member_count", icon: People, label: "Members", source: (item) => item.stats?.member_count || item.members?.length || 0 },
      { key: "boards", icon: Dashboard, label: "Boards", source: (item) => item.boards?.length || 0 },
      { key: "favorite_count", icon: Star, label: "Favorites", source: (item) => item.stats?.favorite_count || 0, hideIfZero: true },
      { key: "tweet_count", icon: Forum, label: "Posts", source: (item) => item.stats?.tweet_count || 0, hideIfZero: true },
    ],
    ownerLabel: (item) => (item.gateName ? `From: ${item.gateName}` : `Owner: ${item.members?.find((m) => m?.role === "owner")?.username || "Unknown"}`),
    editFields: (item) => ({
      class_id: item.class_id,
      name: item.name || "",
      description: item.description || "",
      is_public: item.access?.is_public || item.visibility === "public",
      visibility: item.visibility || (item.access?.is_public ? "public" : "private"),
      type: item.type || "personal",
      tags: item.tags || [],
      gate_id: item.gate_id || "",
      settings: item.settings || {
        max_boards: 100,
        max_members: 50,
        board_creation_cost: 50,
        tweet_cost: 1,
        allow_invites: true,
        require_approval: false,
        ai_moderation_enabled: true,
        auto_archive_after: 30,
      },
    }),
  },
  board: {
    typeLabel: (item) => (item.type === "group" ? "Group" : "Personal"),
    tagText: (item) => (item.tags?.length > 0 ? `#${item.tags[0]}` : ENTITY_CONFIG.board.typeLabel(item)),
    navigatePath: (itemId) => `/board/${itemId}`,
    icon: Dashboard,
    counters: [
      { key: "member_count", icon: People, label: "Members", source: (item) => item.members?.length || 0 },
      { key: "tweet_count", icon: Forum, label: "Tweets", source: (item) => item.stats?.tweet_count || 0 },
    ],
    ownerLabel: (item) => `Author: ${item.members?.find((m) => m?.role === "owner")?.username || "Unknown"}`,
    editFields: (item) => ({
      board_id: item.board_id,
      name: item.name || "",
      description: item.description || "",
      is_public: item.is_public || item.visibility === "public",
      visibility: item.is_public ? "public" : "private",
      type: item.type || "personal",
      tags: item.tags || [],
      gate_id: item.gate_id || "",
      class_id: item.class_id || "",
      settings: item.settings || {
        max_tweets: 100,
        max_members: 50,
        tweet_cost: 1,
        favorite_cost: 1,
        points_to_creator: 1,
        allow_invites: true,
        require_approval: false,
        ai_moderation_enabled: true,
        auto_archive_after: 30,
      },
    }),
  },
  gate: {
    typeLabel: (item) => (item.type === "community" ? "Community" : "Organization"),
    tagText: (item) => ENTITY_CONFIG.gate.typeLabel(item),
    navigatePath: (itemId) => `/gate/${itemId}`,
    icon: Group,
    counters: [
      { key: "member_count", icon: People, label: "Members", source: (item) => item.stats?.member_count || item.members?.length || 0 },
      { key: "classes", icon: School, label: "Classes", source: (item) => item.classes?.length || 0 },
      { key: "boards", icon: Dashboard, label: "Boards", source: (item) => item.boards?.length || 0 },
      { key: "favorite_count", icon: Star, label: "Favorites", source: (item) => item.stats?.favorite_count || 0, hideIfZero: true },
      { key: "tweet_count", icon: Forum, label: "Posts", source: (item) => item.stats?.tweet_count || 0, hideIfZero: true },
    ],
    ownerLabel: (item) => `Owner: ${item.members?.find((m) => m?.role === "owner")?.username || "Unknown"}`,
    editFields: (item) => ({
      gate_id: item.gate_id,
      name: item.name || "",
      description: item.description || "",
      is_public: item.access?.is_public || item.visibility === "public",
      visibility: item.visibility || (item.access?.is_public ? "public" : "private"),
      type: item.type || "community",
      settings: item.settings || {
        class_creation_cost: 100,
        board_creation_cost: 50,
        max_members: 1000,
        ai_moderation_enabled: true,
      },
    }),
  },
};

const CardMain = ({
  item,
  itemId,
  entityType,
  handleFavorite,
  setEditingItem,
  setItemToDelete,
  setDeleteDialogOpen,
  handleManageMembers,
  navigate,
  currentUser,
  token,
}) => {
  const theme = useTheme();
  const config = ENTITY_CONFIG[entityType];

  // Navigation handlers
  const handleKeyPress = useCallback(
    (e) => {
      if (!config || (e.key !== "Enter" && e.key !== " ")) return;
      navigate(config.navigatePath(itemId));
    },
    [navigate, config, itemId]
  );

  const handleNavigate = useCallback(() => {
    if (!config) return;
    navigate(config.navigatePath(itemId));
  }, [navigate, config, itemId]);

  // Validate entityType
  if (!config) {
    console.error(`Invalid entityType: ${entityType}`);
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>
        <Typography variant="body2">Invalid card type.</Typography>
      </Box>
    );
  }

  // Calculate grid span based on content length
  const totalLength = (item?.name?.length || 0) + (item?.description?.length || 0);
  const span = totalLength > 100 ? 3 : totalLength > 50 ? 2 : 1;

  // Determine user permissions
  const isFavorited = item?.is_favorited || false;
  const userRole = item?.members?.find((m) => m?.anonymous_id === currentUser?.anonymous_id)?.role || "none";
  const isOwner = item?.creator_id === currentUser?.anonymous_id;
  const canEdit = isOwner || userRole === "admin";
  const canDelete = isOwner;
  const isPublic = item?.access?.is_public || item?.visibility === "public" || item?.is_public;
  const iconSize = "small";

  // Visibility icon
  const getVisibilityIcon = () => {
    return isPublic ? (
      <Public sx={{ mb: 0.1 }} fontSize="inherit" />
    ) : (
      <Lock sx={{ color: theme.palette.error.main, mb: 0.1 }} fontSize="inherit" />
    );
  };

  // Styling for action buttons
  const actionIconButtonSx = {
    padding: "6px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      borderRadius: "50%",
    },
  };

  const deleteIconButtonSx = {
    ...actionIconButtonSx,
    color: theme.palette.error.main,
    "&:hover": {
      backgroundColor: alpha(theme.palette.error.main, 0.08),
    },
  };

  // Tag colors based on type
  const getTagColors = () => {
    const isDark = theme.palette.mode === "dark";
    const typeLabel = config?.typeLabel(item);
    if (typeLabel === "Group" || typeLabel === "Organization") {
      return {
        backgroundColor: isDark ? theme.palette.secondary.dark : theme.palette.secondary.light,
        color: theme.palette.secondary.contrastText,
      };
    }
    return {
      backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    };
  };

  return (
    <Box
      sx={{
        gridColumn: { xs: "span 1", md: `span ${span}` },
        backgroundColor: "background.paper",
        borderRadius: theme.shape.borderRadiusMedium,
        p: { xs: 2, md: 2.5 },
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: 190, sm: 210, md: 210 },
        transition: "all 0.3s ease-in-out",
        width: { xs: "100%", sm: "auto" },
        boxSizing: "border-box",
        position: "relative",
        "&:hover": {
          backgroundColor: "background.hover",
          transform: "scale(1.02)",
        },
      }}
      onClick={handleNavigate}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View ${entityType} ${item?.name || `Untitled ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}`}
    >
      {/* Top Section: Tag and Action Icons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Chip
          size="small"
          label={config.tagText(item)}
          sx={{
            ...getTagColors(),
            fontWeight: 500,
            fontSize: "0.75rem",
            borderRadius: "8px",
            height: "26px",
            lineHeight: "18px",
            padding: "0 8px",
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.1, md: 0.25 } }}>
          {canEdit && (
            <Tooltip title={`Edit ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItem(config.editFields(item));
                }}
                size={iconSize}
                aria-label={`Edit ${entityType}`}
                sx={actionIconButtonSx}
              >
                <Edit fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite(itemId, isFavorited);
              }}
              size={iconSize}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              sx={actionIconButtonSx}
            >
              {isFavorited ? (
                <Star fontSize={iconSize} sx={{ color: theme.palette.primary.main }} />
              ) : (
                <StarBorder fontSize={iconSize} sx={{ color: theme.palette.text.secondary }} />
              )}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Manage Members">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleManageMembers(itemId);
                }}
                size={iconSize}
                aria-label={`Manage ${entityType} members`}
                sx={actionIconButtonSx}
              >
                <GroupAdd fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title={`Delete ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setItemToDelete(itemId);
                  setDeleteDialogOpen(true);
                }}
                size={iconSize}
                aria-label={`Delete ${entityType}`}
                sx={deleteIconButtonSx}
              >
                <Delete fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Middle Section: Title and Description */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          px: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            my: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            color: theme.palette.text.primary,
            width: "100%",
          }}
        >
          {item?.name || `Untitled ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`}
        </Typography>
        {item?.description && (
          <Tooltip title={item.description} placement="bottom" enterDelay={300}>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mt: 0.5,
                mb: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                width: "100%",
              }}
            >
              {item.description}
            </Typography>
          </Tooltip>
        )}
      </Box>

      {/* Footer Section: Owner, Counters, and Visibility */}
      <Box
        sx={{
          mt: "auto",
          pt: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.875rem",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "40%",
          }}
        >
          {config.ownerLabel(item)}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 } }}>
          {config.counters.map(
            (counter) =>
              (!counter.hideIfZero || counter.source(item) > 0) && (
                <Tooltip key={counter.key} title={`${counter.label}: ${counter.source(item)}`}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
                    <counter.icon fontSize="inherit" />
                    <Typography variant="caption" sx={{ fontSize: "inherit" }}>
                      {counter.source(item)}
                    </Typography>
                  </Box>
                </Tooltip>
              )
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
            {getVisibilityIcon()}
            <Typography
              variant="caption"
              sx={{
                color: isPublic ? theme.palette.text.primary : theme.palette.error.main,
                fontWeight: 500,
                fontSize: "inherit",
              }}
            >
              {isPublic ? "Public" : "Private"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// PropTypes for CardMain
CardMain.propTypes = {
  item: PropTypes.shape({
    class_id: PropTypes.string,
    board_id: PropTypes.string,
    gate_id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    is_favorited: PropTypes.bool,
    creator_id: PropTypes.string,
    creator: PropTypes.shape({
      username: PropTypes.string,
      anonymous_id: PropTypes.string,
    }),
    members: PropTypes.arrayOf(
      PropTypes.shape({
        anonymous_id: PropTypes.string,
        username: PropTypes.string,
        role: PropTypes.string,
      })
    ),
    stats: PropTypes.shape({
      member_count: PropTypes.number,
      favorite_count: PropTypes.number,
      tweet_count: PropTypes.number,
      view_count: PropTypes.number,
    }),
    type: PropTypes.string,
    classes: PropTypes.array,
    boards: PropTypes.array,
    tags: PropTypes.arrayOf(PropTypes.string),
    access: PropTypes.shape({
      is_public: PropTypes.bool,
    }),
    visibility: PropTypes.string,
    settings: PropTypes.object,
    gate_id: PropTypes.string,
    gateName: PropTypes.string,
    class_id: PropTypes.string,
    className: PropTypes.string,
    parent_board_id: PropTypes.string,
    child_board_ids: PropTypes.arrayOf(PropTypes.string),
    is_public: PropTypes.bool,
  }).isRequired,
  itemId: PropTypes.string.isRequired,
  entityType: PropTypes.oneOf(["gate", "class", "board"]).isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingItem: PropTypes.func.isRequired,
  setItemToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleManageMembers: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
  }),
  token: PropTypes.string,
};

export default memo(CardMain);