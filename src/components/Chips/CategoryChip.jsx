import React from "react";
import { Chip } from "@mui/material";

const CategoryChip = ({ label, isActive, backgroundColor, onClick }) => {
  return (
    <Chip
      label={`# ${label}`}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        fontSize: 12,
        height: 24,
        boxShadow: isActive ? "0 4px 8px rgba(0,0,0,0.4)" : "none",
        backgroundColor: isActive ? backgroundColor : "#eeeeee",
        color: "#fff",
        transition: "all 0.3s ease",
        ":hover": {
          backgroundColor: isActive ? backgroundColor : "#eeeeee",
          opacity: 0.8,
        },
      }}
    />
  );
};

export default CategoryChip;