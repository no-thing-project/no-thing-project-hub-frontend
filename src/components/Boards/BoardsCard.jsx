import React, { memo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Divider,
} from "@mui/material";
import {
  Edit,
  Delete,
  Favorite,
  FavoriteBorder,
  Public,
  Lock,
  LockOpen,
  Group,
  Visibility,
  Forum,
  AutoAwesome,
  People,
} from "@mui/icons-material";

const BoardCard = ({
  board,
  localLikes,
  handleLike,
  setEditingBoard,
  setBoardToDelete,
  setDeleteDialogOpen,
  navigate,
}) => {
  const totalLength =
    board.name.length + (board.description ? board.description.length : 0);
  let span = 1;
  if (totalLength > 100) span = 3;
  else if (totalLength > 40) span = 2;

  const isLiked =
    localLikes[board.board_id] !== undefined
      ? localLikes[board.board_id]
      : board.liked_by?.some(
          (l) => l.anonymous_id === board.current_user?.anonymous_id
        );

  // Визначаємо роль користувача
  const userRole = board.current_user?.role || "viewer"; // За замовчуванням "viewer", якщо ролі немає
  const isOwner = board.creator_id === board.current_user?.anonymous_id;
  const canEdit = isOwner || userRole === "editor";
  const canDelete = isOwner;

  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate(`/board/${board.board_id}`);
    }
  };

  const getVisibilityIcon = () => {
    if (board.is_public && board.type === "group") {
      return <Public fontSize="small" />;
    } else if (board.is_public && board.type === "personal") {
      return <LockOpen fontSize="small" color="primary" />;
    } else if (!board.is_public && board.type === "group") {
      return <Lock fontSize="small" color="primary" />;
    } else {
      return <Lock fontSize="small" color="error" />;
    }
  };

  return (
    <Box
      key={board.board_id}
      sx={{
        gridColumn: { xs: "span 1", md: `span ${span}` },
        backgroundColor: "background.paper",
        borderRadius: 2,
        p: 2,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: 250,
        transition: "all 0.3s ease-in-out",
        ":hover": {
          backgroundColor: "background.hover",
          transform: "scale(1.02)",
        },
      }}
      onClick={() => navigate(`/board/${board.board_id}`)}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View board ${board.name}`}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {board.slug}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {board.ai_moderation?.is_enabled && (
            <Tooltip title="AI Moderation Enabled">
              <AutoAwesome fontSize="small" />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingBoard({ ...board });
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isLiked ? "Unlike" : "Like"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleLike(board.board_id, isLiked);
              }}
              size="small"
            >
              {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setBoardToDelete(board.board_id);
                  setDeleteDialogOpen(true);
                }}
                size="small"
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {board.name}
        </Typography>
        {board.description && (
          <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
            {board.description}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          <Chip
            label={board.type === "group" ? "Group" : "Personal"}
            icon={<Group />}
            size="small"
          />
          {/* <Chip label={`Tweets: ${board.stats?.tweet_count ?? 0}`} size="small" /> */}
          {/* <Chip label={`Likes: ${board.stats?.like_count ?? 0}`} size="small" /> */}
          {/* <Chip label={`Views: ${board.stats?.view_count ?? 0}`} size="small" /> */}

        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {board.gate?.name && (
            <Chip label={`Gate: ${board.gate.name}`} size="small" />
          )}
          {board.class?.name && (
            <Chip label={`Class: ${board.class.name}`} size="small" />
          )}
          {board.settings?.tweet_cost && (
            <Chip label={`Tweet Cost: ${board.settings.tweet_cost}`} size="small" />
          )}
          {board.settings?.like_cost && (
            <Chip label={`Like Cost: ${board.settings.like_cost}`} size="small" />
          )}
          {board.settings?.points_to_creator && (
            <Chip label={`Creator Reward: ${board.settings.points_to_creator}`} size="small" />
          )}
          {board.type === "group" && board.members?.length > 0 && (
            <Chip label={`Members: ${board.members.length}`} size="small" icon={<People />} />
          )}
          <Chip label={`Points: ${board.stats?.points_earned ?? 0}`} size="small" />
          {board.tags?.length > 0 && (
            <Chip label={`Tags: ${board.tags.join(", ")}`} size="small" />
          )}
          {board.parent_board_id && <Chip label="Has Parent" size="small" />}
          {board.child_board_ids?.length > 0 && (
            <Chip label={`Children: ${board.child_board_ids.length}`} size="small" />
          )}
          {board.settings?.max_tweets && (
            <Chip label={`Max Tweets: ${board.settings.max_tweets}`} size="small" />
          )}
          {board.settings?.max_members && (
            <Chip label={`Max Members: ${board.settings.max_members}`} size="small" />
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getVisibilityIcon()}
          <Typography variant="caption">
            {board.visibility.charAt(0).toUpperCase() + board.visibility.slice(1)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Forum fontSize="small" />
          <Typography variant="caption">
            {board.stats?.tweet_count ?? 0}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Visibility fontSize="small" />
          <Typography variant="caption">
            {board.stats?.view_count || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(BoardCard);