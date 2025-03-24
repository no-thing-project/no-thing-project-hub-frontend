import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { headerStyles } from "../../styles/ProfileStyles";
import StatusBage from "../Bages/StatusBage";

const ProfileHeader = ({ user, isOwnProfile, children, ...props }) => {
  return (
    <Card sx={headerStyles.card}>
      <CardContent>
        <Box sx={headerStyles.content}>
          <Box>
            <Typography variant="h4" sx={headerStyles.title}>
              {user.username}
            </Typography>
            <Typography variant="body2" sx={headerStyles.level}>
              Level: <StatusBage level={user.access_level} />
            </Typography>
          </Box>
          {isOwnProfile && children && (
            <Box sx={headerStyles.buttonGroup}>
              {children}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;

