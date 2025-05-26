import React from "react";
import { Box } from "@mui/material";
import LeftDrawer from "./LeftDrawer/LeftDrawer";
import Header from "./Header/Header";

const AppLayout = ({ currentUser, onLogout, token, children, headerTitle }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", backgroundColor: "background.default", width: "100%", overflowX: "hidden" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", ml: { xs: 0, sm: "72px" }, width: { xs: 'auto', sm: 'auto' }, maxWidth: { xs: '100%', sm: 'calc(100vw - 72px)' }, boxSizing: 'border-box' }}>
        <Header currentUser={currentUser} token={token} title={headerTitle} />
        <Box sx={{ flex: 1, p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default AppLayout;