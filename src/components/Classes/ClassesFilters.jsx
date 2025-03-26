import React from "react";
import { Box, Button, TextField } from "@mui/material";
import { inputStylesWhite } from "../../styles/BaseStyles";

const ClassesFilters = ({ quickFilter, setQuickFilter, searchQuery, setSearchQuery }) => (
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
    <Box sx={{ display: "flex", gap: 2 }}>
      <Button
        variant={quickFilter === "all" ? "contained" : "outlined"}
        onClick={() => setQuickFilter("all")}
        sx={{
          backgroundColor: quickFilter === "all" ? "background.button" : "transparent",
          color: quickFilter === "all" ? "background.paper" : "text.primary",
          borderColor: quickFilter === "all" ? "background.button" : "text.primary",
        }}
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
      >
        Favorite
      </Button>
    </Box>
    <TextField
      variant="outlined"
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={inputStylesWhite}
    />
  </Box>
);

export default ClassesFilters;