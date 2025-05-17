import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
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
  Link,
  Chip,
  Collapse,
  Button,
  CircularProgress,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Emoji from 'react-emoji-render';
import TweetContentStyles from './tweetContentStyles';
import { isEqual } from 'lodash';

const MAX_TWEET_LENGTH = 1000;

const statusColorMap = {
  pending: 'default',
  approved: 'success',
  rejected: 'error',
  announcement: 'info',
  reminder: 'warning',
  pinned: 'primary',
  archived: 'default',
};

// Animation variants
const mediaVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// Circular Video Player
const CircularVideoPlayer = memo(({ src, duration, ariaLabel }) => (
  <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
    <Box sx={TweetContentStyles.mediaWrapper} role="region" aria-label={ariaLabel}>
      <Box sx={TweetContentStyles.circleVideoContainer}>
        <video
          src={src}
          controls
          style={TweetContentStyles.circleVideo(duration)}
          preload="metadata"
          aria-label={ariaLabel}
        />
      </Box>
    </Box>
  </motion.div>
));

CircularVideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  duration: PropTypes.number,
  ariaLabel: PropTypes.string.isRequired,
};

// Standard Video Player
const StandardVideoPlayer = memo(({ src, duration, ariaLabel }) => (
  <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
    <Box sx={TweetContentStyles.mediaWrapper} role="region" aria-label={ariaLabel}>
      <Box sx={TweetContentStyles.videoInner}>
        <video
          src={src}
          controls
          style={TweetContentStyles.video(duration)}
          preload="metadata"
          aria-label={ariaLabel}
        />
      </Box>
    </Box>
  </motion.div>
));

StandardVideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  duration: PropTypes.number,
  ariaLabel: PropTypes.string.isRequired,
};

// Audio Player
const AudioPlayer = memo(({ src }) => (
      <Box sx={TweetContentStyles.audioPlayer}>
        <audio
          src={src}
          controls
          style={{ width: '100%' }}
          preload="metadata"
        />
      </Box>
));

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  isRecorded: PropTypes.bool,
  ariaLabel: PropTypes.string.isRequired,
};

// File Item
const FileItem = memo(({ file, index }) => (
  <motion.div
    variants={mediaVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    key={file.fileKey || `other-${index}`}
  >
    <Box sx={TweetContentStyles.otherFileItem(index)} role="region" aria-label={`File ${index + 1}`}>
      <InsertDriveFileIcon sx={TweetContentStyles.otherFileIcon} />
      <Link
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={TweetContentStyles.otherFileLink}
        aria-label={`Download file ${file.fileKey || `File ${index + 1}`}`}
      >
        {file.fileKey || `File ${index + 1}`}
      </Link>
    </Box>
  </motion.div>
));

FileItem.propTypes = {
  file: PropTypes.shape({
    fileKey: PropTypes.string,
    url: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
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
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoized derived data
  const tweetAuthor = useMemo(
    () => tweet.username || tweet.user?.username || 'Someone',
    [tweet.username, tweet.user?.username]
  );

  const isLiked = useMemo(
    () => tweet.liked_by?.some((u) => u.anonymous_id === currentUser?.anonymous_id) ?? false,
    [tweet.liked_by, currentUser?.anonymous_id]
  );

  const canEdit = useMemo(() => {
    if (bypassOwnership || ['moderator', 'admin'].includes(userRole)) return true;
    return (
      tweet.anonymous_id === currentUser?.anonymous_id ||
      tweet.user_id === currentUser?.anonymous_id ||
      (tweet.username &&
        currentUser?.username &&
        tweet.username.toLowerCase() === currentUser.username.toLowerCase())
    );
  }, [bypassOwnership, userRole, tweet, currentUser]);

  const isRelated = useMemo(
    () => relatedTweetIds.includes(tweet.tweet_id),
    [relatedTweetIds, tweet.tweet_id]
  );

  const hasReplies = useMemo(() => replyCount > 0 || tweet.child_tweet_ids?.length > 0, [
    replyCount,
    tweet.child_tweet_ids,
  ]);
  const replyLabel = useMemo(
    () =>
      hasReplies
        ? `${replyCount || tweet.child_tweet_ids?.length} ${replyCount === 1 ? 'Reply' : 'Replies'}`
        : '',
    [hasReplies, replyCount, tweet.child_tweet_ids]
  );

  const rawStatus = tweet.status || 'unknown';
  const chipColor = statusColorMap[rawStatus] || 'default';
  const chipLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  // Like animation
  useEffect(() => {
    if (tweet.stats?.like_count !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tweet.stats?.like_count]);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(tweet.tweet_id);
    }
  }, [onReplyHover, tweet.tweet_id, tweet.parent_tweet_id, tweet.child_tweet_ids]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(null);
    }
  }, [onReplyHover, tweet.parent_tweet_id, tweet.child_tweet_ids]);

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

  const handleEdit = useCallback(() => {
    onEdit(tweet);
    handleMenuClose();
  }, [onEdit, tweet]);

  const handlePin = useCallback(() => {
    onPinToggle(tweet);
    handleMenuClose();
  }, [onPinToggle, tweet]);

  const handleDelete = useCallback(() => {
    onDelete(tweet.tweet_id);
    handleMenuClose();
  }, [onDelete, tweet.tweet_id]);

  const handleToggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  // Memoized highlight style
  const highlightStyle = useMemo(() => {
    if (hovered || isRelated || isParentHighlighted) {
      return {
        zIndex: 999,
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        transform: 'translateY(-4px)',
        background: 'linear-gradient(145deg, #FFFFFF, #F5F8FA)',
      };
    }
    return {};
  }, [hovered, isRelated, isParentHighlighted]);

  // Memoized text content
  const { previewText, remainderText } = useMemo(() => {
    const text = tweet.content?.value || '';
    const PREVIEW_LEN = 200;
    if (text.length <= PREVIEW_LEN) {
      return { previewText: text, remainderText: '' };
    }
    const cutoff = text.slice(0, PREVIEW_LEN);
    const lastSpace = cutoff.lastIndexOf(' ') > -1 ? cutoff.lastIndexOf(' ') : PREVIEW_LEN;
    return {
      previewText: cutoff.slice(0, lastSpace),
      remainderText: text.slice(lastSpace),
    };
  }, [tweet.content?.value]);

  // Memoized media content
  const renderContent = useMemo(() => {
    const files = tweet.content?.metadata?.files || [];
    const hasText = !!tweet.content?.value;
    const imageFiles = files.filter((f) => f.contentType?.startsWith('image'));
    const videoFiles = files.filter((f) => f.contentType?.startsWith('video'));
    const audioFiles = files.filter((f) => f.contentType?.startsWith('audio'));
    const otherFiles = files.filter(
      (f) =>
        !f.contentType?.startsWith('image') &&
        !f.contentType?.startsWith('video') &&
        !f.contentType?.startsWith('audio')
    );
    const hasMedia = imageFiles.length || videoFiles.length || audioFiles.length || otherFiles.length;

    const renderImages = () => {
      if (!imageFiles.length) return null;
      return (
        <Box sx={TweetContentStyles.imageContainer(hasText)} role="region" aria-label="Images">
          <Grid container spacing={1}>
            {imageFiles.slice(0, 4).map((file, index) => (
              <Grid
                item
                xs={imageFiles.length === 1 ? 12 : 6}
                sm={imageFiles.length === 1 ? 12 : 3}
                key={file.fileKey || `img-${index}`}
              >
                <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
                  <LazyLoadImage
                    src={file.url}
                    alt={`Image ${index + 1}`}
                    effect="blur"
                    style={TweetContentStyles.image(imageFiles.length === 1)}
                    onError={(e) => (e.target.src = '/fallback-image.png')}
                    placeholder={
                      <Box sx={TweetContentStyles.imagePlaceholder}>
                        <CircularProgress size={24} />
                      </Box>
                    }
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
          {imageFiles.length > 4 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Typography
                variant="caption"
                sx={TweetContentStyles.imageViewAll}
                onClick={handleOpenMediaModal}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleOpenMediaModal(e)}
              >
                View all images ({imageFiles.length})
              </Typography>
            </motion.div>
          )}
        </Box>
      );
    };

    const renderVideos = () => {
      if (!videoFiles.length) return null;
      return (
        <Box
          sx={TweetContentStyles.videoContainer(hasText || imageFiles.length > 0)}
          role="region"
          aria-label="Videos"
        >
          {videoFiles[0].contentType === 'video/webm' ? (
            <CircularVideoPlayer
              src={videoFiles[0].url}
              duration={videoFiles[0].duration}
              ariaLabel="Recorded tweet video"
            />
          ) : (
            <StandardVideoPlayer
              src={videoFiles[0].url}
              duration={videoFiles[0].duration}
              ariaLabel="Tweet video"
            />
          )}
          {videoFiles.length > 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Typography
                variant="caption"
                sx={TweetContentStyles.videoViewAll}
                onClick={handleOpenMediaModal}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleOpenMediaModal(e)}
              >
                View all videos ({videoFiles.length})
              </Typography>
            </motion.div>
          )}
        </Box>
      );
    };

    const renderAudio = () => {
      if (!audioFiles.length) return null;
      return (
        <Box
          sx={TweetContentStyles.audioContainer(hasText || imageFiles.length > 0 || videoFiles.length > 0)}
          role="region"
          aria-label="Audio"
        >
          <AudioPlayer
            src={audioFiles[0].url}
          />
          {audioFiles.length > 1 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Typography
                variant="caption"
                sx={TweetContentStyles.audioViewAll}
                onClick={handleOpenMediaModal}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleOpenMediaModal(e)}
              >
                View all audio ({audioFiles.length})
              </Typography>
            </motion.div>
          )}
        </Box>
      );
    };

    const renderOtherFiles = () => {
      if (!otherFiles.length) return null;
      return (
        <Box sx={TweetContentStyles.otherFilesContainer(hasText)} role="region" aria-label="Files">
          {otherFiles.slice(0, 2).map((file, idx) => (
            <FileItem file={file} index={idx} key={file.fileKey || `other-${idx}`} />
          ))}
          {otherFiles.length > 2 && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Typography
                variant="caption"
                sx={TweetContentStyles.otherFilesViewAll}
                onClick={handleOpenMediaModal}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleOpenMediaModal(e)}
              >
                View all files ({otherFiles.length})
              </Typography>
            </motion.div>
          )}
        </Box>
      );
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {hasText && (
          <Box>
            <Typography sx={TweetContentStyles.contentText(hasMedia)}>
              <Emoji text={previewText + (!isExpanded && remainderText ? '...' : '')} />
            </Typography>
            {remainderText && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Typography sx={TweetContentStyles.contentText(hasMedia)}>
                  <Emoji text={remainderText} />
                </Typography>
              </Collapse>
            )}
            {remainderText && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleToggleExpand}
                  size="small"
                  variant="text"
                  sx={TweetContentStyles.readMoreButton}
                  aria-label={isExpanded ? 'Show less text' : 'Read more text'}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              </motion.div>
            )}
          </Box>
        )}
        {renderImages()}
        {renderVideos()}
        {renderAudio()}
        {renderOtherFiles()}
      </motion.div>
    );
  }, [tweet.content, previewText, remainderText, isExpanded, handleOpenMediaModal]);

  // Memoized modal content
  const modalContent = useMemo(() => {
    const files = tweet.content?.metadata?.files || [];
    return (
      <Box sx={TweetContentStyles.mediaModalContent}>
        {files.map((file, idx) => (
          <motion.div
            key={file.fileKey || `media-${idx}`}
            variants={mediaVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {file.contentType?.startsWith('image') ? (
              <LazyLoadImage
                src={file.url}
                alt={`Media ${idx + 1}`}
                effect="blur"
                style={TweetContentStyles.modalImage}
                onError={(e) => (e.target.src = '/fallback-image.png')}
                placeholder={
                  <Box sx={TweetContentStyles.modalImagePlaceholder}>
                    <CircularProgress size={24} />
                  </Box>
                }
              />
            ) : file.contentType === 'video/webm' ? (
              <CircularVideoPlayer
                src={file.url}
                duration={file.duration}
                ariaLabel={`Recorded video ${idx + 1}`}
              />
            ) : file.contentType?.startsWith('video') ? (
              <StandardVideoPlayer
                src={file.url}
                duration={file.duration}
                ariaLabel={`Video ${idx + 1}`}
              />
            ) : file.contentType?.startsWith('audio') ? (
              <AudioPlayer
                src={file.url}
              />
            ) : (
              <FileItem file={file} index={idx} />
            )}
          </motion.div>
        ))}
      </Box>
    );
  }, [tweet.content?.metadata?.files]);

  // Fallback rendering for invalid tweet
  if (!tweet.tweet_id || !tweet.content) {
    return (
      <Paper sx={TweetContentStyles.tweetCard(false, isListView)} role="article">
        <Typography sx={TweetContentStyles.tweetTitle}>Invalid Tweet</Typography>
        <Typography variant="body2" color="error">
          This tweet is missing required data.
        </Typography>
      </Paper>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Paper
        id={`tweet-${tweet.tweet_id}`}
        className="tweet-card"
        elevation={4}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          position: 'relative',
          overflow: 'visible',
          ...TweetContentStyles.tweetCard(tweet.is_pinned, isListView),
          ...highlightStyle,
        }}
        role="article"
        aria-labelledby={`tweet-title-${tweet.tweet_id}`}
      >
        <Typography sx={TweetContentStyles.tweetTitle} id={`tweet-title-${tweet.tweet_id}`}>
          Tweet by {tweetAuthor}
        </Typography>
        {tweet.is_pinned && (
          <Box sx={TweetContentStyles.pinnedIconContainer}>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <PushPinIcon sx={TweetContentStyles.pinnedIcon} />
            </motion.div>
          </Box>
        )}
        {parentTweetText && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={TweetContentStyles.replyToContainer}>
              <Typography variant="caption" sx={TweetContentStyles.replyToCaption}>
                Replying to:
              </Typography>
              <Typography variant="body2" sx={TweetContentStyles.replyToText}>
                <Emoji text={parentTweetText} />
              </Typography>
            </Box>
          </motion.div>
        )}
        {renderContent}
        <Box sx={TweetContentStyles.statusContainer}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Chip
              label={chipLabel}
              color={chipColor}
              size="small"
              aria-label={`Tweet status: ${chipLabel}`}
            />
          </motion.div>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Author: {tweetAuthor}
          </Typography>
        </Box>
        <Box sx={TweetContentStyles.actionsContainer}>
          <Box sx={TweetContentStyles.actionButtons}>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(tweet.tweet_id, isLiked);
                }}
                aria-label={isLiked ? 'Unlike tweet' : 'Like tweet'}
                sx={TweetContentStyles.likeButton}
              >
                <ThumbUpIcon sx={TweetContentStyles.likeIcon(isLiked)} />
              </IconButton>
            </motion.div>
            <Typography variant="caption" sx={TweetContentStyles.likeCount(isLiked, animate)}>
              {tweet.stats?.like_count || 0}
            </Typography>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(tweet);
                }}
                aria-label="Reply to tweet"
                sx={TweetContentStyles.replyButton}
              >
                <ChatBubbleOutlineIcon sx={TweetContentStyles.replyIcon} />
              </IconButton>
            </motion.div>
            {hasReplies && (
              <Typography variant="caption" sx={TweetContentStyles.replyCount}>
                {replyLabel}
              </Typography>
            )}
          </Box>
          {canEdit && (
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={handleMenuOpen}
                className="tweet-menu"
                aria-label="Tweet options"
                aria-controls={`tweet-menu-${tweet.tweet_id}`}
                aria-haspopup="true"
                sx={TweetContentStyles.menuButton}
              >
                <MoreVertIcon sx={TweetContentStyles.menuIcon} />
              </IconButton>
            </motion.div>
          )}
          <Menu
            id={`tweet-menu-${tweet.tweet_id}`}
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{
              paper: { sx: TweetContentStyles.menuPaper },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleEdit} aria-label="Edit tweet">
              Edit Tweet
            </MenuItem>
            <MenuItem
              onClick={handlePin}
              aria-label={tweet.is_pinned ? 'Unpin tweet' : 'Pin tweet'}
            >
              {tweet.is_pinned ? 'Unpin Tweet' : 'Pin Tweet'}
            </MenuItem>
            <MenuItem
              onClick={handleDelete}
              sx={TweetContentStyles.deleteMenuItem}
              aria-label="Delete tweet"
            >
              Delete
            </MenuItem>
          </Menu>
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
            sx={{
              ...TweetContentStyles.mediaModalBox,
              width: { xs: '90vw', sm: '80vw', md: '900px' },
              maxWidth: '95vw',
              p: { xs: 2, sm: 3 },
            }}
            role="dialog"
            aria-labelledby="media-modal-title"
          >
            <Typography id="media-modal-title" sx={TweetContentStyles.mediaModalTitle}>
              All Media
            </Typography>
            {modalContent}
          </Box>
        </Fade>
      </Modal>
    </motion.div>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  return (
    isEqual(prevProps.tweet, nextProps.tweet) &&
    isEqual(prevProps.currentUser, nextProps.currentUser) &&
    prevProps.userRole === nextProps.userRole &&
    prevProps.onLike === nextProps.onLike &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onReply === nextProps.onReply &&
    prevProps.onReplyHover === nextProps.onReplyHover &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onPinToggle === nextProps.onPinToggle &&
    prevProps.isParentHighlighted === nextProps.isParentHighlighted &&
    prevProps.replyCount === nextProps.replyCount &&
    prevProps.parentTweetText === nextProps.parentTweetText &&
    prevProps.bypassOwnership === nextProps.bypassOwnership &&
    isEqual(prevProps.relatedTweetIds, nextProps.relatedTweetIds) &&
    isEqual(prevProps.availableBoards, nextProps.availableBoards) &&
    prevProps.boardId === nextProps.boardId &&
    prevProps.isListView === nextProps.isListView
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
  isListView: PropTypes.bool,
};

TweetContent.defaultProps = {
  isParentHighlighted: false,
  replyCount: 0,
  parentTweetText: null,
  bypassOwnership: false,
  relatedTweetIds: [],
  availableBoards: [],
  boardId: '',
  isListView: false,
};

export default memo(TweetContent, arePropsEqual);