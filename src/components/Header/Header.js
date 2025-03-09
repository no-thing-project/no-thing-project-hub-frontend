import React from "react";
import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";

/**
 * Верхня панель без поля пошуку.
 * Містить вітання, поточну дату та аватар.
 */
const TopBar = ({ currentUser }) => {
  const userName = currentUser.username || "Someone";
  const userAvatar = currentUser.profile_picture || "";

  // Форматування поточної дати
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-GB", {
      weekday: "short", // "Tue"
      day: "2-digit",   // "07"
      month: "long",    // "June"
      year: "numeric",  // "2022"
    }).replace(/(\d+)/, "$1 "); // Додаємо пробіл після числа: "Tue, 07 June 2022"
  };

  const currentDate = formatDate();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "linear-gradient(90deg, #ffffff 0%, #e9ecf5 100%)",
        color: "#000",
        paddingY: 1,
        borderBottom: "1px solid #ddd",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Ліва частина: привітання та дата */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Welcome, {userName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentDate}
          </Typography>
        </Box>

        {/* Права частина: аватар */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            src={userAvatar}
            alt={userName}
            sx={{ width: 40, height: 40 }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;