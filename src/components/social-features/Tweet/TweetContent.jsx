import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Grid,
  Backdrop,
  Fade,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Chip,
  Collapse,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinIcon from "@mui/icons-material/PushPin";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PropTypes from "prop-types";
import { LazyLoadImage } from "react-lazy-load-image-component";
import Emoji from "react-emoji-render";
import TweetContentStyles from "./tweetContentStyles";

const MAX_TWEET_LENGTH = 1000;

const statusColorMap = {
  pending: "default",
  approved: "success",
  rejected: "error",
  announcement: "info",
  reminder: "warning",
  pinned: "primary",
  archived: "default",
};

const TweetContent = ({
  tweet,
  currentUser,
  userRole,
  onLike,
  onDelete,
  onReply,
  onReplyHover,
  onEdit,
  onPinToggle,
  isParentHighlighted = false,
  replyCount = 0,
  parentTweetText = null,
  bypassOwnership = false,
  relatedTweetIds = [],
  availableBoards = [],
  boardId,
  isListView = false,
}) => {
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMediaModal, setOpenMediaModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    content: tweet.content?.value || "",
    status: tweet.status || "approved",
    boardId: tweet.board_id || boardId || "",
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const tweetAuthor = useMemo(
    () => tweet.username || tweet.user?.username || "Someone",
    [tweet.username, tweet.user?.username]
  );

  const isLiked = useMemo(
    () =>
      tweet.liked_by?.some(
        (u) => u.anonymous_id === currentUser?.anonymous_id
      ) ?? false,
    [tweet.liked_by, currentUser?.anonymous_id]
  );

  React.useEffect(() => {
    if (tweet.stats?.likes !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tweet.stats?.likes]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (
      (tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) &&
      onReplyHover
    ) {
      onReplyHover(tweet.tweet_id);
    }
  }, [onReplyHover, tweet]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (
      (tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) &&
      onReplyHover
    ) {
      onReplyHover(null);
    }
  }, [onReplyHover, tweet]);

  const handleMenuOpen = useCallback((event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleOpenMediaModal = useCallback((event) => {
    event.stopPropagation();
    setOpenMediaModal(true);
  }, []);

  const handleCloseMediaModal = useCallback(() => setOpenMediaModal(false), []);

  const handleOpenEditModal = useCallback(() => {
    setEditForm({
      content: tweet.content?.value || "",
      status: tweet.status || "approved",
      boardId: tweet.board_id || boardId || "",
    });
    setEditModalOpen(true);
    handleMenuClose();
  }, [tweet, boardId, handleMenuClose]);

  const handleCloseEditModal = useCallback(() => setEditModalOpen(false), []);

  const handleEditSubmit = useCallback(() => {
    if (!editForm.content.trim()) return;
    onEdit({
      ...tweet,
      content: { ...tweet.content, value: editForm.content },
      status: editForm.status,
      board_id: editForm.boardId,
    });
    setEditModalOpen(false);
  }, [editForm, onEdit, tweet]);

  const canEdit = useMemo(() => {
    if (bypassOwnership || ["moderator", "administrator"].includes(userRole))
      return true;
    return (
      tweet.anonymous_id === currentUser?.anonymous_id ||
      tweet.user_id === currentUser?.anonymous_id ||
      (tweet.username &&
        currentUser?.username &&
        tweet.username === currentUser.username)
    );
  }, [bypassOwnership, userRole, tweet, currentUser]);

  const isRelated = useMemo(
    () => relatedTweetIds.includes(tweet.tweet_id),
    [relatedTweetIds, tweet.tweet_id]
  );

  const highlightStyle = useMemo(() => {
    if (hovered || isRelated || isParentHighlighted) {
      return {
        zIndex: 999,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        transform: "translateY(-2px)",
        transition: "all 0.3s ease",
        backgroundColor: "rgb(250,250,250)",
      };
    }
    return {};
  }, [hovered, isRelated, isParentHighlighted]);

  const renderContent = useMemo(() => {
    const files = tweet.content?.metadata?.files || [];
    const hasText = !!tweet.content?.value;
    const imageFiles = files.filter((f) => f.contentType?.startsWith("image"));
    const videoFiles = files.filter((f) => f.contentType?.startsWith("video"));
    const audioFiles = files.filter((f) => f.contentType?.startsWith("audio"));
    const otherFiles = files.filter(
      (f) =>
        !f.contentType?.startsWith("image") &&
        !f.contentType?.startsWith("video") &&
        !f.contentType?.startsWith("audio")
    );
    const hasMedia =
      imageFiles.length ||
      videoFiles.length ||
      audioFiles.length ||
      otherFiles.length;

    const renderImages = () => {
      if (!imageFiles.length) return null;
      return (
        <Box sx={TweetContentStyles.imageContainer(hasText)}>
          <Grid container spacing={1}>
            {imageFiles.slice(0, 4).map((file, index) => (
              <Grid
                item
                xs={imageFiles.length === 1 ? 12 : 6}
                sm={imageFiles.length === 1 ? 12 : 3}
                key={file.fileKey || `img-${index}`}
              >
                <LazyLoadImage
                  src={file.url}
                  alt={`img-${index}`}
                  effect="blur"
                  style={TweetContentStyles.image(imageFiles.length === 1)}
                  onError={(e) => (e.target.src = "/fallback-image.png")}
                  placeholder={<Box sx={TweetContentStyles.imagePlaceholder} />}
                />
              </Grid>
            ))}
          </Grid>
          <Typography
            variant="caption"
            sx={TweetContentStyles.imageViewAll}
            onClick={handleOpenMediaModal}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handleOpenMediaModal(e)}
          >
            View all images ({imageFiles.length})
          </Typography>
        </Box>
      );
    };

    const renderVideos = () => {
      if (!videoFiles.length) return null;
      return (
        <Box
          sx={TweetContentStyles.videoContainer(
            hasText || imageFiles.length > 0
          )}
        >
          <Box sx={TweetContentStyles.videoInner}>
            <video
              src={videoFiles[0].url}
              controls
              style={TweetContentStyles.video(videoFiles[0].duration)}
              preload="metadata"
              aria-label="Tweet video"
            />
          </Box>
          <Typography
            variant="caption"
            sx={TweetContentStyles.videoViewAll}
            onClick={handleOpenMediaModal}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handleOpenMediaModal(e)}
          >
            View all videos ({videoFiles.length})
          </Typography>
        </Box>
      );
    };

    const renderAudio = () => {
      if (!audioFiles.length) return null;
      return (
        <Box
          sx={TweetContentStyles.audioContainer(
            hasText || imageFiles.length > 0 || videoFiles.length > 0
          )}
        >
          <audio
            src={audioFiles[0].url}
            controls
            style={TweetContentStyles.audio}
            preload="metadata"
            aria-label="Tweet audio"
          />
          <Typography
            variant="caption"
            sx={TweetContentStyles.audioViewAll}
            onClick={handleOpenMediaModal}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handleOpenMediaModal(e)}
          >
            View all audio ({audioFiles.length})
          </Typography>
        </Box>
      );
    };

    const renderOtherFiles = () => {
      if (!otherFiles.length) return null;
      return (
        <Box sx={TweetContentStyles.otherFilesContainer(hasText)}>
          {otherFiles.slice(0, 2).map((file, idx) => (
            <Box
              key={file.fileKey || `other-${idx}`}
              sx={TweetContentStyles.otherFileItem(idx)}
            >
              <InsertDriveFileIcon sx={TweetContentStyles.otherFileIcon} />
              <Link
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={TweetContentStyles.otherFileLink}
              >
                {file.fileKey || `File ${idx + 1}`}
              </Link>
            </Box>
          ))}
          <Typography
            variant="caption"
            sx={TweetContentStyles.otherFilesViewAll}
            onClick={handleOpenMediaModal}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handleOpenMediaModal(e)}
          >
            View all files ({otherFiles.length})
          </Typography>
        </Box>
      );
    };

    return (
      <>
        {hasText &&
          (() => {
            const text = tweet.content.value;
            const PREVIEW_LEN = 200;

            let previewText = text;
            let remainderText = "";
            if (text.length > PREVIEW_LEN) {
              const cutoff = text.slice(0, PREVIEW_LEN);
              const lastSpace = cutoff.lastIndexOf(" ");
              previewText = cutoff.slice(0, lastSpace);
              remainderText = text.slice(lastSpace);
            }

            return (
              <Box>
                <Typography
                  variant="body1"
                  sx={TweetContentStyles.contentText(hasMedia)}
                >
                  <Emoji
                    text={
                      previewText + (!isExpanded && remainderText ? "..." : "")
                    }
                  />
                </Typography>

                {remainderText && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Typography
                      variant="body1"
                      sx={TweetContentStyles.contentText(hasMedia)}
                    >
                      <Emoji text={remainderText} />
                    </Typography>
                  </Collapse>
                )}

                {remainderText && (
                  <Button
                    onClick={() => setIsExpanded((prev) => !prev)}
                    size="small"
                    variant="text"
                    sx={{
                      textTransform: "none",
                      mt: 1,
                      p: 0,
                      color: "text.secondary",
                    }}
                    aria-label={
                      isExpanded ? "Show less text" : "Read more text"
                    }
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </Button>
                )}
              </Box>
            );
          })()}
        {renderImages()}
        {renderVideos()}
        {renderAudio()}
        {renderOtherFiles()}
      </>
    );
  }, [tweet.content, isExpanded, handleOpenMediaModal]);

  const hasReplies = useMemo(
    () => tweet.child_tweet_ids?.length > 0 || replyCount > 0,
    [tweet.child_tweet_ids, replyCount]
  );
  const replyLabel = useMemo(
    () =>
      hasReplies
        ? `${replyCount || tweet.child_tweet_ids.length} ${
            replyCount === 1 ? "Reply" : "Replies"
          }`
        : "",
    [hasReplies, replyCount, tweet.child_tweet_ids]
  );

  const rawStatus = tweet.status || "unknown";
  const chipColor = statusColorMap[rawStatus] || "default";
  const chipLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  return (
    <>
      <Paper
        id={`tweet-${tweet.tweet_id}`}
        className="tweet-card"
        elevation={4}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: "relative",
          overflow: "visible",
          ...TweetContentStyles.tweetCard(tweet.is_pinned, isListView),
          ...highlightStyle,
        }}
        role="article"
        aria-labelledby={`tweet-title-${tweet.tweet_id}`}
      >
        <Typography
          sx={TweetContentStyles.tweetTitle}
          id={`tweet-title-${tweet.tweet_id}`}
        >
          Tweet by {tweetAuthor}
        </Typography>
        {tweet.is_pinned && (
          <Box sx={TweetContentStyles.pinnedIconContainer}>
            <PushPinIcon sx={TweetContentStyles.pinnedIcon} />
          </Box>
        )}
        {parentTweetText && (
          <Box sx={TweetContentStyles.replyToContainer}>
            <Typography
              variant="caption"
              sx={TweetContentStyles.replyToCaption}
            >
              Replying to:
            </Typography>
            <Typography variant="body2" sx={TweetContentStyles.replyToText}>
              <Emoji text={parentTweetText} />
            </Typography>
          </Box>
        )}
        {renderContent}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
            mb: 2,
          }}
        >
          <Chip label={chipLabel} color={chipColor} size="small" />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Author: {tweetAuthor}
          </Typography>
        </Box>
        <Box sx={TweetContentStyles.actionsContainer}>
          <Box sx={TweetContentStyles.actionButtons}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onLike(tweet.tweet_id, isLiked);
              }}
              aria-label={isLiked ? "Unlike tweet" : "Like tweet"}
              sx={TweetContentStyles.likeButton}
            >
              <ThumbUpIcon
                fontSize="small"
                sx={TweetContentStyles.likeIcon(isLiked)}
              />
            </IconButton>
            <Typography
              variant="caption"
              sx={TweetContentStyles.likeCount(isLiked, animate)}
            >
              {tweet.stats?.likes || 0}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReply(tweet);
              }}
              aria-label="Reply to tweet"
              sx={TweetContentStyles.replyButton}
            >
              <ChatBubbleOutlineIcon
                fontSize="small"
                sx={TweetContentStyles.replyIcon}
              />
            </IconButton>
            {hasReplies && (
              <Typography variant="caption" sx={TweetContentStyles.replyCount}>
                {replyLabel}
              </Typography>
            )}
          </Box>
          {canEdit && (
            <Box>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                className="tweet-menu"
                aria-label="Tweet options"
                aria-controls={`tweet-menu-${tweet.tweet_id}`}
                aria-haspopup="true"
                sx={TweetContentStyles.menuButton}
              >
                <MoreVertIcon
                  fontSize="small"
                  sx={TweetContentStyles.menuIcon}
                />
              </IconButton>
              <Menu
                id={`tweet-menu-${tweet.tweet_id}`}
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                slotProps={{ paper: { sx: TweetContentStyles.menuPaper } }}
              >
                <MenuItem onClick={handleOpenEditModal}>Edit Tweet</MenuItem>
                <MenuItem
                  onClick={() => {
                    onPinToggle(tweet);
                    handleMenuClose();
                  }}
                >
                  {tweet.is_pinned ? "Unpin Tweet" : "Pin Tweet"}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onDelete(tweet.tweet_id);
                    handleMenuClose();
                  }}
                  sx={TweetContentStyles.deleteMenuItem}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Paper>

      <Modal
        open={openMediaModal}
        onClose={handleCloseMediaModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
        aria-labelledby="media-modal-title"
      >
        <Fade in={openMediaModal}>
          <Box
            sx={TweetContentStyles.mediaModalBox}
            role="dialog"
            aria-labelledby="media-modal-title"
          >
            <Typography
              id="media-modal-title"
              variant="h6"
              sx={TweetContentStyles.mediaModalTitle}
            >
              All Media
            </Typography>
            <Box sx={TweetContentStyles.mediaModalContent}>
              {(tweet.content?.metadata?.files || []).map((file, idx) => (
                <Box key={file.fileKey || `media-${idx}`}>
                  {file.contentType?.startsWith("image") ? (
                    <LazyLoadImage
                      src={file.url}
                      alt={`Media ${idx + 1}`}
                      effect="blur"
                      style={TweetContentStyles.modalImage}
                      onError={(e) => (e.target.src = "/fallback-image.png")}
                      placeholder={
                        <Box sx={TweetContentStyles.modalImagePlaceholder} />
                      }
                    />
                  ) : file.contentType?.startsWith("video") ? (
                    <video
                      src={file.url}
                      controls
                      style={TweetContentStyles.modalVideo}
                      aria-label={`Video ${idx + 1}`}
                    />
                  ) : file.contentType?.startsWith("audio") ? (
                    <audio
                      src={file.url}
                      controls
                      style={TweetContentStyles.modalAudio}
                      aria-label={`Audio ${idx + 1}`}
                    />
                  ) : (
                    <Box sx={TweetContentStyles.modalOtherFile}>
                      <InsertDriveFileIcon
                        sx={TweetContentStyles.modalOtherFileIcon}
                      />
                      <Link
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={TweetContentStyles.modalOtherFileLink}
                      >
                        {file.fileKey || `File ${idx + 1}`}
                      </Link>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Dialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-tweet-dialog-title"
      >
        <DialogTitle id="edit-tweet-dialog-title">Edit Tweet</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            label="Tweet Content"
            value={editForm.content}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, content: e.target.value }))
            }
            sx={{ mt: 2 }}
            aria-label="Tweet content"
            minRows={3}
            inputProps={{ maxLength: MAX_TWEET_LENGTH }}
            error={editForm.content.length > MAX_TWEET_LENGTH}
            helperText={
              editForm.content.length > MAX_TWEET_LENGTH
                ? `Content exceeds ${MAX_TWEET_LENGTH} characters`
                : `${editForm.content.length}/${MAX_TWEET_LENGTH}`
            }
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tweet Status</InputLabel>
            <Select
              value={editForm.status}
              label="Tweet Status"
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, status: e.target.value }))
              }
              aria-label="Tweet status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
              <MenuItem value="reminder">Reminder</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          {availableBoards.length > 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Move to Board</InputLabel>
              <Select
                value={editForm.boardId}
                label="Move to Board"
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, boardId: e.target.value }))
                }
                aria-label="Move to board"
              >
                {availableBoards.map((b) => (
                  <MenuItem key={b.board_id} value={b.board_id}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} aria-label="Cancel edit tweet">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            aria-label="Save edited tweet"
            disabled={
              !editForm.content.trim() ||
              editForm.content.length > MAX_TWEET_LENGTH
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

TweetContent.propTypes = {
  tweet: PropTypes.shape({
    tweet_id: PropTypes.string.isRequired,
    content: PropTypes.shape({
      type: PropTypes.string,
      value: PropTypes.string,
      metadata: PropTypes.shape({
        files: PropTypes.arrayOf(
          PropTypes.shape({
            fileKey: PropTypes.string,
            url: PropTypes.string,
            contentType: PropTypes.string,
            duration: PropTypes.number,
          })
        ),
        hashtags: PropTypes.arrayOf(PropTypes.string),
        mentions: PropTypes.arrayOf(PropTypes.string),
      }),
    }).isRequired,
    position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
    parent_tweet_id: PropTypes.string,
    child_tweet_ids: PropTypes.arrayOf(PropTypes.string),
    is_anonymous: PropTypes.bool,
    anonymous_id: PropTypes.string,
    user_id: PropTypes.string,
    username: PropTypes.string,
    user: PropTypes.shape({ username: PropTypes.string }),
    created_at: PropTypes.string,
    liked_by: PropTypes.arrayOf(
      PropTypes.shape({
        anonymous_id: PropTypes.string,
        username: PropTypes.string,
      })
    ),
    stats: PropTypes.shape({
      likes: PropTypes.number,
      like_count: PropTypes.number,
      view_count: PropTypes.number,
    }),
    status: PropTypes.string,
    scheduled_at: PropTypes.string,
    reminder: PropTypes.shape({
      schedule: PropTypes.string,
      enabled: PropTypes.bool,
    }),
    is_pinned: PropTypes.bool,
    board_id: PropTypes.string,
  }).isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  userRole: PropTypes.string.isRequired,
  onLike: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onReplyHover: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onPinToggle: PropTypes.func.isRequired,
  isParentHighlighted: PropTypes.bool,
  replyCount: PropTypes.number,
  parentTweetText: PropTypes.string,
  bypassOwnership: PropTypes.bool,
  relatedTweetIds: PropTypes.arrayOf(PropTypes.string),
  availableBoards: PropTypes.arrayOf(
    PropTypes.shape({
      board_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  boardId: PropTypes.string,
};

TweetContent.defaultProps = {
  isParentHighlighted: false,
  replyCount: 0,
  parentTweetText: null,
  bypassOwnership: false,
  relatedTweetIds: [],
  availableBoards: [],
  boardId: "",
};

export default memo(TweetContent);
