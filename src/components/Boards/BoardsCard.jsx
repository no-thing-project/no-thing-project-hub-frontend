import React, { memo } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { Edit, Delete, Favorite, FavoriteBorder, Public, Lock } from "@mui/icons-material";

const BoardCard = ({
  board,
  localLikes,
  handleLike,
  setEditingBoard,
  setBoardToDelete,
  setDeleteDialogOpen,
  navigate,
}) => {
  const totalLength = board.name.length + (board.description ? board.description.length : 0);
  let span = 1;
  if (totalLength > 100) {
    span = 3;
  } else if (totalLength > 40) {
    span = 2;
  }
  const isLiked =
    localLikes[board.board_id] !== undefined ? localLikes[board.board_id] : board.is_liked;

  const handleKeyPress = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      navigate(`/board/${board.board_id}`);
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
        alignItems: "center",
        minHeight: 200,
        transition: "all 0.3s ease-in-out",
        ":hover": { backgroundColor: "background.hover", transform: "scale(1.02)" },
      }}
      onClick={() => navigate(`/board/${board.board_id}`)}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`View board ${board.name}`}
    >
      <Box sx={{ alignSelf: "flex-end", display: "flex", gap: 1, mb: 1 }}>
        <Tooltip title="Edit">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setEditingBoard({
                board_id: board.board_id,
                name: board.name,
                description: board.description || "",
                visibility: board.is_public ? "Public" : "Private",
              });
            }}
            sx={{ p: 1, color: "text.primary" }}
            aria-label={`Edit board ${board.name}`}
          >
            <Edit />
          </IconButton>
        </Tooltip>
        <Tooltip title={isLiked ? "Unlike" : "Like"}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleLike(board.board_id, isLiked);
            }}
            sx={{ p: 1, color: "text.primary" }}
            aria-label={isLiked ? "Unlike board" : "Like board"}
          >
            {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setBoardToDelete(board.board_id);
              setDeleteDialogOpen(true);
            }}
            sx={{ p: 1, color: "error.dark" }}
            aria-label={`Delete board ${board.name}`}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flexGrow: 1, my: 1, alignContent: "center" }}>
        <Typography variant="h6" sx={{ mb: 1, textAlign: "center" }}>
          {board.name}
        </Typography>
        {board?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            {board.description}
          </Typography>
        )}
      </Box>
      <Box sx={{ width: "100%", mt: 1 }} onClick={() => navigate(`/board/${board.board_id}`)}>
        {board.is_public ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              color: "text.primary",
            }}
          >
            <Public sx={{ mr: 1 }} />
            <Typography variant="caption">Public</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              color: "error.dark",
            }}
          >
            <Lock sx={{ mr: 1 }} />
            <Typography variant="caption">Private</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default memo(BoardCard);