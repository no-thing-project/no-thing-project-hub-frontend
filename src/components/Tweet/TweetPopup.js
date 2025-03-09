//src/components/Tweet/TweetPopup.js
import React, { useCallback } from "react"; // Прибрано useState
import { Paper, TextField, Button } from "@mui/material";

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
    <Paper className="tweet-popup" elevation={5} sx={{ position: "absolute", top: y, left: x, p: 2, minWidth: "200px" }}>
      <TextField
        label="Напиши твіт"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyPress={handleKeyPress}
        autoFocus
        fullWidth
        multiline
        maxRows={4}
        margin="dense"
      />
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Додати
        </Button>
        <Button onClick={onClose} color="secondary">
          Відміна
        </Button>
      </div>
    </Paper>
  );
};

export default TweetPopup;