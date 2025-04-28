import React from "react";
import { Box, Button, TextField, useTheme } from "@mui/material";
import { inputStylesWhite } from "../../styles/BaseStyles";
import PropTypes from "prop-types";

const GatesFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery, onReset }) => {
  const theme = useTheme();

  return (
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
            aria-label={`Show ${filter} gates`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </Box>
      <TextField
        variant="outlined"
        placeholder="Search gates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          ...inputStylesWhite,
          maxWidth: { xs: "100%", sm: 300 },
          width: { xs: "100%", sm: "auto" },
        }}
        aria-label="Search gates"
      />
    </Box>
  );
};

GatesFilters.propTypes = {
  quickFilter: PropTypes.string.isRequired,
  setQuickFilter: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default React.memo(GatesFilters);