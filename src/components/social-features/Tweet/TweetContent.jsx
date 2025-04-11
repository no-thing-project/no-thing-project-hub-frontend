import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const TweetContent = React.memo(
  ({
    tweet,
    currentUser,
    onLike,
    onDelete,
    onReply,
    onReplyHover,
    onEdit,
    onMove,
    onChangeType,
    isParentHighlighted = false,
    replyCount = 0,
    parentTweetText = null,
  }) => {
    const isLiked = tweet.liked_by?.some(
      (u) => u.anonymous_id === currentUser?.anonymous_id
    );
    const tweetAuthor = tweet.username || tweet.user?.username || "Someone";

    const [animate, setAnimate] = useState(false);
    useEffect(() => {
      if (tweet.stats?.likes !== undefined) {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
      }
    }, [tweet.stats?.likes]);

    const [hovered, setHovered] = useState(false);
    const handleMouseEnter = () => {
      setHovered(true);
      if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
        onReplyHover(tweet.parent_tweet_id || tweet.tweet_id);
      }
    };
    const handleMouseLeave = () => {
      setHovered(false);
      if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
        onReplyHover(null);
      }
    };

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

    const [anchorEl, setAnchorEl] = useState(null);
    const handleMenuOpen = (event) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => setAnchorEl(null);

    return (
      <Paper
        id={`tweet-${tweet.tweet_id}`}
        className="tweet-card"
        elevation={3}
        onClick={(e) => {
          // зупини клік всередині меню, щоб не активував draggable onStop
          if (e.target.closest(".tweet-menu")) {
            e.stopPropagation();
            return;
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          padding: "16px",
          backgroundColor: hovered ? "background.default" : "background.paper",
          borderRadius: 1,
          minWidth: "180px",
          maxWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.01)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
          },
          ...(isParentHighlighted && {
            backgroundColor: "background.hover",
          }),
          ...(tweet.status === "pending" && {
            border: "1px dashed #888",
          }),
        }}
      >
        {parentTweetText && (
          <Box
            sx={{
              borderLeft: "3px solid",
              borderColor: "#CDD0D5",
              paddingLeft: "8px",
              marginBottom: "8px",
              fontStyle: "italic",
              fontWeight: 200,
              color: "#CDD0D5",
            }}
          >
            Reply to: {parentTweetText}
          </Box>
        )}

        {renderContent(tweet.content)}

        <Typography
          variant="body1"
          sx={{ color: "text.secondary", fontSize: "1rem" }}
        >
          Author: {tweetAuthor}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontSize: "0.8rem" }}
        >
          Status: {tweet.status}
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
              {tweet.stats?.likes || 0}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReply(tweet);
              }}
              sx={{ ml: 1 }}
            >
              <ChatBubbleOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
            {replyCount > 0 && (
              <Typography variant="caption" sx={{ marginLeft: 0.5, color: "text.secondary" }}>
                {replyCount}
              </Typography>
            )}
          </Box>

          {(tweet?.anonymous_id || tweet.user_id) === currentUser?.anonymous_id && (
            <Box>
              <IconButton size="small" onClick={handleMenuOpen} className="tweet-menu">
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { onEdit(tweet); handleMenuClose(); }}>Edit Tweet</MenuItem>
                <MenuItem onClick={() => { onMove(tweet); handleMenuClose(); }}>Move to Another Board</MenuItem>
                <MenuItem onClick={() => { onChangeType(tweet); handleMenuClose(); }}>Change Type</MenuItem>
                <MenuItem onClick={() => { onDelete(tweet.tweet_id); handleMenuClose(); }} sx={{ color: "error.main" }}>Delete</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }
);

export default TweetContent;