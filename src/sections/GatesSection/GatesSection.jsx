import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import UserHeader from "../../components/Basic/Headers/UserHeader";
import { containerStyles, buttonStyles, cardGridStyles, cardStyles } from "../../styles/GateSectionStyles";

const GatesSection = ({ currentUser, gates }) => {
  const navigate = useNavigate();

  const handleGateClick = (gateId) => {
    navigate(`/classes/${gateId}`);
  };

  const handleCreateGate = () => {
    navigate("/create-gate");
  };

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button variant="contained" onClick={handleCreateGate} startIcon={<Add />} sx={buttonStyles}>
            Create Gate
          </Button>
        }
      />
      <Box sx={cardGridStyles}>
        {gates.map((gate) => (
          <Card key={gate._id} sx={cardStyles} onClick={() => handleGateClick(gate.gate_id)}>
            <CardContent>
              <Typography variant="h6">{gate.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {gate.description || ""}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default GatesSection;