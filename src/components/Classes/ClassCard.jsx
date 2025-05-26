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
  Dashboard,
} from "@mui/icons-material";
import PropTypes from "prop-types";

const ClassCard = ({
  classItem,
  handleFavorite,
  setEditingClass,
  setClassToDelete,
  setDeleteDialogOpen,
  handleAddMember,
  handleRemoveMember,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();
  const totalLength = (classItem.name?.length || 0) + (classItem.description?.length || 0);
  let span = 1;
  if (totalLength > 100) span = 3;
  else if (totalLength > 40) span = 2;

  const isFavorited = classItem.is_favorited || false;
  const userRole = classItem.members?.find((m) => m.anonymous_id === currentUser?.anonymous_id)?.role || "none";
  const isOwner = classItem.creator_id === currentUser?.anonymous_id;
  const canEdit = isOwner || userRole === "admin";
  const canDelete = isOwner;
  const isPublic = classItem.access?.is_public || classItem.visibility === "public";
  const owner = classItem.members?.find((m) => m.role === "owner");
  const ownerUsername = owner?.username || "Unknown";
  const typeLabel = classItem.type === "group" ? "Group" : "Personal";
  const iconSize = "small";

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        navigate(`/class/${classItem.class_id}`);
      }
    },
    [navigate, classItem.class_id]
  );

  const handleNavigate = useCallback(() => {
    navigate(`/class/${classItem.class_id}`);
  }, [navigate, classItem.class_id]);

  const getVisibilityIcon = () => {
    return isPublic ? (
      <Public sx={{ mb: 0.1 }} fontSize="inherit" />
    ) : (
      <Lock sx={{ color: theme.palette.error.main, mb: 0.5 }} fontSize="inherit" />
    );
  };

  const actionIconButtonSx = {
    padding: "6px",
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderRadius: '50%',
    },
  };

  const deleteIconButtonSx = {
    ...actionIconButtonSx,
    color: theme.palette.error.main,
    '&:hover': {
      ...actionIconButtonSx['&:hover'],
      backgroundColor: alpha(theme.palette.error.main, 0.08),
    },
  };

  const tagText = classItem.tags?.length > 0 ? `# ${classItem.tags[0]}` : typeLabel;

  const getTagColors = () => {
    const isDark = theme.palette.mode === 'dark';
    if (typeLabel === "Group") { 
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
      aria-label={`View class ${classItem.name || "Untitled Class"}`}
    >
      {/* Top Section: Tag and Action Icons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Chip
          size="small"
          label={tagText}
          sx={{
            ...getTagColors(),
            fontWeight: 500,
            fontSize: '0.75rem',
            borderRadius: '8px',
            height: '26px',
            lineHeight: '18px',
            padding: '0 8px',
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.1, md: 0.25 } }}>
          {canEdit && (
            <Tooltip title="Edit Class">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingClass({
                    class_id: classItem.class_id,
                    name: classItem.name || "",
                    description: classItem.description || "",
                    is_public: isPublic,
                    visibility: classItem.visibility || (classItem.access?.is_public ? "public" : "private"),
                    type: classItem.type || "personal",
                    tags: classItem.tags || [],
                    gate_id: classItem.gate_id || "",
                    settings: classItem.settings || {
                      max_boards: 100,
                      max_members: 50,
                      board_creation_cost: 50,
                      tweet_cost: 1,
                      allow_invites: true,
                      require_approval: false,
                      ai_moderation_enabled: true,
                      auto_archive_after: 30,
                    },
                  });
                }}
                size={iconSize}
                aria-label="Edit class"
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
                handleFavorite(classItem.class_id, isFavorited);
              }}
              size={iconSize}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              sx={actionIconButtonSx}
            >
              {isFavorited ? 
                <Star fontSize={iconSize} sx={{ color: theme.palette.primary.main }} /> : 
                <StarBorder fontSize={iconSize} sx={{ color: theme.palette.text.secondary }} />
              }
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Manage Members"> {/* Changed from Add Member to Manage Members if more appropriate */}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddMember(classItem.class_id); 
                }}
                size={iconSize}
                aria-label="Manage class members"
                sx={actionIconButtonSx}
              >
                <GroupAdd fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Class">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setClassToDelete(classItem.class_id);
                  setDeleteDialogOpen(true);
                }}
                size={iconSize}
                aria-label="Delete class"
                sx={deleteIconButtonSx}
              >
                <Delete fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Centered Title and Description */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', px:1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            my: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            color: theme.palette.text.primary,
            width: '100%',
          }}
        >
          {classItem.name || "Untitled Class"}
        </Typography>

        {classItem.description && (
          <Tooltip title={classItem.description} placement="bottom" enterDelay={300}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                width: '100%',
              }}
            >
              {classItem.description}
            </Typography>
          </Tooltip>
        )}
      </Box>
      
      {/* Footer: Gate Name/Owner, Counters, and Visibility */}
      <Box
        sx={{
          mt: 'auto',
          pt: 1.5, 
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: '0.875rem', 
        }}
      >
        <Typography 
          variant="caption" 
          sx={{
            color: theme.palette.text.secondary, 
            fontSize: 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100px',
          }}
        >
          {classItem.gateName ? `From: ${classItem.gateName}` : `Owner: ${ownerUsername}`}
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: {xs: 1, md:1.5} }}>
          <Tooltip title={`Members: ${classItem.stats?.member_count || classItem.members?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <People fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {classItem.stats?.member_count || classItem.members?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`Boards: ${classItem.boards?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <Dashboard fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {classItem.boards?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          {(classItem.stats?.favorite_count || 0) > 0 && (
            <Tooltip title={`Favorites: ${classItem.stats.favorite_count}`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
                <Star fontSize="inherit" />
                <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                  {classItem.stats.favorite_count}
                </Typography>
              </Box>
            </Tooltip>
          )}
          
          {(classItem.stats?.tweet_count || 0) > 0 && (
             <Tooltip title={`Posts: ${classItem.stats?.tweet_count || 0}`}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
                <Forum fontSize="inherit" />
                <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                    {classItem.stats?.tweet_count || 0}
                </Typography>
                </Box>
            </Tooltip>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3}}>
            {getVisibilityIcon()}
            <Typography
              variant="caption"
              sx={{ 
                color: isPublic ? theme.palette.text.primary : theme.palette.error.main,
                fontWeight: 500, 
                fontSize: 'inherit' 
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

ClassCard.propTypes = {
  classItem: PropTypes.shape({
    class_id: PropTypes.string.isRequired,
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
    }),
    type: PropTypes.string,
    boards: PropTypes.array,
    tags: PropTypes.arrayOf(PropTypes.string),
    access: PropTypes.shape({
      is_public: PropTypes.bool,
    }),
    visibility: PropTypes.string,
    settings: PropTypes.object,
    gate_id: PropTypes.string,
    gateName: PropTypes.string,
  }).isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingClass: PropTypes.func.isRequired,
  setClassToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleAddMember: PropTypes.func.isRequired,
  handleRemoveMember: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
  }),
};

export default memo(ClassCard);