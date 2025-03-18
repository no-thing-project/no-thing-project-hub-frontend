import React from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";

// Анімація переливання (shimmer)
const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Останні п'ять рівнів, що отримують анімацію та світіння
const animatedLevels = ["IGNITION", "VISIONARY", "MOMENTUM", "CREATION", "CORE"];

/**
 * Функція повертає стилі для кожного рівня.
 * Використовуємо градієнти та анімацію для більшої виразності.
 */
const getStatusStyle = (level) => {
  // Базовий стиль: прозорий текст з градієнтом
  let baseStyle = {
    display: "inline-block",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: "1.2rem",
    color: "transparent",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    backgroundSize: "100% 100%",
    margin: "0 4px",
  };

  // Встановлюємо градієнти для кожного рівня
  switch (level) {
    case "BELIEVER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #A1A1A1, #707070)";
      break;
    case "NOVICE":
      baseStyle.backgroundImage = "linear-gradient(45deg, #BDC3C7, #2C3E50)";
      break;
    case "SUPPORTER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #7F8C8D, #95A5A6)";
      break;
    case "INITIATE":
      baseStyle.backgroundImage = "linear-gradient(45deg, #FAD7A0, #E67E22)";
      break;
    case "PIONEER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #34495E, #2C3E50)";
      break;
    case "TRAILBLAZER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #FF6F61, #D7263D)";
      break;
    case "ELEVATE":
      baseStyle.backgroundImage = "linear-gradient(45deg, #7B4397, #DC2430)";
      break;
    case "CATALYST":
      baseStyle.backgroundImage = "linear-gradient(45deg, #11998E, #38EF7D)";
      break;
    case "ACCELERATOR":
      baseStyle.backgroundImage = "linear-gradient(45deg, #16A085, #F4D03F)";
      break;
    case "IGNITION":
      baseStyle.backgroundImage = "linear-gradient(45deg, #FF512F, #DD2476)";
      break;
    case "VISIONARY":
      baseStyle.backgroundImage = "linear-gradient(45deg, #FC466B, #3F5EFB)";
      break;
    case "INNOVATOR":
      baseStyle.backgroundImage = "linear-gradient(45deg, #8E44AD, #3498DB)";
      break;
    case "MOMENTUM":
      baseStyle.backgroundImage = "linear-gradient(45deg, #00B09B, #96C93D)";
      break;
    case "SPARK":
      baseStyle.backgroundImage = "linear-gradient(45deg, #F7971E, #FFD200)";
      break;
    case "ARCHITECT":
      baseStyle.backgroundImage = "linear-gradient(45deg, #2ECC71, #27AE60)";
      break;
    case "CREATION":
      baseStyle.backgroundImage = "linear-gradient(45deg, #F953C6, #B91D73)";
      break;
    case "LUMINARY":
      baseStyle.backgroundImage = "linear-gradient(45deg, #F1C40F, #E67E22)";
      break;
    case "LEGEND":
      baseStyle.backgroundImage = "linear-gradient(45deg, #D35400, #C0392B)";
      break;
    case "TITAN":
      baseStyle.backgroundImage = "linear-gradient(45deg, #2C3E50, #4CA1AF)";
      break;
    case "BUILDER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #7F8C8D, #95A5A6)";
      break;
    case "SHAPER":
      baseStyle.backgroundImage = "linear-gradient(45deg, #34495E, #5D6D7E)";
      break;
    case "FORGE":
      baseStyle.backgroundImage = "linear-gradient(45deg, #E74C3C, #C0392B)";
      break;
    case "ASCENDANT":
      baseStyle.backgroundImage = "linear-gradient(45deg, #3498DB, #2ECC71)";
      break;
    case "BEACON":
      baseStyle.backgroundImage = "linear-gradient(45deg, #F1C40F, #F39C12)";
      break;
    case "VANGUARD":
      baseStyle.backgroundImage = "linear-gradient(45deg, #8E44AD, #9B59B6)";
      break;
    case "SENTINEL":
      baseStyle.backgroundImage = "linear-gradient(45deg, #2C3E50, #34495E)";
      break;
    case "PILLAR":
      baseStyle.backgroundImage = "linear-gradient(45deg, #95A5A6, #7F8C8D)";
      break;
    case "ETHEREAL":
      baseStyle.backgroundImage = "linear-gradient(45deg, #7F00FF, #E100FF)";
      break;
    case "ETERNAL":
      baseStyle.backgroundImage = "linear-gradient(45deg, #1D2671, #C33764)";
      break;
    case "CORE":
      // Гармонічний різнокольоровий градієнт, що поєднує кольори рівнів нижче
      baseStyle.backgroundImage = `
        linear-gradient(
          90deg,
          #34495E 0%,
          #7B4397 16%,
          #38EF7D 33%,
          #FFD200 50%,
          #FF512F 67%,
          #3F5EFB 83%,
          #F953C6 100%
        )
      `;
      // Легке сяйво для CORE
      baseStyle.textShadow =
        "0 0 6px rgba(255,255,255,0.2), 0 0 12px rgba(255,255,255,0.2)";
      // Для CORE вже встановлюємо збільшений backgroundSize
      baseStyle.backgroundSize = "400% 400%";
      break;
    default:
      baseStyle.backgroundImage = "linear-gradient(45deg, #bdbdbd, #9e9e9e)";
  }

  // Для останніх п'яти рівнів застосовуємо анімацію переливання та додаткове світіння
  if (animatedLevels.includes(level)) {
    baseStyle.backgroundSize = "400% 400%";
    baseStyle.animation = `${shimmer} 10s ease infinite`;
    const defaultShadow = "0 0 8px rgba(255,255,255,0.4)";
    baseStyle.textShadow = baseStyle.textShadow
      ? baseStyle.textShadow + `, ${defaultShadow}`
      : defaultShadow;
  }

  return baseStyle;
};

const StatusBadge = ({ level }) => {
  return (
    <Box sx={getStatusStyle(level)}>
      <Typography variant="inherit" component="span">
        {level}
      </Typography>
    </Box>
  );
};

export default StatusBadge;
