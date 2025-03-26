import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Edit, Delete, Favorite, FavoriteBorder, Public, Lock } from "@mui/icons-material";

const GateCard = ({
  gate,
  localLikes,
  handleLike,
  setEditingGate,
  setGateToDelete,
  setDeleteDialogOpen,
  navigate,
}) => {
  const totalLength = gate.name.length + (gate.description ? gate.description.length : 0);
  let span = 1;
  if (totalLength > 100) {
    span = 3;
  } else if (totalLength > 40) {
    span = 2;
  }
  const isLiked =
    localLikes[gate.gate_id] !== undefined ? localLikes[gate.gate_id] : gate.is_liked;

  return (
    <Box
      key={gate.gate_id}
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
      onClick={() => navigate(`/gate/${gate.gate_id}`)}
    >
      <Box sx={{ alignSelf: "flex-end", display: "flex", gap: 1, mb: 1 }}>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setEditingGate({
              gate_id: gate.gate_id,
              name: gate.name,
              description: gate.description || "",
              visibility: gate.is_public ? "Public" : "Private",
            });
          }}
          sx={{ p: 1, color: "text.primary" }}
        >
          <Edit />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleLike(gate.gate_id, isLiked);
          }}
          sx={{ p: 1, color: "text.primary" }}
        >
          {isLiked ? <Favorite color="text.primary" /> : <FavoriteBorder />}
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            setGateToDelete(gate.gate_id);
            setDeleteDialogOpen(true);
          }}
          sx={{ p: 1, color: "error.dark" }}
        >
          <Delete />
        </IconButton>
      </Box>
      <Box sx={{ flexGrow: 1, my: 1, alignContent: "center" }}>
        <Typography variant="h6" sx={{ mb: 1, textAlign: "center" }}>
          {gate.name}
        </Typography>
        {gate?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            {gate.description}
          </Typography>
        )}
      </Box>
      <Box sx={{ width: "100%", mt: 1 }} onClick={() => navigate(`/gate/${gate.gate_id}`)}>
        {gate.is_public ? (
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

export default GateCard;