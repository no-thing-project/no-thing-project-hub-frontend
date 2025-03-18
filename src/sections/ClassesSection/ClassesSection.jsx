import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import UserHeader from "../../components/Headers/UserHeader";
import { containerStyles, buttonStyles, cardGridStyles, cardStyles } from "../../styles/GateSectionStyles";

const ClassesSection = ({ currentUser, classes, gateId }) => {
  const navigate = useNavigate();

  const handleCreateClass = () => {
    navigate(`/create-class/${gateId}`);
  };

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button variant="contained" onClick={handleCreateClass} startIcon={<Add />} sx={buttonStyles}>
            Create Class
          </Button>
        }
      />
      <Box sx={cardGridStyles}>
        {classes.map((cls) => (
          <Card key={cls._id} sx={cardStyles}>
            <CardContent>
              <Typography variant="h6">{cls.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {cls.description || ""}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ClassesSection;