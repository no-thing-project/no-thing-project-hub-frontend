import React from "react";
import { motion } from "framer-motion";
import { IconButton } from "@mui/material";
import { Toll } from "@mui/icons-material";

const PointsDeductionAnimation = ({}) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -30, scale: 1.5 }}
      transition={{ duration: 0.7 }}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
      }}
    >
      <IconButton size="small" aria-label="Points Deduction">
        <Toll sx={{ color: "text.primary" }} />
      </IconButton>
    </motion.div>
  );
};

export default PointsDeductionAnimation;
