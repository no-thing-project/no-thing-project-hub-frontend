import React, { memo } from "react";
import { Box, Typography, Button, useTheme, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import { containerStyles, gridStyles, baseTypographyStyles } from "../../styles/BaseStyles";
import CardMain from "../Cards/CardMain";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const loaderVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

const VALID_GRID_TYPES = ["gates", "classes", "boards"];

// Memoized CardWrapper to prevent re-rendering of existing items
const CardWrapper = memo(({ item, itemKey, entityType, handleFavorite, setEditingItem, setItemToDelete, setDeleteDialogOpen, handleManageMembers, navigate, currentUser, token, isLastItem, lastItemRef }) => (
  <motion.div variants={itemVariants} role="gridcell" ref={isLastItem ? lastItemRef : null}>
    <CardMain
      item={item}
      entityType={entityType}
      itemId={item[itemKey]}
      handleFavorite={handleFavorite}
      setEditingItem={setEditingItem}
      setItemToDelete={setItemToDelete}
      setDeleteDialogOpen={setDeleteDialogOpen}
      handleManageMembers={handleManageMembers}
      navigate={navigate}
      currentUser={currentUser}
      token={token}
    />
  </motion.div>
));

CardWrapper.propTypes = {
  item: PropTypes.object.isRequired,
  itemKey: PropTypes.string.isRequired,
  entityType: PropTypes.string.isRequired,
  handleFavorite: PropTypes.func,
  setEditingItem: PropTypes.func,
  setItemToDelete: PropTypes.func,
  setDeleteDialogOpen: PropTypes.func,
  handleManageMembers: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  token: PropTypes.string,
  isLastItem: PropTypes.bool,
  lastItemRef: PropTypes.func,
};

const Grids = ({
  items,
  cardComponent: CardComponent,
  itemKey,
  gridType,
  handleFavorite,
  setEditingItem,
  setItemToDelete,
  setDeleteDialogOpen,
  handleManageMembers,
  navigate,
  currentUser,
  token,
  onCreateNew,
  lastItemRef,
  hasMore,
  loading,
}) => {
  const theme = useTheme();

  // Validate gridType
  if (!VALID_GRID_TYPES.includes(gridType)) {
    console.error(`Invalid gridType: ${gridType}. Expected one of ${VALID_GRID_TYPES.join(", ")}`);
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "error.main" }}>
        <Typography variant="body2">Invalid grid type.</Typography>
      </Box>
    );
  }

  const getEmptyState = () => {
    const config = {
      gates: { text: "No gates found. Create a new gate to get started!", button: "Create Gate" },
      classes: { text: "No classes found. Create a new class to get started!", button: "Create Class" },
      boards: { text: "No boards found. Create a new board to get started!", button: "Create Board" },
    };
    return config[gridType] || { text: "No items found. Create a new item to get started!", button: "Create Item" };
  };

  const getGridColumns = () => {
    const base = {
      xs: "repeat(1, 1fr)",
      sm: "repeat(auto-fill, minmax(280px, 1fr))",
      md: "repeat(auto-fill, minmax(300px, 1fr))",
      lg: "repeat(auto-fill, minmax(320px, 1fr))",
    };
    if (gridType === "gates") {
      return {
        ...base,
        md: "repeat(auto-fill, minmax(320px, 1fr))",
        lg: "repeat(auto-fill, minmax(350px, 1fr))",
      };
    }
    return base;
  };

  const emptyState = getEmptyState();
  const entityType = gridType.slice(0, -1); // e.g., "gates" -> "gate"

  // Initial loading state
  if (loading && items.length === 0) {
    return (
      <Box
        sx={{
          ...containerStyles,
          my: { xs: 10, sm: 15, md: 20 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <motion.div variants={loaderVariants} initial="hidden" animate="visible">
          <CircularProgress size={40} color="primary" aria-label="Loading items" />
        </motion.div>
      </Box>
    );
  }

  return (
    <AnimatePresence>
      {items.length === 0 && !hasMore ? (
        <motion.div
          key={`no-${gridType}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <Box
            sx={{
              ...containerStyles,
              my: { xs: 10, sm: 15, md: 20 },
              px: { xs: 2, sm: 3 },
              textAlign: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                ...baseTypographyStyles,
                fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" },
                color: "text.primary",
                mb: 2,
              }}
              aria-label={emptyState.text}
            >
              {emptyState.text}
            </Typography>
            {onCreateNew && (
              <Button
                variant="contained"
                onClick={onCreateNew}
                sx={{ mt: 2 }}
                aria-label={`Create a new ${entityType}`}
              >
                {emptyState.button}
              </Button>
            )}
          </Box>
        </motion.div>
      ) : (
        <motion.section
          key={`${gridType}-grid`}
          initial="initial"
          animate="visible"
          transition={{}}
          role="grid"
          aria-label={`${gridType} grid`}
        >
          <Box
            sx={{
              ...containerStyles,
              ...gridStyles.container,
              gridTemplateColumns: getGridColumns(),
              gap: { xs: 2, sm: 3, md: 4 },
              mt: { xs: "56px", sm: "64px" },
              my: { xs: 4, sm: 6 },
              boxSizing: "border-box",
            }}
          >
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <CardWrapper
                  key={item[itemKey]} // Stable key to prevent re-rendering
                  item={item}
                  itemKey={itemKey}
                  entityType={entityType}
                  handleFavorite={handleFavorite}
                  setEditingItem={setEditingItem}
                  setItemToDelete={setItemToDelete}
                  setDeleteDialogOpen={setDeleteDialogOpen}
                  handleManageMembers={handleManageMembers}
                  navigate={navigate}
                  currentUser={currentUser}
                  token={token}
                  isLastItem={hasMore && index === items.length - 1}
                  lastItemRef={lastItemRef}
                />
              ))}
            </AnimatePresence>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 2,
              textAlign: "center",
            }}
            aria-live="polite"
          >
            {hasMore && loading && (
              <motion.div
                variants={loaderVariants}
                initial="hidden"
                animate="visible"
              >
                <CircularProgress size={24} color="primary" aria-label="Loading more items" />
              </motion.div>
            )}
            {!hasMore && items.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                No more {gridType} to load.
              </Typography>
            )}
          </Box>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

Grids.propTypes = {
  items: PropTypes.array.isRequired,
  cardComponent: PropTypes.elementType.isRequired,
  itemKey: PropTypes.string.isRequired,
  gridType: PropTypes.oneOf(VALID_GRID_TYPES).isRequired,
  handleFavorite: PropTypes.func,
  setEditingItem: PropTypes.func,
  setItemToDelete: PropTypes.func,
  setDeleteDialogOpen: PropTypes.func,
  handleManageMembers: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.shape({
    username: PropTypes.string,
    total_points: PropTypes.number,
    anonymous_id: PropTypes.string,
    online_status: PropTypes.string,
  }),
  token: PropTypes.string,
  onCreateNew: PropTypes.func,
  lastItemRef: PropTypes.func,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
};

Grids.defaultProps = {
  handleFavorite: () => {},
  setEditingItem: () => {},
  setItemToDelete: () => {},
  setDeleteDialogOpen: () => {},
  handleManageMembers: () => {},
  lastItemRef: () => {},
  hasMore: false,
  loading: false,
};

export default React.memo(Grids);