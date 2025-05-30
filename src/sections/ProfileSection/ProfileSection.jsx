import React from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { sectionStyles } from "../../styles/BaseStyles";

const ProfileSection = ({ title, children }) => (
  <Card sx={sectionStyles.card}>
    <CardContent sx={sectionStyles.content}>
      <Typography variant="h5" sx={sectionStyles.title}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </CardContent>
  </Card>
);

export default ProfileSection;