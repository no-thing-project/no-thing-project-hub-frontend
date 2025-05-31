import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Typography, useTheme } from "@mui/material";
import { keyframes } from "@emotion/react";

// Shimmer animation
const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Levels that receive shimmer animation and glow
const animatedLevels = ["IGNITION", "VISIONARY", "MOMENTUM", "CREATION", "CORE"];

// Lookup table for status styles
const statusStyles = {
  BELIEVER: { gradient: "linear-gradient(45deg, #A1A1A1, #707070)" },
  NOVICE: { gradient: "linear-gradient(45deg, #BDC3C7, #2C3E50)" },
  SUPPORTER: { gradient: "linear-gradient(45deg, #7F8C8D, #95A5A6)" },
  INITIATE: { gradient: "linear-gradient(45deg, #FAD7A0, #E67E22)" },
  PIONEER: { gradient: "linear-gradient(45deg, #34495E, #2C3E50)" },
  TRAILBLAZER: { gradient: "linear-gradient(45deg, #FF6F61, #D7263D)" },
  ELEVATE: { gradient: "linear-gradient(45deg, #7B4397, #DC2430)" },
  CATALYST: { gradient: "linear-gradient(45deg, #11998E, #38EF7D)" },
  ACCELERATOR: { gradient: "linear-gradient(45deg, #16A085, #F4D03F)" },
  IGNITION: { gradient: "linear-gradient(45deg, #FF512F, #DD2476)" },
  VISIONARY: { gradient: "linear-gradient(45deg, #FC466B, #3F5EFB)" },
  INNOVATOR: { gradient: "linear-gradient(45deg, #8E44AD, #3498DB)" },
  MOMENTUM: { gradient: "linear-gradient(45deg, #00B09B, #96C93D)" },
  SPARK: { gradient: "linear-gradient(45deg, #F7971E, #FFD200)" },
  ARCHITECT: { gradient: "linear-gradient(45deg, #2ECC71, #27AE60)" },
  CREATION: { gradient: "linear-gradient(45deg, #F953C6, #B91D73)" },
  LUMINARY: { gradient: "linear-gradient(45deg, #F1C40F, #E67E22)" },
  LEGEND: { gradient: "linear-gradient(45deg, #D35400, #C0392B)" },
  TITAN: { gradient: "linear-gradient(45deg, #2C3E50, #4CA1AF)" },
  BUILDER: { gradient: "linear-gradient(45deg, #7F8C8D, #95A5A6)" },
  SHAPER: { gradient: "linear-gradient(45deg, #34495E, #5D6D7E)" },
  FORGE: { gradient: "linear-gradient(45deg, #E74C3C, #C0392B)" },
  ASCENDANT: { gradient: "linear-gradient(45deg, #3498DB, #2ECC71)" },
  BEACON: { gradient: "linear-gradient(45deg, #F1C40F, #F39C12)" },
  VANGUARD: { gradient: "linear-gradient(45deg, #8E44AD, #9B59B6)" },
  SENTINEL: { gradient: "linear-gradient(45deg, #2C3E50, #34495E)" },
  PILLAR: { gradient: "linear-gradient(45deg, #95A5A6, #7F8C8D)" },
  ETHEREAL: { gradient: "linear-gradient(45deg, #7F00FF, #E100FF)" },
  ETERNAL: { gradient: "linear-gradient(45deg, #1D2671, #C33764)" },
  SOUL: { gradient: "linear-gradient(90deg, #34495E 0%, #7B4397 16%, #38EF7D 33%, #FFD200 50%, #FF512F 67%, #3F5EFB 83%, #F953C6 100%)"},
  CORE: {
    gradient: `linear-gradient(90deg, #34495E 0%, #7B4397 16%, #38EF7D 33%, #FFD200 50%, #FF512F 67%, #3F5EFB 83%, #F953C6 100%)`,
    textShadow: "0 0 6px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.2)",
  },
  DEFAULT: { gradient: "linear-gradient(45deg, #bdbdbd, #9e9e9e)" },
};

const getStatusStyle = (level, theme) => {
  const styleConfig = statusStyles[level] || statusStyles.DEFAULT;
  let baseStyle = {
    display: "inline-block",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: { xs: "0.875rem", sm: "1rem", md: "1.2rem" },
    color: "transparent",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    backgroundImage: styleConfig.gradient,
    backgroundSize: "100% 100%",
    margin: "0 4px",
  };

  if (animatedLevels.includes(level)) {
    baseStyle = {
      ...baseStyle,
      backgroundSize: "400% 400%",
      animation: `${shimmer} 10s ease infinite`,
      textShadow: styleConfig.textShadow
        ? `${styleConfig.textShadow}, 0 0 8px rgba(255,255,255,0.4)`
        : "0 0 8px rgba(255,255,255,0.4)",
    };
  }

  return baseStyle;
};

const StatusBadge = ({ level }) => {
  const theme = useTheme();
  const style = useMemo(() => getStatusStyle(level, theme), [level, theme]);

  return (
    <Typography component="span" sx={style}>
      {level || "UNKNOWN"}
    </Typography>
  );
};

StatusBadge.propTypes = {
  level: PropTypes.string,
};

export default StatusBadge;