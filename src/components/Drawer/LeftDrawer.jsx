import React from "react";
import { Drawer, List, ListItem, ListItemIcon, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 72;

const LeftDrawer = ({ onLogout }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 2,
          paddingBottom: 2,
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      <List>
        <ListItem button component={Link} to="/profile">
          <ListItemIcon sx={{ justifyContent: "center" }}>
            <HomeIcon />
          </ListItemIcon>
        </ListItem>
        <ListItem button component={Link} to="/boards">
          <ListItemIcon sx={{ justifyContent: "center" }}>
            <DashboardIcon />
          </ListItemIcon>
        </ListItem>
        <ListItem button omponent={Link} to="/settings">
          <ListItemIcon sx={{ justifyContent: "center" }}>
            <SettingsIcon />
          </ListItemIcon>
        </ListItem>
      </List>

      <IconButton
        color="inherit"
        onClick={onLogout}
        sx={{ mb: 1 }}
        title="Logout"
      >
        <LogoutIcon />
      </IconButton>
    </Drawer>
  );
};

export default LeftDrawer;
