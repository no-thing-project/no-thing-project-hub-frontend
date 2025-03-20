// src/sections/GateSection/GateSection.jsx
import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
 * @typedef {Object} Class
 * @property {string} class_id
 * @property {string} name
 * @property {string} [description]
 */

/**
 * @typedef {Object} GateData
 * @property {string} gate_id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [creator_id]
 */

/**
 * @param {Object} props
 * @param {Object} props.currentUser
 * @param {GateData} props.gateData
 * @param {Class[]} props.classes
 * @param {() => void} props.onCreate
 */
const GateSection = React.memo(({ currentUser, gateData, classes, onCreate }) => {
  const navigate = useNavigate();
  const { gate_id } = useParams();

  const handleClassClick = useCallback((class_id) => {
    if (gate_id && class_id) {
      navigate(`/class/${class_id}`);
    } else {
      console.error("Invalid gate ID or class ID for navigation");
    }
  }, [navigate, gate_id]);

  if (!currentUser || !gateData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Error: User or gate data is missing. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={containerStyles}>
      <UserHeader
        username={currentUser.username}
        accessLevel={currentUser.access_level}
        actionButton={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreate}
            sx={buttonStyles}
          >
            Create Class
          </Button>
        }
      />
      <Typography variant="h5" sx={{ mb: 2 }}>
        {gateData.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {gateData.description || "No description provided."}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Created by: {gateData.creator_id || "Unknown"}
      </Typography>

      {classes.length > 0 ? (
        <Box sx={cardGridStyles}>
          {classes.map((classItem) => (
            <Card
              key={classItem.class_id}
              sx={cardStyles}
              onClick={() => handleClassClick(classItem.class_id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClassClick(classItem.class_id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Open class ${classItem.name}`}
            >
              <CardContent>
                <Typography variant="h6">{classItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {classItem.description || "No description"}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "50vh",
          }}
        >
          <Typography variant="h5" sx={{ color: "text.secondary" }}>
            No classes found in this gate
          </Typography>
        </Box>
      )}
    </Box>
  );
});

GateSection.displayName = "GateSection";

export default GateSection;