import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer.jsx";
import Header from "../Header/Header.jsx";
import axios from "axios";
import config from "../../config.js";
import HomeSection from "./HomeSection.jsx";

const HomePage = ({ currentUser, onLogout, token }) => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const ownUserId = currentUser.anonymous_id;
        console.log("Current user:", currentUser);
        console.log("Requested userId from URL:", userId);
        console.log("Hub API URL:", config.REACT_APP_HUB_API_URL);

        if (!ownUserId) {
          throw new Error("Current user ID is undefined");
        }

        if (!userId || userId === ownUserId) {
          setProfileData(currentUser);
          setIsOwnProfile(true);
        } else {
          const url = `${config.REACT_APP_HUB_API_URL}/api/v1/profile/${userId}`;
          console.log("Fetching profile for userId at:", url);
          const response = await axios.get(url);
          setProfileData(response.data.authData);
          setIsOwnProfile(false);
        }
      } catch (err) {
        console.error("Profile fetch error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
        setError(
          err.response?.data?.errors?.[0] ||
            `Failed to load profile: ${err.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && token) {
      fetchProfile();
    } else {
      setError("Not authenticated");
      setLoading(false);
    }
  }, [userId, currentUser, token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>
          <HomeSection currentUser={currentUser} />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
