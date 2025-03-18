import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import StatusBadge from "../Profile/StatusBadge";
import { options } from "./barOptions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Функція для створення градієнта
const getGradient = (chart, colorStart, colorEnd) => {
  const ctx = chart.ctx;
  const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
};

const HomeSection = ({ currentUser }) => {
  const { stats, total_points, donated_points } = currentUser;

  // Графік 1: Points (градієнтне заповнення, скруглення через options.elements.bar)
  const pointsData = {
    labels: ['Total Points', 'Donated Points'],
    datasets: [{
      label: 'Points',
      data: [total_points, donated_points],
      backgroundColor: (context) => {
        const chart = context.chart;
        const idx = context.dataIndex;
        // Повертаємо градієнт для кожної колонки
        if (idx === 0) {
          return getGradient(chart, '#9C7FF0', '#C8A9F8');
        } else {
          return getGradient(chart, '#C8A9F8', '#9C7FF0');
        }
      }
    }]
  };

  // Графік 2: Posts vs Boards
  const postsBoardsData = {
    labels: ['Posts', 'Boards'],
    datasets: [{
      label: 'Count',
      data: [stats.tweet_count, stats.board_count],
      backgroundColor: (context) => {
        const chart = context.chart;
        const idx = context.dataIndex;
        if (idx === 0) {
          return getGradient(chart, '#8E8D8A', '#B0A990');
        } else {
          return getGradient(chart, '#B0A990', '#8E8D8A');
        }
      }
    }]
  };

  // Графік 3: Engagement (Gates vs Classes)
  const engagementData = {
    labels: ['Gates', 'Classes'],
    datasets: [{
      label: 'Engagement',
      data: [stats.gate_count, stats.class_count],
      backgroundColor: (context) => {
        const chart = context.chart;
        const idx = context.dataIndex;
        if (idx === 0) {
          return getGradient(chart, '#A3C1AD', '#7FA99B');
        } else {
          return getGradient(chart, '#7FA99B', '#A3C1AD');
        }
      }
    }]
  };

  // Графік 4: Misc (Likes, Points Earned, Points Spent)
  const miscData = {
    labels: ['Likes', 'Points Earned', 'Points Spent'],
    datasets: [{
      label: 'Misc Stats',
      data: [stats.like_count, stats.points_earned, stats.points_spent],
      backgroundColor: (context) => {
        const chart = context.chart;
        const idx = context.dataIndex;
        if (idx === 0) {
          return getGradient(chart, '#D4A5A5', '#A5C4D4');
        } else if (idx === 1) {
          return getGradient(chart, '#A5C4D4', '#D4C4A5');
        } else {
          return getGradient(chart, '#D4C4A5', '#D4A5A5');
        }
      }
    }]
  };

  // Стиль для карток
  const cardSx = { 
    backgroundColor: "background.paper", 
    boxShadow: "none", 
    textAlign: "center" 
  };

  return (
    <Box sx={{ maxWidth: 1500, margin: "0 auto", p: 2 }}>
      <Card
        sx={{
          borderRadius: 2.5,
          mb: 3,
          backgroundColor: "background.paper",
          boxShadow: "none",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1,
              mb: 1,
              ml: 3,
              mr: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 400, color: "text.primary" }}
              >
                {currentUser.username}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Class: <StatusBadge level={currentUser.access_level} />
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box 
        sx={{ 
          display: "grid", 
          gap: 2, 
          mb: 3, 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" 
        }}
      >
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="body4">Posts</Typography>
            <Typography variant="h4">{stats.tweet_count}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Boards</Typography>
            <Typography variant="h4">{stats.board_count}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Gates</Typography>
            <Typography variant="h4">{stats.gate_count}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Classes</Typography>
            <Typography variant="h4">{stats.class_count}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Likes</Typography>
            <Typography variant="h4">{stats.like_count}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Points Earned</Typography>
            <Typography variant="h4">{stats.points_earned}</Typography>
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="">Points Spent</Typography>
            <Typography variant="h4">{stats.points_spent}</Typography>
          </CardContent>
        </Card>
      </Box>
      
      {/* Графіки */}
      <Box sx={{ display: "grid", gap: 4, mb: 3, gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))" }}>
        <Box>
          <Typography variant="" gutterBottom>
            Points
          </Typography>
          <Bar data={pointsData} options={options} />
        </Box>
        <Box>
          <Typography variant="" gutterBottom>
            Posts vs Boards
          </Typography>
          <Bar data={postsBoardsData} options={options} />
        </Box>
        <Box>
          <Typography variant="" gutterBottom>
            Engagement
          </Typography>
          <Bar data={engagementData} options={options} />
        </Box>
        <Box>
          <Typography variant="" gutterBottom>
            Misc Stats
          </Typography>
          <Bar data={miscData} options={options} />
        </Box>
      </Box>
    </Box>
  );
};

export default HomeSection;
