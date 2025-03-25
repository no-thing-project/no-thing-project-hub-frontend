// src/components/Gates/GatesFilters.jsx
import React from "react";
import { Box, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";

const GatesFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery }) => {
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) setQuickFilter(newFilter);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", p: 2, maxWidth: 1500, margin: "0 auto" }}>
      <TextField
        label="Search Gates"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ width: "300px" }}
      />
      <ToggleButtonGroup value={quickFilter} exclusive onChange={handleFilterChange} aria-label="gate filter">
        <ToggleButton value="all" aria-label="all gates">All</ToggleButton>
        <ToggleButton value="public" aria-label="public gates">Public</ToggleButton>
        <ToggleButton value="private" aria-label="private gates">Private</ToggleButton>
        <ToggleButton value="liked" aria-label="liked gates">Liked</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default GatesFilters;