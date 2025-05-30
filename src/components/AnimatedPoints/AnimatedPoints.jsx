import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Typography } from "@mui/material";
import { formatPoints } from "../../utils/formatPoints";

const AnimatedPoints = ({ points }) => {
  const [prevPoints, setPrevPoints] = useState(points);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (points !== prevPoints) {
      setAnimate(true);
      setPrevPoints(points);
      // Прибрати анімацію через 500 мс
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [points, prevPoints]);

  return (
    <motion.div
      animate={animate ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="body2">
        {formatPoints(points)}
      </Typography>
    </motion.div>
  );
};

export default AnimatedPoints;
