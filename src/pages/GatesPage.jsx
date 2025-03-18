import React, { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import LeftDrawer from "../components/features/LeftDrawer/LeftDrawer.jsx";
import Header from "../components/features/Header/Header.jsx";
import axios from "axios";
import config from "../config.js";
import GatesSeciton from "../sections/GatesSection/GatesSection.jsx";

const GatesPage = ({ currentUser, onLogout, token }) => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${config.REACT_APP_HUB_API_URL}/api/v1/gates`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data?.content.gates;
        setGates(data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Помилка при отриманні гейтів", error);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#3E435D" }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}
    >
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>
          <GatesSeciton
            currentUser={currentUser}
            token={token}
            gates={gates}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GatesPage;
