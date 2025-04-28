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
  GroupAdd,
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
      aria-label={`View gate ${gate.name || "Untitled Gate"}`}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: { xs: "0.875rem", md: "1rem" } }}
        >
          {gate.slug || gate.name || "Untitled Gate"}
        </Typography>
        <Box sx={{ display: "flex", gap: { xs: 0.5, md: 1 } }}>
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
                    visibility: isPublic ? "public" : "private",
                    settings: gate.settings || {
                      class_creation_cost: 100,
                      board_creation_cost: 50,
                      max_members: 1000,
                      ai_moderation_enabled: true,
                    },
                  });
                }}
                size="small"
                aria-label="Edit gate"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite(gate.gate_id, isFavorited);
              }}
              size="small"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorited ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Add Member">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddMember(gate.gate_id);
                }}
                size="small"
                aria-label="Add member to gate"
              >
                <GroupAdd fontSize="small" />
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
                size="small"
                aria-label="Delete gate"
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
          {gate.name || "Untitled Gate"}
        </Typography>
        {gate.description && (
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              color: "text.secondary",
              fontSize: { xs: "0.75rem", md: "0.875rem" },
            }}
          >
            {gate.description}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          <Chip
            label={gate.type === "community" ? "Community" : "Organization"}
            icon={<People />}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          />
          <Chip
            label={`Members: ${gate.stats?.member_count || gate.members?.length || 0}`}
            icon={<People />}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          />
          <Chip
            label={`Classes: ${gate.classes?.length || 0}`}
            icon={<Forum />}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          />
          <Chip
            label={`Boards: ${gate.boards?.length || 0}`}
            icon={<Forum />}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          />
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`Owner: ${ownerUsername}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          />
          {(gate.stats?.favorite_count || 0) > 0 && (
            <Chip
              label={`Favorites: ${gate.stats.favorite_count}`}
              icon={<Star />}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
            />
          )}
          {gate.tags?.length > 0 && (
            <Chip
              label={`Tags: ${gate.tags.join(", ")}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
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
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          >
            {isPublic ? "Public" : "Private"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Forum fontSize="small" />
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
          >
            {gate.stats?.tweet_count || 0}
          </Typography>
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