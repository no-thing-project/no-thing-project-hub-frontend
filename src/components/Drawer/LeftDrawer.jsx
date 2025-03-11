import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Box,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExitToAppRoundedIcon from "@mui/icons-material/ExitToAppRounded";

const LeftDrawer = ({ onLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Drawer
      variant="permanent"
      className="left-drawer"
      PaperProps={{
        sx: {
          boxShadow: "none",
          borderRight: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 72,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
        }}
      >
        <List sx={{ p: 0, m: 0 }}>
          <ListItem
            button
            component={Link}
            to="/home"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: "center",
                color:
                  currentPath === "/home"
                    ? "var(--color-icon-hover)"
                    : "var(--color-icon-default)",
              }}
            >
              <HomeRoundedIcon sx={{ fontSize: 30 }} />
            </ListItemIcon>
          </ListItem>

          <ListItem
            button
            component={Link}
            to="/boards"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: "center",
                color:
                  currentPath === "/boards"
                    ? "var(--color-icon-hover)"
                    : "var(--color-icon-default)",
              }}
            >
              <DashboardIcon sx={{ fontSize: 30 }} />
            </ListItemIcon>
          </ListItem>
        </List>
      </Box>

      <IconButton
        onClick={onLogout}
        title="Logout"
        sx={{
          alignSelf: "flex-start",
          ml: 1,
          mb: 2,
          color: "var(--color-icon-default)",
          "&:hover": { color: "var(--color-icon-hover)" },
        }}
      >
        <ExitToAppRoundedIcon sx={{ fontSize: 30 }} />
      </IconButton>
    </Drawer>
  );
};

export default LeftDrawer;
