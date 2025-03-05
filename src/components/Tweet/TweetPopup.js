import React, { useState } from "react";
import { Paper, TextField, Button } from "@mui/material";

const TweetPopup = ({ x, y, onSubmit, onClose }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    onSubmit(text, x, y);
    setText("");
  };

  return (
    <Paper className="tweet-popup" elevation={5} style={{ top: y, left: x }}>
      <TextField
        label="Напиши твіт"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        fullWidth
        margin="dense"
      />
      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
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
