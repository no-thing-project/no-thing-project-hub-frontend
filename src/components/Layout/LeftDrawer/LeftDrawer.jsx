import React from "react";
import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  Box,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StyleRoundedIcon from "@mui/icons-material/StyleRounded";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";

const isActiveRoute = (route, subroute, currentPath) => {
  if (currentPath === route) return true;
  if (!subroute) return false;
  const regexPattern = "^" + subroute.replace(/:[^/]+/g, "[^/]+") + "$";
  const regex = new RegExp(regexPattern);
  return regex.test(currentPath);
};

const LeftDrawer = ({ onLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const navItems = [
    { to: "/home", label: "Home", icon: <HomeRoundedIcon sx={{ fontSize: 30 }} /> },
    { to: "/boards", label: "Boards", icon: <DashboardIcon sx={{ fontSize: 30 }} /> },
    {
      to: "/gates",
      label: "Gates",
      icon: <StyleRoundedIcon sx={{ fontSize: 30 }} />,
      subroute: "/gate/:gate_id",
    },
    {
      to: "/classes",
      label: "Classes",
      icon: <ClassRoundedIcon sx={{ fontSize: 30 }} />,
      subroute: "/class/:class_id",
    },
    { to: "/friends", label: "Friends", icon: <PeopleRoundedIcon sx={{ fontSize: 30 }} /> },
    // { to: "/messages", label: "Messages", icon: <MessageRoundedIcon sx={{ fontSize: 30 }} /> },
  ];

  if (isMobile) {
    return (
      <BottomNavigation
        value={currentPath}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.2)",
          zIndex: theme.zIndex.drawer,
          paddingBottom: "env(safe-area-inset-bottom)",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            padding: "6px 8px",
            "&.Mui-selected": {
              color: "var(--color-icon-hover)",
            },
            "&:hover": {
              color: "var(--color-icon-hover)",
            },
          },
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <Tooltip key={item.to} title={item.label} placement="top">
            <BottomNavigationAction
              component={Link}
              to={item.to}
              value={item.to}
              icon={item.icon}
              sx={{
                color: isActiveRoute(item.to, item.subroute, currentPath)
                  ? "var(--color-icon-hover)"
                  : "var(--color-icon-default)",
              }}
              aria-label={item.label}
            />
          </Tooltip>
        ))}
      </BottomNavigation>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          borderRight: "none",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          backgroundColor: "rgba(255, 255, 255, 0)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
          zIndex: theme.zIndex.drawer,
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
          {navItems.map((item) => (
            <ListItem
              key={item.to}
              button
              component={Link}
              to={item.to}
              sx={{
                justifyContent: "center",
                "&:hover .MuiListItemIcon-root": {
                  color: "var(--color-icon-hover)",
                },
              }}
            >
              <Tooltip title={item.label} placement="right">
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    justifyContent: "center",
                    color: isActiveRoute(item.to, item.subroute, currentPath)
                      ? "var(--color-icon-hover)"
                      : "var(--color-icon-default)",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

LeftDrawer.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default LeftDrawer;