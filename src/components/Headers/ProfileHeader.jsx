import React from "react";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import { headerStyles } from "../../styles/ProfileStyles";
import StatusBage from "../Bages/StatusBage";

const ProfileHeader = ({ username, accessLevel, isEditing, isOwnProfile, onEdit, onSave, onCancel }) => {
  return (
    <Card sx={headerStyles.card}>
      <CardContent>
        <Box sx={headerStyles.content}>
          <Box>
            <Typography variant="h4" sx={headerStyles.title}>
              {username}
            </Typography>
            <Typography variant="body2" sx={headerStyles.level}>
              Level: <StatusBage level={accessLevel} />
            </Typography>
          </Box>
          {isOwnProfile && (
            <Box sx={headerStyles.buttonGroup}>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    onClick={onSave}
                    startIcon={<Save />}
                    label="Save Profile"
                  />
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    label="Cancel"
                  />
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={onEdit}
                  startIcon={<Edit />}
                  label="Update Profile"
                />
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;