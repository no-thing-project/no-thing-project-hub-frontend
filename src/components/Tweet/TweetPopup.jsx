//src/components/Tweet/TweetPopup.js
import React, { useCallback } from "react";
import { Paper, TextField, Button, Box } from "@mui/material";
import theme from "../../Theme";

const TweetPopup = ({ x, y, draft, onDraftChange, onSubmit, onClose }) => {
  const handleSubmit = useCallback(() => {
    if (!draft.trim()) return;
    onSubmit(draft, x, y);
    onDraftChange("");
  }, [draft, x, y, onSubmit, onDraftChange]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Paper
      className="tweet-popup"
      elevation={5}
      sx={{
        position: "absolute",
        top: y,
        left: x,
        p: 2,
        minWidth: "200px",
        backgroundColor: "#fff",
      }}
    >
      <TextField
        label="Write your message"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyPress={handleKeyPress}
        autoFocus
        fullWidth
        multiline
        maxRows={4}
        margin="dense"
        InputProps={{ notched: false }}
        sx={{
          marginBottom: 3,
          "& .MuiFormLabel-root.MuiInputLabel-shrink": {
            backgroundColor: "white",
            padding: "0 5px",
          },
          "& .MuiInputLabel-root": {
            color: "text.secondary",
            fontWeight: 200
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "text.primary",
          },
          "& .MuiOutlinedInput-root": {
            borderRadius: theme.shape.borderRadiusSmall,
            "&:hover fieldset": {
              borderColor: theme.palette.primary.contrastText,
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.contrastText,
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: theme.palette.text.secondary
          },
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            textTransform: "uppercase",
            fontWeight: 500,
            borderRadius: 0.8,
            boxShadow: "none",
            backgroundColor: "#3E435D",
            color: "#fff",
            padding: "10px 20px",
            transition: "all 0.5s ease",
            ":hover": {
              boxShadow: "none",
              opacity: 0.8,
              transition: "all 0.5s ease",
            },
          }}
        >
          Add post
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            textTransform: "uppercase",
            fontWeight: 500,
            borderRadius: 0.8,
            boxShadow: "none",
            color: "#3E435D",
            padding: "10px 20px",
            transition: "all 0.5s ease",
            ":hover": {
              boxShadow: "none",
              backgroundColor: "#3E435D",
              color: "#fff",
              transition: "all 0.5s ease",
            },
          }}
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
};

export default TweetPopup;
