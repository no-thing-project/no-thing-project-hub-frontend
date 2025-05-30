import React from "react";
import { Bar } from "react-chartjs-2";
import { Typography } from "@mui/material";
import { options } from "../../constants/chartOptions";
import { getGradient } from "../../utils/chartUtils";

const BarChart = ({ title, data, colors }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title,
        data: data.values,
        backgroundColor: (context) => {
          const chart = context.chart;
          const idx = context.dataIndex;
          return getGradient(chart, colors[idx].start, colors[idx].end);
        },
      },
    ],
  };

  return (
    <div>
      <Typography variant="body1" gutterBottom>
        {title}
      </Typography>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarChart;