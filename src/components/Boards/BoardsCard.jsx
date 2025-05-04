import React, { memo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  useTheme,
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
  Visibility,
} from "@mui/icons-material";
import PropTypes from "prop-types";
import { chipStyles } from "../../styles/BaseStyles";

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
  const totalLength = (board.name?.length || 0) + (board.description?.length || 0);
  let span = 1;
  if (totalLength > 100) span = 3;
  else if (totalLength > 40) span = 2;

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
      <Public fontSize="small" color="success" />
    ) : (
      <Lock fontSize="small" color="error" />
    );
  };

  return (
    <Box
      sx={{
        gridColumn: { xs: "span 1", md: `span ${span}` },
        backgroundColor: "background.paper",
        borderRadius: theme.shape.borderRadiusMedium,
        p: { xs: 1.5, md: 2 },
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: { xs: 200, md: 250 },
        transition: "all 0.3s ease-in-out",
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: { xs: "0.875rem", md: "1rem" } }}
        >
          {board.slug || board.name || "Untitled Board"}
        </Typography>
        <Box sx={{ display: "flex", gap: { xs: 0.5, md: 1 } }}>
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
                size="small"
                aria-label="Edit board"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite(board.board_id, isFavorited);
              }}
              size="small"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorited ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Manage Members">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  openMemberDialog(board.board_id);
                }}
                size="small"
                aria-label="Manage board members"
              >
                <Group fontSize="small" />
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
                size="small"
                aria-label="Delete board"
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          sx={{ mb: 1, fontSize: { xs: "1.25rem", md: "1.5rem" } }}
        >
          {board.name || "Untitled Board"}
        </Typography>
        {board.description && (
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              color: "text.secondary",
              fontSize: { xs: "0.75rem", md: "0.875rem" },
            }}
          >
            {board.description}
          </Typography>
        )}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          <Chip
            label={typeLabel}
            icon={<People />}
            size="small"
            variant="outlined"
            sx={ chipStyles }
            aria-label={`Board type: ${typeLabel}`}
          />
          {isPublic ? (
            <Chip
              label={`Views: ${board.stats?.view_count || 0}`}
              icon={<Visibility />}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Views: ${board.stats?.view_count || 0}`}
            />
          ) : (
            <Chip
              label={`Members: ${board.members?.length || 0}`}
              icon={<People />}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Members: ${board.members?.length || 0}`}
            />
          )}
          <Chip
            label={`Tweets: ${board.stats?.tweet_count || 0}`}
            icon={<Forum />}
            size="small"
            variant="outlined"
            sx={ chipStyles }
            aria-label={`Tweets: ${board.stats?.tweet_count || 0}`}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {board.gateName && board.gateName !== "No Gate" && (
            <Chip
              label={`Gate: ${board.gateName}`}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Gate: ${board.gateName}`}
            />
          )}
          {board.className && board.className !== "No Class" && (
            <Chip
              label={`Class: ${board.className}`}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Class: ${board.className}`}
            />
          )}
          <Chip
            label={`Owner: ${ownerUsername}`}
            size="small"
            variant="outlined"
            sx={ chipStyles }
            aria-label={`Owner: ${ownerUsername}`}
          />
          {(board.stats?.favorite_count || 0) > 0 && (
            <Chip
              label={`Favorites: ${board.stats.favorite_count}`}
              icon={<Star />}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Favorites: ${board.stats.favorite_count}`}
            />
          )}
          {board.tags?.length > 0 && (
            <Chip
              label={`Tags: ${board.tags.join(", ")}`}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Tags: ${board.tags.join(", ")}`}
            />
          )}
          {board.parent_board_id && (
            <Chip
              label="Has Parent"
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label="Board has parent"
            />
          )}
          {board.child_board_ids?.length > 0 && (
            <Chip
              label={`Children: ${board.child_board_ids.length}`}
              size="small"
              variant="outlined"
              sx={ chipStyles }
              aria-label={`Children: ${board.child_board_ids.length}`}
            />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getVisibilityIcon()}
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" }, color: isPublic ? "success.main" : "error.main" }}
          >
            {isPublic ? "Public" : "Private"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Forum fontSize="small" />
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" }}}
          >
            {board.stats?.tweet_count || 0}
          </Typography>
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