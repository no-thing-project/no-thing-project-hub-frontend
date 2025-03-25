// src/sections/HomeSection/HomeSection.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import UserHeader from "../../components/Headers/UserHeader";
import StatsCard from "../../components/Cards/StatsCard/StatsCard";
import BarChart from "../../components/Charts/BarChart";
import { chartColors } from "../../constants/colors";
import { containerStyles, statsGridStyles, chartsGridStyles } from "../../styles/HomeSectionStyles";
import ProfileHeader from "../../components/Headers/ProfileHeader";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HomeSection = ({ profileData, isOwnProfile }) => {
  const { stats = {}, total_points = 0, donated_points = 0 } = profileData || {};

  console.log("Profile Data:", profileData);

  const statsData = [
    { label: "Posts", value: stats.tweet_count || 0 },
    { label: "Boards", value: stats.board_count || 0 },
    { label: "Gates", value: stats.gate_count || 0 },
    { label: "Classes", value: stats.class_count || 0 },
    { label: "Likes", value: stats.like_count || 0 },
    { label: "Points Earned", value: stats.points_earned || 0 },
    { label: "Points Spent", value: stats.points_spent || 0 },
  ];

  const chartsData = [
    {
      title: "Points",
      data: {
        labels: ["Total Points", "Donated Points"],
        values: [total_points || 0, donated_points || 0],
      },
      colors: chartColors.points,
    },
    {
      title: "Posts vs Boards",
      data: {
        labels: ["Posts", "Boards"],
        values: [stats.tweet_count || 0, stats.board_count || 0],
      },
      colors: chartColors.postsBoards,
    },
    {
      title: "Engagement",
      data: {
        labels: ["Gates", "Classes"],
        values: [stats.gate_count || 0, stats.class_count || 0],
      },
      colors: chartColors.engagement,
    },
    {
      title: "Misc Stats",
      data: {
        labels: ["Likes", "Points Earned", "Points Spent"],
        values: [stats.like_count || 0, stats.points_earned || 0, stats.points_spent || 0],
      },
      colors: chartColors.misc,
    },
  ];

  return (
    <Box sx={containerStyles} role="main">
      <ProfileHeader
        user={profileData}
        isOwnProfile={true}
      />
      {isOwnProfile ? (
        <>
          <Box sx={statsGridStyles} role="region" aria-label="User Statistics">
            {statsData.map((stat) => (
              <StatsCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </Box>
          <Box sx={chartsGridStyles} role="region" aria-label="User Charts">
            {chartsData.map((chart) => (
              <BarChart
                key={chart.title}
                title={chart.title}
                data={chart.data}
                colors={chart.colors}
                aria-label={`Chart showing ${chart.title}`}
              />
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }} role="alert">
          Viewing {profileData.username || "Unknown User"}'s profile. Detailed stats are only available for your own profile.
        </Typography>
      )}
    </Box>
  );
};

export default HomeSection;