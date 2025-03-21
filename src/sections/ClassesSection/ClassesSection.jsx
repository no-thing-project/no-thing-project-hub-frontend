// src/sections/ClassesSection/ClassesSection.jsx
import React from "react";
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

const ClassesSection = ({ currentUser, classes, onCreate }) => {
  const navigate = useNavigate();

  const handleClassClick = (class_id) => {
    navigate(`/class/${class_id}`);
  };

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button variant="contained" onClick={onCreate} startIcon={<Add />} sx={buttonStyles}>
            Create Class
          </Button>
        }
      />
      {classes.length > 0 ? (
        <Box sx={cardGridStyles}>
          {classes.map((classItem) => (
            <Card
              key={classItem.class_id}
              sx={cardStyles}
              onClick={() => handleClassClick(classItem.class_id)}
            >
              <CardContent>
                <Typography variant="h6">{classItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {classItem.description || ""}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Typography variant="h5" sx={{ textAlign: "center", mt: 5, color: "text.secondary" }}>
          No classes found
        </Typography>
      )}
    </Box>
  );
};

export default ClassesSection;