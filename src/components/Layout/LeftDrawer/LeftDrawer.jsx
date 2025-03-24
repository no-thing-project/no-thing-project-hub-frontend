// src/components/Layout/LeftDrawer/LeftDrawer.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded"; // Іконка для "Друзів"
import MessageRoundedIcon from "@mui/icons-material/MessageRounded"; // Іконка для "Повідомлень"
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
          backgroundColor: "rgba(255, 255, 255, 0)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
        },
      }}
      role="navigation"
      aria-label="Main navigation"
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
            <Tooltip title="Home" placement="right">
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
                <HomeRoundedIcon sx={{ fontSize: 30 }} aria-label="Home" />
              </ListItemIcon>
            </Tooltip>
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
            <Tooltip title="Boards" placement="right">
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
                <DashboardIcon sx={{ fontSize: 30 }} aria-label="Boards" />
              </ListItemIcon>
            </Tooltip>
          </ListItem>

          <ListItem
            button
            component={Link}
            to="/gates"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <Tooltip title="Gates" placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color:
                    currentPath === "/gates"
                      ? "var(--color-icon-hover)"
                      : "var(--color-icon-default)",
                }}
              >
                <StyleRoundedIcon sx={{ fontSize: 30 }} aria-label="Gates" />
              </ListItemIcon>
            </Tooltip>
          </ListItem>

          <ListItem
            button
            component={Link}
            to="/classes"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <Tooltip title="Classes" placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color:
                    currentPath === "/classes"
                      ? "var(--color-icon-hover)"
                      : "var(--color-icon-default)",
                }}
              >
                <ClassRoundedIcon sx={{ fontSize: 30 }} aria-label="Classes" />
              </ListItemIcon>
            </Tooltip>
          </ListItem>

          <ListItem
            button
            component={Link}
            to="/friends"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <Tooltip title="Friends" placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color:
                    currentPath === "/friends"
                      ? "var(--color-icon-hover)"
                      : "var(--color-icon-default)",
                }}
              >
                <PeopleRoundedIcon sx={{ fontSize: 30 }} aria-label="Friends" />
              </ListItemIcon>
            </Tooltip>
          </ListItem>

          <ListItem
            button
            component={Link}
            to="/messages"
            sx={{
              justifyContent: "center",
              "&:hover .MuiListItemIcon-root": {
                color: "var(--color-icon-hover)",
              },
            }}
          >
            <Tooltip title="Messages" placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color:
                    currentPath === "/messages"
                      ? "var(--color-icon-hover)"
                      : "var(--color-icon-default)",
                }}
              >
                <MessageRoundedIcon sx={{ fontSize: 30 }} aria-label="Messages" />
              </ListItemIcon>
            </Tooltip>
          </ListItem>
        </List>
      </Box>

      <Tooltip title="Logout" placement="right">
        <IconButton
          onClick={onLogout}
          sx={{
            alignSelf: "flex-start",
            ml: 1,
            mb: 2,
            color: "var(--color-icon-default)",
            "&:hover": { color: "var(--color-icon-hover)" },
          }}
          aria-label="Logout"
        >
          <ExitToAppRoundedIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Tooltip>
    </Drawer>
  );
};

export default LeftDrawer;