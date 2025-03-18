import React from "react";
import { Box } from "@mui/material";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HomeSection = ({ currentUser }) => {
  const { stats, total_points, donated_points } = currentUser;

  const statsData = [
    { label: "Posts", value: stats.tweet_count },
    { label: "Boards", value: stats.board_count },
    { label: "Gates", value: stats.gate_count },
    { label: "Classes", value: stats.class_count },
    { label: "Likes", value: stats.like_count },
    { label: "Points Earned", value: stats.points_earned },
    { label: "Points Spent", value: stats.points_spent },
  ];

  const chartsData = [
    {
      title: "Points",
      data: { labels: ["Total Points", "Donated Points"], values: [total_points, donated_points] },
      colors: chartColors.points,
    },
    {
      title: "Posts vs Boards",
      data: { labels: ["Posts", "Boards"], values: [stats.tweet_count, stats.board_count] },
      colors: chartColors.postsBoards,
    },
    {
      title: "Engagement",
      data: { labels: ["Gates", "Classes"], values: [stats.gate_count, stats.class_count] },
      colors: chartColors.engagement,
    },
    {
      title: "Misc Stats",
      data: { labels: ["Likes", "Points Earned", "Points Spent"], values: [stats.like_count, stats.points_earned, stats.points_spent] },
      colors: chartColors.misc,
    },
  ];

  return (
    <Box sx={containerStyles}>
      <UserHeader username={currentUser.username} accessLevel={currentUser.access_level} />
      <Box sx={statsGridStyles}>
        {statsData.map((stat) => (
          <StatsCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </Box>
      <Box sx={chartsGridStyles}>
        {chartsData.map((chart) => (
          <BarChart key={chart.title} title={chart.title} data={chart.data} colors={chart.colors} />
        ))}
      </Box>
    </Box>
  );
};

export default HomeSection;