import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import GateCard from "./GateCard";
import PropTypes from "prop-types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const leftColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const GatesGrid = ({
  filteredGates,
  handleFavorite,
  setEditingGate,
  setGateToDelete,
  setDeleteDialogOpen,
  handleAddMember,
  handleRemoveMember,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();

  return (
    <AnimatePresence>
      {filteredGates.length === 0 ? (
        <motion.div
          key="no-gates"
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
          >
            <Typography variant="body1" sx={{ fontSize: { xs: "1rem", md: "1.25rem" } }}>
              No gates found. Create a new gate to get started!
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          key="gates-grid"
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
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 2, md: 4 },
              gridAutoFlow: "dense",
              maxWidth: 1500,
              mx: "auto",
              my: { xs: 4, md: 6 },
              px: { xs: 2, md: 3 },
              color: "text.primary",
            }}
          >
            <motion.div
              variants={leftColumnVariants}
              initial="hidden"
              animate="visible"
              sx={{ gridColumn: { xs: "span 1", sm: "1 / 2" } }}
            >
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1.5rem", md: "2.5rem" } }}
              >
                Gates
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "text.secondary",
                  mb: 4,
                  fontSize: { xs: "1.25rem", md: "1.75rem" },
                }}
              >
                Your Space for Big Ideas
              </Typography>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.7, fontSize: { xs: "0.875rem", md: "1rem" } }}
              >
                Gates are like forum topics, starting points for broad discussions. Create a
                Gate to spark a conversation or join one to explore shared interests. It’s
                where communities form and ideas take root.
              </Typography>
            </motion.div>
            {filteredGates.map((gate) => (
              <GateCard
                key={gate.gate_id}
                gate={gate}
                handleFavorite={handleFavorite}
                setEditingGate={setEditingGate}
                setGateToDelete={setGateToDelete}
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

GatesGrid.propTypes = {
  filteredGates: PropTypes.array.isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingGate: PropTypes.func.isRequired,
  setGateToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleAddMember: PropTypes.func.isRequired,
  handleRemoveMember: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
};

export default React.memo(GatesGrid);