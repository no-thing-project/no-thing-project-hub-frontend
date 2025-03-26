import React from "react";
import { Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import BoardCard from "./BoardsCard";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const leftColumnVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const BoardsGrid = ({
  filteredBoards,
  localLikes,
  handleLike,
  setEditingBoard,
  setBoardToDelete,
  setDeleteDialogOpen,
  navigate,
}) => (
  <AnimatePresence exitBeforeEnter>
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
            my: 30,
            px: 3,
            textAlign: "center",
            color: "text.primary",
          }}
        >
          <Typography variant="body2">
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
          {/* Анімована ліва колонка з заголовком та описом */}
          <motion.div
            variants={leftColumnVariants}
            initial="visible"
            animate="visible"
            transition={{ duration: 0.3 }}
            style={{ gridColumn: "1 / 2" }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Boards
            </Typography>
            <Typography variant="h5" sx={{ color: "text.secondary", mb: 4 }}>
              Where Thoughts Come Alive
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
              Boards are discussion spaces for sharing and debating ideas. 
              Tied to Classes, they’re where opinions flow, insights emerge, and conversations thrive.
            </Typography>
          </motion.div>
          {/* Картки дошок */}
          {filteredBoards.map((board) => (
            <BoardCard
              key={board.board_id}
              board={board}
              localLikes={localLikes}
              handleLike={handleLike}
              setEditingBoard={setEditingBoard}
              setBoardToDelete={setBoardToDelete}
              setDeleteDialogOpen={setDeleteDialogOpen}
              navigate={navigate}
            />
          ))}
        </Box>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BoardsGrid;
