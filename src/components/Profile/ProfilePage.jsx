//src/components/Profile/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer";
import TopBar from "../Header/Header";
import ProfileCard from "./ProfileCard";
import axios from "axios";
import config from "../../config";

const ProfilePage = ({ currentUser, boards, onLogout, token }) => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const ownUserId = currentUser?.user_id;
        console.log("Current user:", currentUser);
        console.log("Requested userId from URL:", userId);
        console.log("Hub API URL:", config.REACT_APP_HUB_API_URL);

        if (!ownUserId) {
          throw new Error("Current user ID is undefined");
        }

        if (!userId || userId === ownUserId) {
          // Для власного профілю беремо дані з currentUser
          console.log("Using currentUser data for own profile");
          setProfileData(currentUser);
          setIsOwnProfile(true);
        } else {
          if (!userId || userId === "undefined") {
            throw new Error("Requested userId is invalid or undefined");
          }
          const url = `${config.REACT_APP_HUB_API_URL}/profile/${userId}`;
          console.log("Fetching profile for userId at:", url);
          const response = await axios.get(url);
          console.log("Profile response:", response.data);
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
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F0F2F5" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <TopBar currentUser={currentUser} />
        <Box sx={{ flex: 1, p: 3 }}>
          <ProfileCard
            currentUser={profileData}
            boards={isOwnProfile ? boards : []}
            isOwnProfile={isOwnProfile}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;