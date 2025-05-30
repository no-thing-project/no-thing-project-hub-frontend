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
  Group,
} from "@mui/icons-material";
import PropTypes from "prop-types";

const BoardCard = ({
  board,
  handleFavorite,
  setEditingBoard,
  setBoardToDelete,
  setDeleteDialogOpen,
  openMemberDialog,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();
  const span = 1;

  const isFavorited = board.is_favorited || false;
  const userRole = board.members?.find((m) => m.anonymous_id === currentUser?.anonymous_id)?.role || "none";
  const isOwner = board.creator_id === currentUser?.anonymous_id;
  const canEdit = isOwner || userRole === "admin";
  const canDelete = isOwner;

  const isPublic = board.is_public || board.visibility === "public";
  const owner = board.members?.find((m) => m.role === "owner");
  const ownerUsername = owner?.username || "Unknown";
  const typeLabel = board.type === "group" ? "Group" : "Personal";

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        navigate(`/board/${board.board_id}`);
      }
    },
    [navigate, board.board_id]
  );

  const handleNavigate = useCallback(() => {
    navigate(`/board/${board.board_id}`);
  }, [navigate, board.board_id]);

  const getVisibilityIcon = () => {
    return isPublic ? (
      <Public sx={{ mb: 0.1 }}fontSize="inherit" />
    ) : (
      <Lock sx={{ color: theme.palette.error.main, mb: 0.5 }}fontSize="inherit" />
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

  const tagText = board.tags?.length > 0 ? `# ${board.tags[0]}` : typeLabel;
  const iconSize = "small";

  const getTagColors = () => {
    const isDark = theme.palette.mode === 'dark';
    if (typeLabel === "Group") {
      return {
        backgroundColor: isDark ? theme.palette.secondary.dark : theme.palette.secondary.light,
        color: isDark ? theme.palette.secondary.contrastText : theme.palette.secondary.contrastText,
      };
    }
    return {
      backgroundColor: isDark ? theme.palette.primary.dark : theme.palette.primary.light,
      color: isDark ? theme.palette.primary.contrastText : theme.palette.primary.contrastText,
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
      aria-label={`View board ${board.name || "Untitled Board"}`}
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
            <Tooltip title="Edit Board">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBoard({
                    board_id: board.board_id,
                    name: board.name || "",
                    description: board.description || "",
                    is_public: isPublic,
                    visibility: isPublic ? "public" : "private",
                    type: board.type || "personal",
                    tags: board.tags || [],
                    gate_id: board.gate_id || "",
                    class_id: board.class_id || "",
                    settings: board.settings || {
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
                  });
                }}
                size={iconSize}
                aria-label="Edit board"
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
                handleFavorite(board.board_id, isFavorited);
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
            <Tooltip title="Manage Members">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  openMemberDialog(board.board_id);
                }}
                size={iconSize}
                aria-label="Manage board members"
                sx={actionIconButtonSx}
              >
                <Group fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Board">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setBoardToDelete(board.board_id);
                  setDeleteDialogOpen(true);
                }}
                size={iconSize}
                aria-label="Delete board"
                sx={deleteIconButtonSx}
              >
                <Delete fontSize={iconSize} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Centered Title */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', px:1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            my: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            '-webkit-line-clamp': '2',
            '-webkit-box-orient': 'vertical',
            color: theme.palette.text.primary,
            width: '100%',
          }}
        >
          {board.name || "Untitled Board"}
        </Typography>

        {/* Description (centered) */}
        {board.description && (
          <Tooltip title={board.description} placement="bottom" enterDelay={300}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: 0.5,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                '-webkit-line-clamp': '2',
                '-webkit-box-orient': 'vertical',
                width: '100%',
              }}
            >
              {board.description}
            </Typography>
          </Tooltip>
        )}
      </Box>
      
      {/* Footer: Author, Counters, and Visibility - Pushed to bottom */}
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
          Author: {ownerUsername}
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}> {/* Increased gap */}
          <Tooltip title={`Members: ${board.members?.length || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <People fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {board.members?.length || 0}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title={`Tweets: ${board.stats?.tweet_count || 0}`}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: theme.palette.text.secondary }}>
              <Forum fontSize="inherit" />
              <Typography variant="caption" sx={{fontSize: 'inherit'}}>
                {board.stats?.tweet_count || 0}
              </Typography>
            </Box>
          </Tooltip>

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

BoardCard.propTypes = {
  board: PropTypes.shape({
    board_id: PropTypes.string.isRequired,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    is_favorited: PropTypes.bool,
    creator_id: PropTypes.string,
    members: PropTypes.arrayOf(
      PropTypes.shape({
        anonymous_id: PropTypes.string,
        username: PropTypes.string,
        role: PropTypes.string,
      })
    ),
    stats: PropTypes.shape({
      tweet_count: PropTypes.number,
      favorite_count: PropTypes.number,
      view_count: PropTypes.number,
    }),
    type: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    is_public: PropTypes.bool,
    visibility: PropTypes.string,
    settings: PropTypes.object,
    gate_id: PropTypes.string,
    gateName: PropTypes.string,
    class_id: PropTypes.string,
    className: PropTypes.string,
    parent_board_id: PropTypes.string,
    child_board_ids: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingBoard: PropTypes.func.isRequired,
  setBoardToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  openMemberDialog: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
  }),
};

export default memo(BoardCard);