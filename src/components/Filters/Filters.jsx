import React, { useState, useCallback, useMemo } from "react";
import { Box, Button, TextField, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { inputStylesWhite } from "../../styles/BaseStyles";
import { debounce } from "lodash";
import PropTypes from "prop-types";

const filterVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const filterOptions = ["all", "public", "private", "favorited"];

const Filters = ({ type, quickFilter, setQuickFilter, searchQuery, setSearchQuery }) => {
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

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

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
          flexDirection: { xs: "column", sm: "row" },
          mb: { xs: 2, sm: 3 },
          alignItems: { xs: "center", sm: "center" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            // flexWrap: { xs: "nowrap", sm: "wrap" },
            gap: { xs: 0.5, sm: 1.2 },
            alignItems: "center",
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: { xs: 0.5, sm: 1 },
            //   flexWrap: { xs: "nowrap", sm: "wrap" },
              overflowX: { xs: "auto", sm: "visible" },
              justifyContent: { xs: "center", sm: "center" },
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {filterOptions.map((filter) => (
              <Button
                key={filter}
                variant={quickFilter === filter ? "contained" : "outlined"}
                onClick={() => setQuickFilter(filter)}
                sx={{
                  minWidth: { xs: 60, sm: 100 },
                  fontSize: { xs: "0.65rem", sm: "0.875rem" },
                  padding: { xs: "4px 8px", sm: "6px 16px" },
                  backgroundColor:
                    quickFilter === filter ? "primary.main" : "background.default",
                  color: quickFilter === filter ? "primary.contrastText" : "text.primary",
                  borderColor: quickFilter === filter ? "primary.main" : "text.primary",
                  borderRadius: theme.shape.borderRadiusSmall,
                  "&:hover": {
                    backgroundColor:
                      quickFilter === filter ? "primary.dark" : "background.hover",
                  },
                  whiteSpace: "nowrap",
                }}
                aria-label={`Show ${filter} ${type}`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </Box>
          <Box
            sx={{
              display: { xs: "none", sm: "center" },
              alignItems: "center",
            }}
          >
            <TextField
              variant="outlined"
              placeholder={`Search ${type}...`}
              value={localSearch}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              sx={{
                ...inputStylesWhite,
                maxWidth: { sm: 300 },
              }}
              inputProps={{ "aria-label": `Search ${type} by name` }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextField
            variant="outlined"
            placeholder={`Search ${type}...`}
            value={localSearch}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            sx={{
              ...inputStylesWhite,
              width: "100%",
              maxWidth: 500,
            }}
            inputProps={{ "aria-label": `Search ${type} by name` }}
          />
        </Box>
      </Box>
    </motion.div>
  );
};

Filters.propTypes = {
  type: PropTypes.oneOf(["classes", "gates", "boards"]).isRequired,
  quickFilter: PropTypes.string.isRequired,
  setQuickFilter: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
};

export default React.memo(Filters);