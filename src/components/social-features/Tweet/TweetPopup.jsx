import React, { useCallback, useState } from "react";
import { Paper, TextField, Button, Box } from "@mui/material";
import theme from "../../../Theme";
import { actionButtonStyles, cancelButtonStyle, inputStyles } from "../../../styles/BaseStyles";

const TweetPopup = ({ x, y, draft, onDraftChange, onSubmit, onClose }) => {
  const [scheduledAt, setScheduledAt] = useState("");

  const handleSubmit = useCallback(() => {
    if (!draft.trim()) return;
    onSubmit(draft, x, y, scheduledAt);
    onDraftChange("");
    setScheduledAt("");
  }, [draft, x, y, scheduledAt, onSubmit, onDraftChange]);

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
        backgroundColor: "background.paper",
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
        sx={inputStyles}
      />
      <TextField
        label="Schedule (optional)"
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        fullWidth
        margin="dense"
        InputLabelProps={{ shrink: true }}
        sx={inputStyles}
      />
      <Box sx={{ display: "flex", justifyContent: "space-evenly", mt: theme.spacing(2) }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={actionButtonStyles}
        >
          Add post
        </Button>
        <Button
          onClick={onClose}
          variant="contained"
          sx={cancelButtonStyle}
        >
          Cancel
        </Button>
      </Box>
    </Paper>
  );
};

export default TweetPopup;