import React from "react";
import { Box, Button, TextField } from "@mui/material";
import { inputStylesWhite } from "../../styles/BaseStyles";

const GatesFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery }) => (
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
          backgroundColor: quickFilter === "all" ? "primary.main" : "transparent",
          color: quickFilter === "all" ? "primary.contrastText" : "text.primary",
          borderColor: quickFilter === "all" ? "primary.main" : "text.primary",
          "&:hover": {
            backgroundColor: quickFilter === "all" ? "primary.dark" : "background.hover",
          },
        }}
        aria-label="Show all gates"
      >
        All
      </Button>
      <Button
        variant={quickFilter === "public" ? "contained" : "outlined"}
        onClick={() => setQuickFilter("public")}
        sx={{
          backgroundColor: quickFilter === "public" ? "primary.main" : "transparent",
          color: quickFilter === "public" ? "primary.contrastText" : "text.primary",
          borderColor: quickFilter === "public" ? "primary.main" : "text.primary",
          "&:hover": {
            backgroundColor: quickFilter === "public" ? "primary.dark" : "background.hover",
          },
        }}
        aria-label="Show public gates"
      >
        Public
      </Button>
      <Button
        variant={quickFilter === "private" ? "contained" : "outlined"}
        onClick={() => setQuickFilter("private")}
        sx={{
          backgroundColor: quickFilter === "private" ? "primary.main" : "transparent",
          color: quickFilter === "private" ? "primary.contrastText" : "text.primary",
          borderColor: quickFilter === "private" ? "primary.main" : "text.primary",
          "&:hover": {
            backgroundColor: quickFilter === "private" ? "primary.dark" : "background.hover",
          },
        }}
        aria-label="Show private gates"
      >
        Private
      </Button>
      <Button
        variant={quickFilter === "favorited" ? "contained" : "outlined"}
        onClick={() => setQuickFilter("favorited")}
        sx={{
          backgroundColor: quickFilter === "favorited" ? "primary.main" : "transparent",
          color: quickFilter === "favorited" ? "primary.contrastText" : "text.primary",
          borderColor: quickFilter === "favorited" ? "primary.main" : "text.primary",
          "&:hover": {
            backgroundColor: quickFilter === "favorited" ? "primary.dark" : "background.hover",
          },
        }}
        aria-label="Show favorited gates"
      >
        Favorited
      </Button>
    </Box>
    <TextField
      variant="outlined"
      placeholder="Search gates..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={{ ...inputStylesWhite, maxWidth: 300 }}
      aria-label="Search gates"
    />
  </Box>
);

export default React.memo(GatesFilters);