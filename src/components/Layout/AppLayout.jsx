import React from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import LeftDrawer from "./LeftDrawer/LeftDrawer";
import Header from "./Header/Header";
import { containerStyles, baseCardStyles } from "../../styles/BaseStyles";

const AppLayout = ({ currentUser, onLogout, token, children, headerTitle }) => {
  return (
    <Box
      sx={{
        ...containerStyles,
        display: "flex",
        minHeight: "100dvh",
        backgroundColor: "background.default",
        overflowX: "hidden",
      }}
    >
      <LeftDrawer onLogout={onLogout} />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: { xs: 0, sm: "72px" }, // Account for 72px drawer on sm+
          width: "100%",
          maxWidth: { xs: "100%", sm: "calc(100% - 72px)" },
          boxSizing: "border-box",
        }}
      >
        <Header currentUser={currentUser} token={token} title={headerTitle} />
        <Box
          aria-label="Main content"
          sx={{
            mt: { xs: 8, sm: 8 }, // Match header height
            p: { xs: 2, sm: 2 }, // 16px mobile, 24px desktop
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default React.memo(AppLayout);