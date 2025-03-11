//src/components/Profile/ProfilePage.jsx
import React from "react";
import { Box } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer";
import Header from "../Header/Header.jsx";
import BoardsSection from "./BoardsSection.jsx";

const BoardsPage = ({ currentUser, boards, onLogout, token }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>
          <BoardsSection currentUser={currentUser} boards={boards}/>
        </Box>
      </Box>
    </Box>
  );
};

export default BoardsPage;