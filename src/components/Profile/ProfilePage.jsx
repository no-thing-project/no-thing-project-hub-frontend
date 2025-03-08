//src/components/Profile/ProfilePage.jsx
import React from "react";
import { Box } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer";
import TopBar from "../Header/Header";
import ProfileCard from "./ProfileCard";

const ProfilePage = ({ currentUser, boards, onLogout }) => {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F0F2F5" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar currentUser={currentUser} />
        <Box sx={{ flex: 1, p: 3 }}>
          <ProfileCard currentUser={currentUser} boards={boards} />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
