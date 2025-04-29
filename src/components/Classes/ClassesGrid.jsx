import React, { useMemo } from "react";
import { Box, Typography, Button, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ClassCard from "./ClassCard";
import PropTypes from "prop-types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const leftColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const ClassesGrid = ({
  filteredClasses,
  handleFavorite,
  setEditingClass,
  setClassToDelete,
  setDeleteDialogOpen,
  handleAddMember,
  handleRemoveMember,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();

  const sortedClasses = useMemo(() => {
    return [...filteredClasses].sort((a, b) => {
      if (a.is_favorited && !b.is_favorited) return -1;
      if (!a.is_favorited && b.is_favorited) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredClasses]);

  return (
    <AnimatePresence>
      {sortedClasses.length === 0 ? (
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
              my: { xs: 10, md: 20 },
              px: { xs: 2, md: 3 },
              textAlign: "center",
              color: "text.primary",
            }}
            role="region"
            aria-label="No classes found"
          >
            <Typography variant="body1" sx={{ fontSize: { xs: "1rem", md: "1.25rem" }, mb: 2 }}>
              No classes found. Create a new class to get started!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/classes")} // Adjust to open create dialog if needed
              aria-label="Create a new class"
            >
              Create Class
            </Button>
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
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fill, minmax(280px, 1fr))",
                md: "repeat(auto-fill, minmax(300px, 1fr))",
              },
              gap: { xs: 2, md: 3 },
              gridAutoFlow: "dense",
              maxWidth: 1500,
              mx: "auto",
              my: { xs: 4, md: 6 },
              px: { xs: 2, md: 3 },
              color: "text.primary",
            }}
            role="grid"
            aria-label="Classes grid"
          >
            <motion.div
              variants={leftColumnVariants}
              initial="hidden"
              animate="visible"
              sx={{ gridColumn: { xs: "span 1", sm: "1 / -1" } }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.5rem", md: "2.5rem" } }}
              >
                Classes
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "text.secondary",
                  mb: 4,
                  fontSize: { xs: "1.25rem", md: "1.75rem" },
                }}
              >
                Your Learning Spaces
              </Typography>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.7, fontSize: { xs: "0.875rem", md: "1rem" } }}
              >
                Classes are focused learning environments within gates. Create a class to share knowledge, collaborate on projects, or discuss specific topics.
              </Typography>
            </motion.div>
            {sortedClasses.map((classItem) => (
              <ClassCard
                key={classItem.class_id}
                classItem={classItem}
                handleFavorite={handleFavorite}
                setEditingClass={setEditingClass}
                setClassToDelete={setClassToDelete}
                setDeleteDialogOpen={setDeleteDialogOpen}
                handleAddMember={handleAddMember}
                handleRemoveMember={handleRemoveMember}
                navigate={navigate}
                currentUser={currentUser}
              />
            ))}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

ClassesGrid.propTypes = {
  filteredClasses: PropTypes.arrayOf(
    PropTypes.shape({
      class_id: PropTypes.string.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      is_favorited: PropTypes.bool,
      is_public: PropTypes.bool,
      visibility: PropTypes.string,
      members: PropTypes.array,
      stats: PropTypes.object,
      settings: PropTypes.object,
    })
  ).isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingClass: PropTypes.func.isRequired,
  setClassToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleAddMember: PropTypes.func.isRequired,
  handleRemoveMember: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
  }),
};

export default React.memo(ClassesGrid);