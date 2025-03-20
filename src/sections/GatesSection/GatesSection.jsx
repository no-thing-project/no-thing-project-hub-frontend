// src/sections/GatesSection/GatesSection.jsx
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
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

/**
 * @typedef {Object} Gate
 * @property {string} _id
 * @property {string} gate_id
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @param {Object} props
 * @param {Object} props.currentUser
 * @param {Gate[]} props.gates
 * @param {() => void} props.onCreate
 */
const GatesSection = React.memo(({ currentUser, gates, onCreate }) => {
  const navigate = useNavigate();

  const handleGateClick = useCallback((gate_id) => {
    if (gate_id) {
      navigate(`/gate/${gate_id}`);
    } else {
      console.error("Invalid gate ID for navigation");
    }
  }, [navigate]);

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button variant="contained" onClick={onCreate} startIcon={<Add />} sx={buttonStyles}>
            Create Gate
          </Button>
        }
      />
      <Box sx={cardGridStyles}>
        {gates.map((gate) => (
          <Card
            key={gate._id}
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
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
});

GatesSection.displayName = "GatesSection";

export default GatesSection;