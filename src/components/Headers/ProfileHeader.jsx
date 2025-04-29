import React from "react";
import PropTypes from "prop-types";
import { Box, Card, CardContent, Typography, Skeleton, useTheme } from "@mui/material";
import { headerStyles } from "../../styles/ProfileStyles";
import StatusBadge from "../Badges/StatusBadge";

const ProfileHeader = ({ user, isOwnProfile, children }) => {
  const theme = useTheme();

  if (!user) {
    return (
      <Card sx={headerStyles.card}>
        <CardContent>
          <Box sx={headerStyles.content}>
            <Box>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={100} height={20} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={headerStyles.card}>
      <CardContent>
        <Box
          sx={{
            ...headerStyles.content,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                ...headerStyles.title,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
              }}
            >
              {user.username}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                ...headerStyles.level,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              Level: <StatusBadge level={user.access_level} />
            </Typography>
          </Box>
          {isOwnProfile && children && (
            <Box
              sx={{
                ...headerStyles.buttonGroup,
                flexWrap: "wrap",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {children}
            </Box>
          )}
        </Box>
      </CardContent>
      </Card>
  );
};

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    access_level: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool,
  children: PropTypes.node,
};

export default ProfileHeader;