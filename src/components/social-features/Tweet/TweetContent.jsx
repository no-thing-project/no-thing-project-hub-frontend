import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Modal,
  Grid,
  Backdrop,
  Fade,
  Link,
  Chip,
  Collapse,
  Button,
  CircularProgress,
  Icon,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Emoji from 'react-emoji-render';
import TweetContentStyles from './TweetContentStyles';
import { isEqual } from 'lodash';
import ModalStyles from './modalStyles';

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

const mediaVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const ViewAllButton = ({ label, onClick, sx }) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Typography
      variant="caption"
      style={{ ...sx, cursor: 'pointer' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick(e)}
      aria-label={label}
    >
      {label}
    </Typography>
  </motion.div>
);

ViewAllButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  sx: PropTypes.object.isRequired,
};

const CircularVideoPlayer = memo(({ src, duration, ariaLabel }) => (
  <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
    <Box sx={TweetContentStyles.mediaWrapper} role="region" aria-label={ariaLabel}>
      <Box sx={{ ...TweetContentStyles.circleVideoContainer, display: 'flex', justifyContent: 'center' }}>
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

const StandardVideoPlayer = memo(({ src, duration, ariaLabel }) => (
  <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
    <Box sx={TweetContentStyles.mediaWrapper} role="region" aria-label={ariaLabel}>
      <Box sx={{ ...TweetContentStyles.videoInner, display: 'flex', justifyContent: 'center' }}>
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

const AudioPlayer = memo(({ src }) => (
  <Box sx={{ ...TweetContentStyles.audioPlayer, maxWidth: '100%' }}>
    <audio src={src} controls sx={{ width: '100%' }} preload="metadata" />
  </Box>
));

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,
};

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
        style={TweetContentStyles.otherFileLink}
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
  error = null,
  getParentTweetText,
}) => {
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openOptionsModal, setOpenOptionsModal] = useState(false);
  const [openMediaModal, setOpenMediaModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const tweetAuthor = useMemo(
    () => tweet.username || tweet.user?.username || 'Anonymous',
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

  const rawStatus = tweet.status || 'approved';
  const chipColor = statusColorMap[rawStatus] || 'default';
  const chipLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  const resolvedParentTweetText = useMemo(() => {
    if (!tweet.parent_tweet_id) return null;
    return parentTweetText || getParentTweetText?.(tweet.parent_tweet_id) || 'Parent tweet not found';
  }, [tweet.parent_tweet_id, parentTweetText, getParentTweetText]);

  useEffect(() => {
    if (tweet.stats?.like_count !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tweet.stats?.like_count]);

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

  const handleOpenOptionsModal = useCallback(() => {
    setOpenOptionsModal(true);
  }, []);

  const handleCloseOptionsModal = useCallback(() => {
    setOpenOptionsModal(false);
  }, []);

  const handleOpenMediaModal = useCallback(() => {
    setOpenMediaModal(true);
  }, []);

  const handleCloseMediaModal = useCallback(() => {
    setOpenMediaModal(false);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(tweet);
    handleCloseOptionsModal();
  }, [onEdit, tweet]);

  const handlePin = useCallback(() => {
    onPinToggle(tweet);
    handleCloseOptionsModal();
  }, [onPinToggle, tweet]);

  const handleDelete = useCallback(() => {
    onDelete(tweet.tweet_id);
    handleCloseOptionsModal();
  }, [onDelete, tweet.tweet_id]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

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

  const renderImages = useMemo(() => {
    const imageFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('image')) || [];
    if (!imageFiles.length) return null;
    return (
      <Box sx={{ ...TweetContentStyles.imageContainer(!!tweet.content?.value), display: 'flex', justifyContent: 'center' }} role="region" aria-label="Images">
        <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          {imageFiles.slice(0, 4).map((file, index) => (
            <Grid
              item
              xs={imageFiles.length === 1 ? 12 : 6}
              sm={imageFiles.length === 1 ? 12 : 3}
              key={file.fileKey || `img-${index}`}
            >
              <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit" whileHover={{ scale: 1.02 }}>
                <LazyLoadImage
                  src={file.url}
                  alt={`Image ${index + 1}`}
                  effect="blur"
                  style={TweetContentStyles.image(imageFiles.length === 1)}
                  placeholder={
                    <Box sx={{ ...TweetContentStyles.imagePlaceholder, borderRadius: '10px' }}>
                      <CircularProgress size={24} />
                    </Box>
                  }
                  role="img"
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
        {imageFiles.length > 4 && (
          <ViewAllButton
            label={`View all images (${imageFiles.length})`}
            onClick={handleOpenMediaModal}
            style={TweetContentStyles.imageViewAll}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaModal]);

  const renderVideos = useMemo(() => {
    const videoFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('video')) || [];
    if (!videoFiles.length) return null;
    return (
      <Box
        sx={{ ...TweetContentStyles.videoContainer(!!tweet.content?.value || renderImages), display: 'flex', justifyContent: 'center' }}
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
          <ViewAllButton
            label={`View all videos (${videoFiles.length})`}
            onClick={handleOpenMediaModal}
            style={TweetContentStyles.videoViewAll}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaModal, renderImages]);

  const renderAudio = useMemo(() => {
    const audioFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('audio')) || [];
    if (!audioFiles.length) return null;
    return (
      <Box
        sx={{
          ...TweetContentStyles.audioContainer(!!tweet.content?.value || renderImages || renderVideos),
          display: 'flex',
          justifyContent: 'center',
        }}
        role="region"
        aria-label="Audio"
      >
        <AudioPlayer src={audioFiles[0].url} />
        {audioFiles.length > 1 && (
          <ViewAllButton
            label={`View all audio (${audioFiles.length})`}
            onClick={handleOpenMediaModal}
            style={TweetContentStyles.audioViewAll}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaModal, renderImages, renderVideos]);

  const renderOtherFiles = useMemo(() => {
    const otherFiles = tweet.content?.metadata?.files?.filter(
      (f) =>
        !f.contentType?.startsWith('image') &&
        !f.contentType?.startsWith('video') &&
        !f.contentType?.startsWith('audio')
    ) || [];
    if (!otherFiles.length) return null;
    return (
      <Box sx={{ ...TweetContentStyles.otherFilesContainer(!!tweet.content?.value), maxWidth: '100%' }} role="region" aria-label="Files">
        {otherFiles.slice(0, 2).map((file, idx) => (
          <FileItem file={file} index={idx} key={file.fileKey || `other-${idx}`} />
        ))}
        {otherFiles.length > 2 && (
          <ViewAllButton
            label={`View all files (${otherFiles.length})`}
            onClick={handleOpenMediaModal}
            sx={TweetContentStyles.otherFilesViewAll}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaModal]);

  const renderContent = useMemo(() => {
    const hasText = !!tweet.content?.value;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {hasText && (
          <Box>
            <Typography
              sx={TweetContentStyles.contentText(!!renderImages || !!renderVideos || !!renderAudio || !!renderOtherFiles)}
            >
              <Emoji text={previewText + (!isExpanded && remainderText ? '...' : '')} />
            </Typography>
            {remainderText && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Typography
                  sx={TweetContentStyles.contentText(!!renderImages || !!renderVideos || !!renderAudio || !!renderOtherFiles)}
                >
                  <Emoji text={remainderText} />
                </Typography>
              </Collapse>
            )}
            {remainderText && (
              <ViewAllButton
                label={isExpanded ? 'Show less' : 'Read more'}
                onClick={handleToggleExpand}
                style={TweetContentStyles.readMoreButton}
              />
            )}
          </Box>
        )}
        {renderImages}
        {renderVideos}
        {renderAudio}
        {renderOtherFiles}
      </motion.div>
    );
  }, [previewText, remainderText, isExpanded, renderImages, renderVideos, renderAudio, renderOtherFiles, handleToggleExpand]);

  const modalContent = useMemo(() => {
    const files = tweet.content?.metadata?.files || [];
    return (
      <Box sx={{ ...ModalStyles.mediaModalContent, maxHeight: '80vh', overflowY: 'auto' }}>
        {files.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            No media available
          </Typography>
        )}
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
                style={{ ...ModalStyles.modalImage, maxWidth: '100%' }}
                placeholder={
                  <Box sx={{ ...ModalStyles.modalImagePlaceholder, borderRadius: '10px' }}>
                    <CircularProgress size={24} />
                  </Box>
                }
                role="img"
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
              <AudioPlayer src={file.url} />
            ) : (
              <FileItem file={file} index={idx} />
            )}
          </motion.div>
        ))}
      </Box>
    );
  }, [tweet.content?.metadata?.files]);

  const optionsModalContent = useMemo(() => (
    <Box sx={ModalStyles.optionsModalContent}>
      <Typography variant="h6" sx={ModalStyles.optionsModalTitle}>
        Tweet Options
      </Typography>
      <List>
        <ListItem
          button
          onClick={handleEdit}
          style={ModalStyles.optionsModalItem}
          aria-label="Edit tweet"
        >
          <ListItemText primary="Edit Tweet" />
        </ListItem>
        <ListItem
          button
          onClick={handlePin}
          style={ModalStyles.optionsModalItem}
          aria-label={tweet.is_pinned ? 'Unpin tweet' : 'Pin tweet'}
        >
          <ListItemText primary={tweet.is_pinned ? 'Unpin Tweet' : 'Pin Tweet'} />
        </ListItem>
        <ListItem
          button
          onClick={handleDelete}
          sx={{ ...ModalStyles.optionsModalItem, color: 'error.main' }}
          aria-label="Delete tweet"
        >
          <ListItemText primary="Delete" />
        </ListItem>
      </List>
    </Box>
  ), [handleEdit, handlePin, handleDelete, tweet.is_pinned]);

  if (error) {
    return (
      <Paper sx={TweetContentStyles.tweetCard(false, isListView)} role="article">
        <Typography sx={TweetContentStyles.tweetTitle}>Error</Typography>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            {error}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!tweet.tweet_id || !tweet.content) {
    return (
      <Paper sx={TweetContentStyles.tweetCard(false, isListView)} role="article">
        <Typography sx={TweetContentStyles.tweetTitle}>Invalid Tweet</Typography>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            This tweet is missing required data.
          </Typography>
        </Box>
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
          ...TweetContentStyles.tweetCard(tweet.is_pinned, isListView),
          ...TweetContentStyles.tweetHighlight(hovered || isRelated || isParentHighlighted),
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
        {resolvedParentTweetText && (
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
                <Emoji text={resolvedParentTweetText} />
              </Typography>
            </Box>
          </motion.div>
        )}
        {renderContent}
        <Box sx={{ ...TweetContentStyles.statusContainer, justifyContent: 'space-between' }}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Chip
              label={chipLabel}
              color={chipColor}
              size="small"
              aria-label={`Tweet status: ${chipLabel}`}
            />
          </motion.div>
          <Typography variant="caption" sx={TweetContentStyles.tweetAuthorTypography}>
            Author: {tweetAuthor}
          </Typography>
        </Box>
        <Box sx={{ ...TweetContentStyles.actionsContainer, justifyContent: 'space-between' }}>
          <Box sx={TweetContentStyles.actionButtons}>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={() => onLike(tweet.tweet_id, isLiked)}
                aria-label={isLiked ? 'Unlike tweet' : 'Like tweet'}
                style={TweetContentStyles.likeButton}
              >
                <ThumbUpIcon sx={TweetContentStyles.likeIcon(isLiked)} />
              </IconButton>
            </motion.div>
            <Typography
              variant="caption"
              sx={TweetContentStyles.likeCount(isLiked, animate)}
            >
              {tweet.stats?.like_count || 0}
            </Typography>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={() => onReply(tweet)}
                aria-label="Reply to tweet"
                style={TweetContentStyles.replyButton}
              >
                <ChatBubbleOutlineIcon sx={TweetContentStyles.replyIcon} />
              </IconButton>
            </motion.div>
            {hasReplies && (
              <Typography
                variant="caption"
                style={TweetContentStyles.replyCount}
              >
                {replyLabel}
              </Typography>
            )}
          </Box>
          {canEdit && (
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={handleOpenOptionsModal}
                className="tweet-menu"
                aria-label="Tweet options"
                style={TweetContentStyles.menuButton}
              >
                <MoreVertIcon sx={TweetContentStyles.menuIcon} />
              </IconButton>
            </motion.div>
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
            sx={ModalStyles.mediaModalContainer}
            role="dialog"
            aria-labelledby="media-modal-title"
          >
            <IconButton
              onClick={handleCloseMediaModal}
              style={ModalStyles.mediaModalCloseButton}
              aria-label="Close media modal"
            >
              <CloseIcon />
            </IconButton>
            <Typography id="media-modal-title" sx={ModalStyles.mediaModalTitle}>
              All Media
            </Typography>
            {modalContent}
          </Box>
        </Fade>
      </Modal>

      <Modal
        open={openOptionsModal}
        onClose={handleCloseOptionsModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
        aria-labelledby="options-modal-title"
      >
        <Fade in={openOptionsModal}>
          <Box
            sx={ModalStyles.optionsModalContainer}
            role="dialog"
            aria-labelledby="options-modal-title"
          >
            <IconButton
              onClick={handleCloseOptionsModal}
              style={ModalStyles.optionsModalCloseButton}
              aria-label="Close options modal"
            >
              <CloseIcon />
            </IconButton>
            <Typography id="options-modal-title" sx={ModalStyles.optionsModalHiddenTitle}>
              Tweet Options
            </Typography>
            {optionsModalContent}
          </Box>
        </Fade>
      </Modal>
    </motion.div>
  );
};

const arePropsEqual = (prevProps, nextProps) => {
  return (
    isEqual(prevProps.tweet, nextProps.tweet) &&
    isEqual(prevProps.currentUser, nextProps.currentUser) &&
    prevProps.userRole === nextProps.userRole &&
    prevProps.isParentHighlighted === nextProps.isParentHighlighted &&
    prevProps.replyCount === nextProps.replyCount &&
    prevProps.parentTweetText === nextProps.parentTweetText &&
    prevProps.bypassOwnership === nextProps.bypassOwnership &&
    isEqual(prevProps.relatedTweetIds, nextProps.relatedTweetIds) &&
    isEqual(prevProps.availableBoards, nextProps.availableBoards) &&
    prevProps.boardId === nextProps.boardId &&
    prevProps.isListView === nextProps.isListView &&
    prevProps.error === nextProps.error
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
  error: PropTypes.string,
  getParentTweetText: PropTypes.func,
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
  error: null,
  getParentTweetText: null,
};

export default memo(TweetContent, arePropsEqual);