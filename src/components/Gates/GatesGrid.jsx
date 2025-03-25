// src/components/Gates/GatesGrid.jsx
import React from "react";
import { Grid, Card, CardContent, Typography, Button, IconButton, Box } from "@mui/material";
import { Edit, Delete, Favorite, FavoriteBorder } from "@mui/icons-material";

const GatesGrid = ({
  filteredGates,
  localLikes,
  handleLike,
  setEditingGate,
  setGateToDelete,
  setDeleteDialogOpen,
  navigate,
}) => {
  return (
    <Grid container spacing={3} sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
      {filteredGates.map((gate) => {
        const isLiked =
          localLikes[gate.gate_id] !== undefined ? localLikes[gate.gate_id] : gate.is_liked;
        return (
          <Grid item xs={12} sm={6} md={4} key={gate.gate_id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" onClick={() => navigate(`/gate/${gate.gate_id}`)} sx={{ cursor: "pointer" }}>
                  {gate.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {gate.description || "No description"}
                </Typography>
                <Typography variant="caption">
                  {gate.is_public ? "Public" : "Private"}
                </Typography>
              </CardContent>
              <Box sx={{ p: 1, display: "flex", justifyContent: "space-between" }}>
                <IconButton onClick={() => handleLike(gate.gate_id, isLiked)}>
                  {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
                <Box>
                  <Button startIcon={<Edit />} onClick={() => setEditingGate(gate)}>
                    Edit
                  </Button>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => {
                      setGateToDelete(gate.gate_id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GatesGrid;