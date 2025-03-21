// src/sections/GatesSection/GatesSection.jsx
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add, Edit, Delete, Favorite, FavoriteBorder } from "@mui/icons-material";
import UserHeader from "../../components/Headers/UserHeader";

const containerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  p: 3,
  bgcolor: "background.paper",
  minHeight: "calc(100vh - 64px)",
};

const buttonStyles = {
  textTransform: "none",
  borderRadius: 2,
  px: 3,
  py: 1,
  fontSize: "1rem",
};

const cardGridStyles = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(250px, 1fr))" },
  gap: 2,
};

const cardStyles = {
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": { transform: "scale(1.02)", boxShadow: 3 },
};

const GatesSection = React.memo(({ currentUser, gates, onCreate, onUpdate, onDelete, onLike }) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gateToDelete, setGateToDelete] = useState(null);

  const handleGateClick = useCallback(
    (gate_id) => {
      if (gate_id) {
        navigate(`/gate/${gate_id}`);
      } else {
        console.error("Invalid gate ID for navigation");
      }
    },
    [navigate]
  );

  const handleDeleteConfirm = (gate) => {
    setGateToDelete(gate);
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser?.username || "Guest"}
        accessLevel={currentUser?.access_level || 0}
        actionButton={
          <Button variant="contained" onClick={onCreate} startIcon={<Add />} sx={buttonStyles}>
            Create Gate
          </Button>
        }
      />
      {gates.length > 0 ? (
        <Box sx={cardGridStyles}>
          {gates.map((gate) => {
            const isLiked = gate.liked_by?.includes(currentUser?.anonymous_id);
            return (
              <Card
                key={gate.gate_id}
                sx={cardStyles}
                onClick={() => handleGateClick(gate.gate_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleGateClick(gate.gate_id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open gate ${gate.name}`}
              >
                <CardContent>
                  <Typography variant="h6">{gate.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {gate.description || "No description"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(gate);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike(gate.gate_id, isLiked);
                      }}
                    >
                      {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfirm(gate);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Typography variant="h5" sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}>
          No gates found
        </Typography>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the gate "{gateToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              onDelete(gateToDelete.gate_id);
              setDeleteDialogOpen(false);
            }}
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

GatesSection.displayName = "GatesSection";

export default GatesSection;