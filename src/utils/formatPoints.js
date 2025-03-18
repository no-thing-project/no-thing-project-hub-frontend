export const formatPoints = (points) => {
    if (points < 1000) return points.toString();
    if (points < 1000000) return (points / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    if (points < 1000000000) return (points / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    return (points / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  };