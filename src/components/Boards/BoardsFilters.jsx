import React, { useState, useCallback } from "react";
import { Box, Button, TextField, debounce } from "@mui/material";
import { motion } from "framer-motion";
import { inputStylesWhite } from "../../styles/BaseStyles";

const filterVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

const BoardsFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery, additionalFilters = [] }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const debouncedSearch = useCallback(
    debounce((value) => setSearchQuery(value), 300),
    [setSearchQuery]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      setSearchQuery(localSearch);
    }
  };

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
          margin: "0 auto",
          display: "flex",
          gap: 2,
          mb: 2,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant={quickFilter === "all" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("all")}
            sx={{
              backgroundColor: quickFilter === "all" ? "background.button" : "transparent",
              color: quickFilter === "all" ? "background.paper" : "text.primary",
              borderColor: quickFilter === "all" ? "background.button" : "text.primary",
            }}
            aria-label="Filter all boards"
          >
            All
          </Button>
          <Button
            variant={quickFilter === "public" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("public")}
            sx={{
              backgroundColor: quickFilter === "public" ? "background.button" : "transparent",
              color: quickFilter === "public" ? "background.paper" : "text.primary",
              borderColor: quickFilter === "public" ? "background.button" : "text.primary",
            }}
            aria-label="Filter public boards"
          >
            Public
          </Button>
          <Button
            variant={quickFilter === "private" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("private")}
            sx={{
              backgroundColor: quickFilter === "private" ? "background.button" : "transparent",
              color: quickFilter === "private" ? "background.paper" : "text.primary",
              borderColor: quickFilter === "private" ? "background.button" : "text.primary",
            }}
            aria-label="Filter private boards"
          >
            Private
          </Button>
          <Button
            variant={quickFilter === "liked" ? "contained" : "outlined"}
            onClick={() => setQuickFilter("liked")}
            sx={{
              backgroundColor: quickFilter === "liked" ? "background.button" : "transparent",
              color: quickFilter === "liked" ? "background.paper" : "text.primary",
              borderColor: quickFilter === "liked" ? "background.button" : "text.primary",
            }}
            aria-label="Filter favorite boards"
          >
            Favorite
          </Button>
          {additionalFilters.map((filter) => (
            <Button
              key={filter}
              variant={quickFilter === filter ? "contained" : "outlined"}
              onClick={() => setQuickFilter(filter)}
              sx={{
                backgroundColor: quickFilter === filter ? "background.button" : "transparent",
                color: quickFilter === filter ? "background.paper" : "text.primary",
                borderColor: quickFilter === filter ? "background.button" : "text.primary",
              }}
              aria-label={`Filter ${filter} boards`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </Box>
        <TextField
          variant="outlined"
          placeholder="Search"
          value={localSearch}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          sx={inputStylesWhite}
          inputProps={{ "aria-label": "Search boards by name" }}
        />
      </Box>
    </motion.div>
  );
};

export default BoardsFilters;