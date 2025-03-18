import React from "react";
import { Box } from "@mui/material";
import LeftDrawer from "./LeftDrawer/LeftDrawer";
import Header from "./Header/Header";

const AppLayout = ({ currentUser, onLogout, token, children }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AppLayout;