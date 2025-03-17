// src/components/Profile/BoardsPage.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import LeftDrawer from "../Drawer/LeftDrawer";
import Header from "../Header/Header.jsx";
import BoardsSection from "./BoardsSection.jsx";
import config from "../../config";

const BoardsPage = ({ currentUser, onLogout, token }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.REACT_APP_HUB_API_URL}/api/v1/boards/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.code !== 200) {
        throw new Error(response.data.errors?.[0] || "Failed to fetch boards");
      }

      setBoards(response.data.content.boards || []);
    } catch (err) {
      setError(err.message);
      if (err.response?.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && currentUser) {
      fetchBoards();
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [token, currentUser, onLogout]); // Dependency array is complete

  if (loading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8", justifyContent: "center", alignItems: "center" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8", justifyContent: "center", alignItems: "center" }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>
          <BoardsSection
            currentUser={currentUser}
            boards={boards}
            token={token}
            onBoardsUpdate={fetchBoards}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default BoardsPage;