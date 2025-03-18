import { formatPoints } from "../utils/formatPoints";

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
      labels: {
        font: { size: 16, family: "Arial" },
        color: "#747687",
      },
    },
    title: { display: false },
    tooltip: {
      backgroundColor: "#fff",
      titleColor: "#333",
      bodyColor: "#333",
      borderColor: "#eee",
      borderWidth: 1,
      cornerRadius: 8,
      caretSize: 6,
      displayColors: false,
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || "";
          if (label) label += ": ";
          const value = context.parsed.y;
          return label + formatPoints(value);
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { font: { size: 14, family: "Arial" }, color: "#747687" },
    },
    y: {
      grid: { display: false, drawBorder: false },
      ticks: {
        font: { size: 14, family: "Arial" },
        color: "#747687",
        callback: (value) => formatPoints(value),
      },
    },
  },
  elements: {
    bar: { borderRadius: { topLeft: 12, topRight: 12 }, borderSkipped: false },
  },
  layout: { padding: { top: 10, right: 10, bottom: 10, left: 10 } },
};