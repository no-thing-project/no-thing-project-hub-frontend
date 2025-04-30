import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import BoardCard from "./BoardsCard";
import PropTypes from "prop-types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const leftColumnVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const BoardsGrid = ({
  filteredBoards,
  handleFavorite,
  setEditingBoard,
  setBoardToDelete,
  setDeleteDialogOpen,
  handleAddMember,
  handleRemoveMember,
  navigate,
  currentUser,
}) => {
  const theme = useTheme();

  return (
    <AnimatePresence>
      {filteredBoards.length === 0 ? (
        <motion.div
          key="no-boards"
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
              No boards found. Create a new board to get started!
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          key="boards-grid"
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
                Boards
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "text.secondary",
                  mb: 4,
                  fontSize: { xs: "1.25rem", md: "1.75rem" },
                }}
              >
                Your Spaces for Discussion
              </Typography>
              <Typography
                variant="body1"
                sx={{ lineHeight: 1.7, fontSize: { xs: "0.875rem", md: "1rem" } }}
              >
                Boards are dedicated spaces for sharing ideas, collaborating, and engaging in discussions. Create a board to connect with your community or explore specific topics.
              </Typography>
            </motion.div>
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.board_id}
                board={board}
                handleFavorite={handleFavorite}
                setEditingBoard={setEditingBoard}
                setBoardToDelete={setBoardToDelete}
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

BoardsGrid.propTypes = {
  filteredBoards: PropTypes.array.isRequired,
  handleFavorite: PropTypes.func.isRequired,
  setEditingBoard: PropTypes.func.isRequired,
  setBoardToDelete: PropTypes.func.isRequired,
  setDeleteDialogOpen: PropTypes.func.isRequired,
  handleAddMember: PropTypes.func.isRequired,
  handleRemoveMember: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
};

export default React.memo(BoardsGrid);