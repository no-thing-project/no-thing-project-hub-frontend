// src/components/Cards/BoardCard.jsx (assumed implementation)
import React from "react";
import { Card, CardContent, Typography, IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";

const BoardCard = ({ board, liked, onClick, onLike, boardClasses }) => {
  if (!board) return null;

  const classData = board.class_id ? boardClasses[board.board_id] : null;
  const className = classData ? classData.name : "No Class";

  return (
    <Card onClick={onClick} sx={{ cursor: "pointer" }}>
      <CardContent>
        <Typography variant="h6">{board.name || "Unnamed Board"}</Typography>
        <Typography variant="body2" color="text.secondary">
          Class: {className}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Category: {board.category || "Uncategorized"}
        </Typography>
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering onClick of the card
            onLike(e, board.board_id);
          }}
        >
          <FavoriteIcon color={liked ? "error" : "inherit"} />
        </IconButton>
      </CardContent>
    </Card>
  );
};

export default BoardCard;