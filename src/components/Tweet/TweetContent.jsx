// src/components/Tweet/TweetContent.jsx
import React, { useEffect, useState } from "react";
import { Paper, Typography, Box, IconButton } from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteIcon from "@mui/icons-material/Delete";

const TweetContent = React.memo(
  ({ tweet, currentUser, onLike, onDelete, onFocus }) => {
    // Використовуємо currentUser.anonymous_id для перевірки лайку (за потребою можна змінити на currentUser.id)
    const isLiked = tweet.liked_by?.some(
      (u) => u.user_id === currentUser?.anonymous_id
    );
    const tweetAuthor = tweet.user?.username || tweet.username || "Someone";

    // Стан для анімації "пульсу" лічильника
    const [animate, setAnimate] = useState(false);
    useEffect(() => {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }, [tweet.likes]);

    const renderContent = (content) => {
      switch (content.type) {
        case "text":
          return (
            <Typography
              variant="body1"
              sx={{ marginBottom: "8px", color: "#424242", fontWeight: 200 }}
            >
              {content.value}
            </Typography>
          );
        case "image":
          return (
            <img
              src={content.url}
              alt="Tweet media"
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          );
        default:
          return null;
      }
    };

    return (
      <Paper
        className="tweet-card"
        elevation={3}
        onClick={(e) => {
          e.stopPropagation();
          onFocus(tweet);
        }}
        sx={{
          padding: "16px",
          backgroundColor: "#fff",
          borderRadius: 1,
          minWidth: "180px",
          maxWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: "scale(1.01)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          },
        }}
      >
        {renderContent(tweet.content)}
        <Typography variant="body1" sx={{ color: "text.secondary", fontSize: "1rem" }}>
          Author: {tweetAuthor}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: 1,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onLike(tweet.tweet_id, isLiked);
              }}
            >
              <ThumbUpIcon
                fontSize="small"
                sx={{ color: isLiked ? "text.primary" : "text.secondary" }}
              />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                marginLeft: 0.5,
                marginTop: 0.2,
                color: isLiked ? "text.primary" : "text.secondary",
                transform: animate ? "scale(1.2)" : "scale(1)",
                transition: "transform 300ms ease",
              }}
            >
              {tweet.likes}
            </Typography>
          </Box>
          {((tweet?.user?.anonymous_id || tweet.user_id) === currentUser?.anonymous_id) && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tweet.tweet_id);
              }}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Paper>
    );
  }
);

export default TweetContent;
