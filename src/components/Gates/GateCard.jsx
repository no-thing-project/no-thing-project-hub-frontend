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
} from "@mui/icons-material";
import PropTypes from "prop-types";

const GateCard = ({
  gate,
  handleFavorite,
  setEditingGate,
  setGateToDelete,
  setDeleteDialogOpen,
  handleAddMember,
  handleRemoveMember,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();
  const totalLength = (gate.name?.length || 0) + (gate.description?.length || 0);
  let span = 1;
  if (totalLength > 100) span = 3;
  else if (totalLength > 40) span = 2;

  const isFavorited = gate.is_favorited || false;
  const userRole = gate.members?.find((m) => m.anonymous_id === currentUser?.anonymous_id)?.role || "none";
  const isOwner = gate.creator_id === currentUser?.anonymous_id;
  const canEdit = isOwner || userRole === "admin";
  const canDelete = isOwner;
  const isPublic = gate.access?.is_public || gate.visibility === "public";
  const owner = gate.members?.find((m) => m.role === "owner");
  const ownerUsername = owner?.username || "Unknown";
  const typeLabel = gate.type === "community" ? "Community" : "Organization";
  const iconSize = "small";

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        navigate(`/gate/${gate.gate_id}`);
      }
    },
    [navigate, gate.gate_id]
  );

  const handleNavigate = useCallback(() => {
    navigate(`/gate/${gate.gate_id}`);
  }, [navigate, gate.gate_id]);

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
  
  const getTagColors = () => {
    const isDark = theme.palette.mode === 'dark';
    if (gate.type === "organization") {
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
      aria-label={`View gate ${gate.name || "Untitled Gate"}`}
    >
      {/* Top Section: Tag and Action Icons - Styled like BoardsCard */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Chip
          size="small"
          label={typeLabel}
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
            <Tooltip title="Edit Gate">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingGate({
                    gate_id: gate.gate_id,
                    name: gate.name || "",
                    description: gate.description || "",
                    is_public: isPublic,
                    visibility: gate.visibility || (gate.access?.is_public ? "public" : "private"),
                    type: gate.type || "community",
                    settings: gate.settings || {
                      class_creation_cost: 100,
                      board_creation_cost: 50,
                      max_members: 1000,
                      ai_moderation_enabled: true,
                    },
                  });
                }}
                size={iconSize}
                aria-label="Edit gate"
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
                handleFavorite(gate.gate_id, isFavorited);
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
            <Tooltip title="Add Member">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddMember(gate.gate_id);
                }}
                size={iconSize}
                aria-label="Add member to gate"
                sx={actionIconButtonSx}
              >
                <GroupAdd fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Gate">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setGateToDelete(gate.gate_id);
                  setDeleteDialogOpen(true);
                }}
                size={iconSize}
                aria-label="Delete gate"
                sx={deleteIconButtonSx}
              >
                <Delete fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Centered Title and Description - Styled like BoardsCard */}
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
          {gate.name || "Untitled Gate"}
        </Typography>

        {gate.description && (
          <Tooltip title={gate.description} placement="bottom" enterDelay={300}>
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
              {gate.description}
            </Typography>
          </Tooltip>
        )}
      </Box>
      
      {/* Footer: Owner, Counters, and Visibility - Styled like BoardsCard */}
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
            fontSize: 'inherit' 
          }}
        >
          Owner: {ownerUsername}
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: {xs: 1, md:1.5} }}> {/* Adjusted gap */}
          <Tooltip title={`Members: ${gate.stats?.member_count || gate.members?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <People fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {gate.stats?.member_count || gate.members?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`Classes: ${gate.classes?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <School fontSize="inherit" /> 
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {gate.classes?.length || 0}
              </Typography>
            </Box>
          </Tooltip>
          
          <Tooltip title={`Boards: ${gate.boards?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <Dashboard fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {gate.boards?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          {(gate.stats?.favorite_count || 0) > 0 && (
            <Tooltip title={`Favorites: ${gate.stats.favorite_count}`}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
                <Star fontSize="inherit" />
                <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                  {gate.stats.favorite_count}
                </Typography>
              </Box>
            </Tooltip>
          )}
          
          {(gate.stats?.tweet_count || 0) > 0 && (
             <Tooltip title={`Posts: ${gate.stats?.tweet_count || 0}`}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
                <Forum fontSize="inherit" />
                <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                    {gate.stats?.tweet_count || 0}
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

GateCard.propTypes = {
  gate: PropTypes.shape({
    gate_id: PropTypes.string.isRequired,
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
    classes: PropTypes.array,
    boards: PropTypes.array,
    tags: PropTypes.arrayOf(PropTypes.string),
    access: PropTypes.shape({
      is_public: PropTypes.bool,
    }),
    visibility: PropTypes.string,
    settings: PropTypes.object,
  }).isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingGate: PropTypes.func.isRequired,
  setGateToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleAddMember: PropTypes.func.isRequired,
  handleRemoveMember: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
  }),
};

export default memo(GateCard);