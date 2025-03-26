import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ClassCard from "./ClassCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const leftColumnVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const ClassesGrid = ({
  filteredClasses,
  localLikes,
  handleLike,
  setEditingClass,
  setClassToDelete,
  setDeleteDialogOpen,
  navigate,
}) => (
  <AnimatePresence exitBeforeEnter>
    {filteredClasses.length === 0 ? (
      <motion.div
        key="no-classes"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            maxWidth: 1500,
            mx: "auto",
            my: 30,
            px: 3,
            textAlign: "center",
            color: "text.primary",
          }}
        >
          <Typography variant="body2">
            No classes found. Create a new class to get started!
          </Typography>
        </Box>
      </motion.div>
    ) : (
      <motion.div
        key="classes-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 4,
            gridAutoFlow: "dense",
            maxWidth: 1500,
            mx: "auto",
            my: 6,
            px: 3,
            color: "text.primary",
          }}
        >
          <motion.div
            variants={leftColumnVariants}
            initial="visible"
            animate="visible"
            transition={{ duration: 0.3 }}
            style={{ gridColumn: "1 / 2" }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Teach your way.
            </Typography>
            <Typography variant="h5" sx={{ color: "text.secondary", mb: 4 }}>
              Wherever you are.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              Create classes, share knowledge, and inspire your students. Keep learning at the
              heart of your mission. Wishing you success in your educational journey.
            </Typography>
          </motion.div>
          {filteredClasses.map((classItem) => (
            <ClassCard
              key={classItem.class_id}
              classItem={classItem}
              localLikes={localLikes}
              handleLike={handleLike}
              setEditingClass={setEditingClass}
              setClassToDelete={setClassToDelete}
              setDeleteDialogOpen={setDeleteDialogOpen}
              navigate={navigate}
            />
          ))}
        </Box>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ClassesGrid;