import React, { useState, useCallback } from "react";
import { Box, Button, TextField, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { inputStylesWhite } from "../../styles/BaseStyles";
import { debounce } from "lodash";
import PropTypes from "prop-types";

const filterVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const ClassesFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery, onReset }) => {
  const theme = useTheme();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const debouncedSearch = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setSearchQuery(localSearch);
      }
    },
    [localSearch, setSearchQuery]
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={filterVariants}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          maxWidth: 1500,
          mx: "auto",
          display: "flex",
          gap: { xs: 1, md: 2 },
          mb: { xs: 2, md: 3 },
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Box sx={{ display: "flex", gap: { xs: 1, md: 2 }, flexWrap: "wrap" }}>
          {["all", "public", "private", "favorited"].map((filter) => (
            <Button
              key={filter}
              variant={quickFilter === filter ? "contained" : "outlined"}
              onClick={() => setQuickFilter(filter)}
              sx={{
                minWidth: { xs: 80, sm: 100 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                backgroundColor:
                  quickFilter === filter ? "primary.main" : "background.default",
                color: quickFilter === filter ? "primary.contrastText" : "text.primary",
                borderColor: quickFilter === filter ? "primary.main" : "text.primary",
                borderRadius: theme.shape.borderRadiusSmall,
                "&:hover": {
                  backgroundColor:
                    quickFilter === filter ? "primary.dark" : "background.hover",
                },
              }}
              aria-label={`Show ${filter} classes`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search classes..."
          value={localSearch}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          sx={{
            ...inputStylesWhite,
            maxWidth: { xs: "100%", sm: 300 },
            width: { xs: "100%", sm: "auto" },
          }}
          inputProps={{ "aria-label": "Search classes by name" }}
        />
      </Box>
    </motion.div>
  );
};

ClassesFilters.propTypes = {
  quickFilter: PropTypes.string.isRequired,
  setQuickFilter: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default React.memo(ClassesFilters);