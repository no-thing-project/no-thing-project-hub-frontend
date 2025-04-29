import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import StatusBadge from "../Badges/StatusBadge";

const UserHeader = ({ username, accessLevel, actionButton = null }) => {
  return (
    <Card sx={{ borderRadius: 2.5, mb: 3, backgroundColor: "background.paper", boxShadow: "none" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, mb: 1, ml: 3, mr: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 400, color: "text.primary" }}>
              {username}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Level: <StatusBadge level={accessLevel} />
            </Typography>
          </Box>
          {actionButton}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserHeader;