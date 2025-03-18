import React from "react";
import { Card, CardActionArea, Box, Typography, IconButton, Chip } from "@mui/material";
import { FavoriteBorder, Favorite, Lock, Public } from "@mui/icons-material"; // Імпорт усіх необхідних іконок
import { cardStyles, cardActionAreaStyles, chipStyles } from "../../styles/BoardSectionStyles";
import { getBoardCategoryName, getCategoryStyles, getVisibilityIconData } from "../../utils/boardUtils";

const BoardCard = ({ board, liked, onClick, onLike, boardClasses }) => {
  // Отримуємо дані для іконки видимості
  const { icon: visibilityIcon, color: visibilityColor } = getVisibilityIconData(
    board.is_public ? "Public" : "Private"
  );
  const VisibilityIcon = visibilityIcon === "Lock" ? Lock : Public;

  return (
    <Card sx={cardStyles} onClick={onClick}>
      <CardActionArea sx={cardActionAreaStyles}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 5, width: "100%" }}>
          <Chip
            label={`# ${getBoardCategoryName(board, boardClasses)}`}
            size="small"
            sx={chipStyles(getCategoryStyles(board, boardClasses).backgroundColor)}
          />
          <IconButton
            size="small"
            onClick={onLike}
            sx={{
              color: liked ? "#3E435D" : "#999",
              ":hover": { color: liked ? "#3E435D" : "#333" },
            }}
          >
            {liked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, mb: 2, width: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
            {board.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.95rem" }}>
            Author: {board.creator?.username || board.author || "Someone"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
            <VisibilityIcon sx={{ fontSize: 16, mr: 0.5, color: visibilityColor }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.95rem", color: board.is_public ? "#3E435D" : "#990000" }}
            >
              {board.is_public ? "Public" : "Private"}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default BoardCard;