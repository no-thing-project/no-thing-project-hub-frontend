import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Add } from "@mui/icons-material";
import StatusBadge from "../Profile/StatusBadge.jsx";

const ClassesSection = ({ currentUser, classes, gateId }) => {
  const navigate = useNavigate();

  const handleCreateClass = () => {
    navigate(`/create-class/${gateId}`);
  };

  return (
    <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
      <Card
        sx={{
          borderRadius: 2.5,
          mb: 3,
          backgroundColor: "background.paper",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
              mb: 1,
              ml: 3,
              mr: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 400, color: "text.primary" }}
              >
                {currentUser.username}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Class: <StatusBadge level={currentUser.access_level} />
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleCreateClass}
              startIcon={<Add />}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 0.8,
                boxShadow: "none",
                padding: "10px 20px",
                transition: "all 0.5s ease",
                backgroundColor: "background.button",
                color: "background.paper",
                ":hover": {
                  boxShadow: "none",
                  backgroundColor: "background.default",
                  color: "text.primary",
                  transition: "all 0.5s ease",
                },
              }}
            >
              Create Class
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        }}
      >
        {classes.map((cls) => (
          <Card
            key={cls._id}
            sx={{
              cursor: "pointer",
              borderRadius: 2,
              p: 2,
              transition: "all 0.3s ease-in-out",
              backgroundColor: "background.paper",
              boxShadow: "none",
              ":hover": {
                backgroundColor: "background.hover",
                transform: "translateY(-2px)",
                transition: "all 0.3s ease-in-out",
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              },
            }}
          >
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
