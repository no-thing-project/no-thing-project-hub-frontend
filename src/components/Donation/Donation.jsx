import React, { useEffect } from "react";
import { Container, Typography, Button, ThemeProvider, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const DonationPage = ({ theme }) => {
  const navigate = useNavigate();
  const donationLink = "https://secure.wayforpay.com/donate/NoThingProject";

  useEffect(() => {
    if (!window.navigator.javaScriptEnabled) {
      console.warn("JavaScript is disabled in this browser.");
    }
  }, []);

  const handleDonate = () => {
    window.open(donationLink, "_blank", "noopener,noreferrer");
  };

  const handleBack = () => navigate("/login");

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ mb: 3, color: "text.primary" }}>
            Support Our Project
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
            Your donation helps us continue our work. Thank you for your support!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleDonate}
            sx={{ mb: 2, py: 1.5, borderRadius: "8px", textTransform: "none" }}
          >
            Donate Now
          </Button>
          <Button
            variant="text"
            color="primary"
            onClick={handleBack}
            sx={{ textTransform: "none", fontSize: "14px" }}
          >
            Back to Login
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default DonationPage;