import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const StatsCard = ({ label, value }) => {
  return (
    <Card sx={{ backgroundColor: "background.paper", boxShadow: "none", textAlign: "center" }}>
      <CardContent>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="h4">{value}</Typography>
      </CardContent>
    </Card>
  );
};

export default StatsCard;