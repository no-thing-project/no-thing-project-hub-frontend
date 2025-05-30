import React, { useState, useCallback, useMemo, memo, useEffect, useDeferredValue } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Fade,
  Link,
  Chip,
  Collapse,
  CircularProgress,
  List,
  ListItemButton,
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
import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns';
import TweetContentStyles from './TweetContentStyles';
import ModalStyles from './ModalStyles';
import LinkPreview from './LinkPreview';

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

const ViewAllButton = ({ label, onClick, sx, disabled }) => (
  <motion.div whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }}>
    <Typography
      variant="caption"
      sx={{ ...sx, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1 }}
      onClick={disabled ? undefined : onClick}
      onTouchStart={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyPress={(e) => !disabled && e.key === 'Enter' && onClick(e)}
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
  disabled: PropTypes.bool,
};

ViewAllButton.defaultProps = {
  disabled: false,
};

const CircularVideoPlayer = memo(({ src, duration, ariaLabel }) => (
  <motion.div variants={mediaVariants} initial="initial" animate="animate" exit="exit">
    <Box sx={TweetContentStyles.mediaWrapper} role="region" aria-label={ariaLabel}>
      <Box sx={{ ...TweetContentStyles.circleVideoContainer, display: 'flex', justifyContent: 'center' }}>
        <video
          src={src}
          controls
          playsInline
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
          playsInline
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
    <audio src={src} controls playsInline sx={{ width: '100%' }} preload="metadata" />
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
  error = null,
  getParentTweetText,
  onModalStateChange,
}) => {
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openOptionsDialog, setOpenOptionsDialog] = useState(false);
  const [openMediaDialog, setOpenMediaDialog] = useState(false);
  const [openLinkModal, setOpenLinkModal] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [transformedText, setTransformedText] = useState(tweet.content?.value || '');
  const deferredContent = useDeferredValue(tweet.content?.value || '');

  useEffect(() => {
    onModalStateChange?.(tweet.tweet_id, openOptionsDialog || openMediaDialog || !!openLinkModal);
    return () => onModalStateChange?.(tweet.tweet_id, false);
  }, [openOptionsDialog, openMediaDialog, openLinkModal, tweet.tweet_id, onModalStateChange]);

  useEffect(() => {
    if (!tweet.created_at) return;

    const createdAt = parseISO(tweet.created_at);
    if (!isValid(createdAt)) return;

    const updateTimestamp = () => {
      const now = new Date();
      const diffInSeconds = (now - createdAt) / 1000;

      if (diffInSeconds < 7 * 24 * 60 * 60) {
        setTimestamp(formatDistanceToNow(createdAt, { addSuffix: true }));
      } else {
        setTimestamp(format(createdAt, 'MMM d'));
      }
    };

    updateTimestamp();

    if ((new Date() - createdAt) / 1000 < 60 * 60) {
      const interval = setInterval(updateTimestamp, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [tweet.created_at]);

  const tweetAuthor = tweet.username || tweet.user?.username || 'Anonymous';
  const isLiked = tweet.liked_by?.some((u) => u.anonymous_id === currentUser?.anonymous_id) ?? false;
  const canEdit = useMemo(
    () =>
      bypassOwnership ||
      ['moderator', 'admin'].includes(userRole) ||
      tweet.anonymous_id === currentUser?.anonymous_id ||
      tweet.user_id === currentUser?.anonymous_id ||
      (tweet.username &&
        currentUser?.username &&
        tweet.username.toLowerCase() === currentUser.username.toLowerCase()),
    [bypassOwnership, userRole, tweet, currentUser]
  );
  const isRelated = relatedTweetIds.includes(tweet.tweet_id);
  const hasReplies = replyCount > 0 || tweet.child_tweet_ids?.length > 0;
  const replyLabel = hasReplies
    ? `${replyCount || tweet.child_tweet_ids?.length}`
    : '';
  const rawStatus = tweet.status || 'approved';
  const chipColor = statusColorMap[rawStatus] || 'default';
  const chipLabel = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
  const resolvedParentTweetText = tweet.parent_tweet_id
    ? parentTweetText || getParentTweetText?.(tweet.parent_tweet_id) || 'Parent tweet not found'
    : null;
  const parentExcerpt = resolvedParentTweetText
    ? resolvedParentTweetText.split(/\s+/).slice(0, 10).join(' ') + '...'
    : null;

  useEffect(() => {
    if (tweet.stats?.like_count !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tweet.stats?.like_count]);

  const handleMouseEnter = useCallback(() => {
    if (openOptionsDialog || openMediaDialog || openLinkModal) return;
    setHovered(true);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(tweet.tweet_id);
    }
  }, [onReplyHover, tweet.tweet_id, tweet.parent_tweet_id, tweet.child_tweet_ids, openOptionsDialog, openMediaDialog, openLinkModal]);

  const handleMouseLeave = useCallback(() => {
    if (openOptionsDialog || openMediaDialog || openLinkModal) return;
    setHovered(false);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(null);
    }
  }, [onReplyHover, tweet.parent_tweet_id, tweet.child_tweet_ids, openOptionsDialog, openMediaDialog, openLinkModal]);

  const handleOpenOptionsDialog = useCallback(() => {
    setOpenOptionsDialog(true);
  }, []);

  const handleCloseOptionsDialog = useCallback(() => {
    setOpenOptionsDialog(false);
  }, []);

  const handleOpenMediaDialog = useCallback(() => {
    setOpenMediaDialog(true);
  }, []);

  const handleCloseMediaDialog = useCallback(() => {
    setOpenMediaDialog(false);
  }, []);

  const handleOpenLinkModal = useCallback((url, type) => {
    setOpenLinkModal({ url: url.url, type });
  }, []);

  const handleCloseLinkModal = useCallback(() => {
    setOpenLinkModal(null);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit(tweet);
    handleCloseOptionsDialog();
  }, [onEdit, tweet, handleCloseOptionsDialog]);

  const handlePin = useCallback(() => {
    onPinToggle(tweet);
    handleCloseOptionsDialog();
  }, [onPinToggle, tweet, handleCloseOptionsDialog]);

  const handleDelete = useCallback(() => {
    onDelete(tweet.tweet_id);
    handleCloseOptionsDialog();
  }, [onDelete, tweet.tweet_id, handleCloseOptionsDialog]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const { previewText, remainderText } = useMemo(() => {
    const text = transformedText || '';
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
  }, [transformedText]);

  const fullDate = useMemo(() => {
    if (!tweet.created_at) return '';
    const createdAt = parseISO(tweet.created_at);
    return isValid(createdAt) ? format(createdAt, 'PPPPpp') : '';
  }, [tweet.created_at]);

  const isModalOpen = openOptionsDialog || openMediaDialog || openLinkModal;

  const renderImages = useMemo(() => {
    const imageFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('image')) || [];
    if (!imageFiles.length) return null;
    return (
      <Box sx={{ ...TweetContentStyles.imageContainer(!!transformedText), display: 'flex', justifyContent: 'center' }} role="region" aria-label="Images">
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
            onClick={handleOpenMediaDialog}
            sx={TweetContentStyles.imageViewAll}
            disabled={isModalOpen}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaDialog, isModalOpen]);

  const renderVideos = useMemo(() => {
    const videoFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('video')) || [];
    if (!videoFiles.length) return null;
    return (
      <Box
        sx={{ ...TweetContentStyles.videoContainer(!!transformedText || renderImages), display: 'flex', justifyContent: 'center' }}
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
            onClick={handleOpenMediaDialog}
            sx={TweetContentStyles.videoViewAll}
            disabled={isModalOpen}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaDialog, renderImages, isModalOpen]);

  const renderAudio = useMemo(() => {
    const audioFiles = tweet.content?.metadata?.files?.filter((f) => f.contentType?.startsWith('audio')) || [];
    if (!audioFiles.length) return null;
    return (
      <Box
        sx={{
          ...TweetContentStyles.audioContainer(!!transformedText || renderImages || renderVideos),
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
            onClick={handleOpenMediaDialog}
            sx={TweetContentStyles.audioViewAll}
            disabled={isModalOpen}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaDialog, renderImages, renderVideos, isModalOpen]);

  const renderOtherFiles = useMemo(() => {
    const otherFiles = tweet.content?.metadata?.files?.filter(
      (f) =>
        !f.contentType?.startsWith('image') &&
        !f.contentType?.startsWith('video') &&
        !f.contentType?.startsWith('audio')
    ) || [];
    if (!otherFiles.length) return null;
    return (
      <Box sx={{ ...TweetContentStyles.otherFilesContainer(!!transformedText), maxWidth: '100%' }} role="region" aria-label="Files">
        {otherFiles.slice(0, 2).map((file, idx) => (
          <FileItem file={file} index={idx} key={file.fileKey || `other-${idx}`} />
        ))}
        {otherFiles.length > 2 && (
          <ViewAllButton
            label={`View all files (${otherFiles.length})`}
            onClick={handleOpenMediaDialog}
            sx={TweetContentStyles.otherFilesViewAll}
            disabled={isModalOpen}
          />
        )}
      </Box>
    );
  }, [tweet.content?.metadata?.files, handleOpenMediaDialog, isModalOpen]);

  const renderContent = useMemo(() => {
    const hasText = !!transformedText;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        {hasText && (
          <Box>
            <Typography
              sx={TweetContentStyles.contentText(
                !!renderImages || !!renderVideos || !!renderAudio || !!renderOtherFiles
              )}
            >
              <Emoji text={previewText + (!isExpanded && remainderText ? '...' : '')} />
            </Typography>
            {remainderText && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Typography
                  sx={TweetContentStyles.contentText(
                    !!renderImages || !!renderVideos || !!renderAudio || !!renderOtherFiles
                  )}
                >
                  <Emoji text={remainderText} />
                </Typography>
              </Collapse>
            )}
            {remainderText && (
              <ViewAllButton
                label={isExpanded ? 'Show less' : 'Read more'}
                onClick={handleToggleExpand}
                sx={TweetContentStyles.readMoreButton}
                disabled={isModalOpen}
              />
            )}
          </Box>
        )}
        {renderImages}
        {renderVideos}
        {renderAudio}
        {renderOtherFiles}
        <LinkPreview
          content={deferredContent}
          onTextTransform={setTransformedText}
          onPlayClick={handleOpenLinkModal}
        />
      </motion.div>
    );
  }, [
    transformedText,
    previewText,
    remainderText,
    isExpanded,
    renderImages,
    renderVideos,
    renderAudio,
    renderOtherFiles,
    handleToggleExpand,
    deferredContent,
    handleOpenLinkModal,
    isModalOpen,
  ]);

  const mediaDialogContent = useMemo(() => {
    const files = tweet.content?.metadata?.files || [];
    return (
      <DialogContent sx={ModalStyles.mediaDialogContent}>
        {files.length === 0 && (
          <Typography variant="body2" sx={{ color: 'primary.main', fontStyle: 'italic', fontSize: { xs: '0.8rem', sm: '0.875rem' }, m: 0 }}>
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
      </DialogContent>
    );
  }, [tweet.content?.metadata?.files]);

  const optionsDialogContent = useMemo(() => (
    <DialogContent sx={ModalStyles.optionsDialogContent}>
      <List>
        <ListItemButton
          onClick={handleEdit}
          onTouchStart={handleEdit}
          sx={ModalStyles.optionsDialogItem}
          aria-label="Edit tweet"
        >
          <ListItemText primary="Edit Tweet" />
        </ListItemButton>
        <ListItemButton
          onClick={handlePin}
          onTouchStart={handlePin}
          sx={ModalStyles.optionsDialogItem}
          aria-label={tweet.is_pinned ? 'Unpin tweet' : 'Pin tweet'}
        >
          <ListItemText primary={tweet.is_pinned ? 'Unpin Tweet' : 'Pin Tweet'} />
        </ListItemButton>
        <ListItemButton
          onClick={handleDelete}
          onTouchStart={handleDelete}
          sx={{ ...ModalStyles.optionsDialogItem, color: 'error.main' }}
          aria-label="Delete tweet"
        >
          <ListItemText primary="Delete" />
        </ListItemButton>
      </List>
    </DialogContent>
  ), [handleEdit, handlePin, handleDelete, tweet.is_pinned]);

  const linkModalContent = useMemo(() => {
    if (!openLinkModal) return null;
    return (
      <Dialog
        open={!!openLinkModal}
        onClose={handleCloseLinkModal}
        maxWidth="xs"
        fullWidth
        fullScreen={window.innerWidth < 600}
        TransitionComponent={Fade}
        transitionDuration={500}
        aria-labelledby="link-modal-title"
        aria-describedby="link-modal-description"
        PaperProps={{
          sx: {
            ...ModalStyles.optionsDialogContainer,
            zIndex: 1101,
            maxHeight: { xs: '90vh', sm: 'auto' },
            overflowY: { xs: 'auto', sm: 'visible' },
          },
          onClick: (e) => e.stopPropagation(),
          onMouseDown: (e) => e.stopPropagation(),
          onTouchStart: (e) => e.stopPropagation(),
        }}
      >
        <DialogTitle id="link-modal-title" sx={ModalStyles.optionsDialogTitle}>
          View Content
        </DialogTitle>
        <DialogContent sx={ModalStyles.optionsDialogContent}>
          <Typography id="link-modal-description" variant="body1" gutterBottom>
            This content cannot be embedded directly. Visit the link below to view it:
          </Typography>
          <Link
            href={openLinkModal.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ wordBreak: 'break-all', fontSize: { xs: '0.9rem', sm: '1rem' } }}
            aria-label={`Open ${openLinkModal.type} content in a new tab`}
          >
            {openLinkModal.url}
          </Link>
        </DialogContent>
        <DialogActions sx={ModalStyles.dialogActions}>
          <IconButton
            onClick={handleCloseLinkModal}
            onTouchStart={handleCloseLinkModal}
            sx={ModalStyles.dialogCloseButton}
            aria-label="Close link modal"
          >
            <CloseIcon />
          </IconButton>
        </DialogActions>
      </Dialog>
    );
  }, [openLinkModal, handleCloseLinkModal]);

  if (error) {
    return (
      <Paper sx={TweetContentStyles.tweetCard(false, isListView)} role="article">
        <Typography sx={TweetContentStyles.tweetTitle}>Error</Typography>
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
          <Typography variant="body2" color="error" sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
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
        {parentExcerpt && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box component="blockquote" sx={{ borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, m: 0, mb: 1 }}>
              <Typography variant="caption" sx={TweetContentStyles.replyToCaption}>
                Replying to:
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.main', fontStyle: 'italic', fontSize: { xs: '0.8rem', sm: '0.875rem' }, m: 0 }}>
                {parentExcerpt}
              </Typography>
            </Box>
          </motion.div>
        )}
        {renderContent}
        <Box sx={{ ...TweetContentStyles.statusContainer, justifyContent: 'space-between', alignItems: 'center' }}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Chip
              label={chipLabel}
              color={chipColor}
              size="small"
              aria-label={`Tweet status: ${chipLabel}`}
            />
          </motion.div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {timestamp && (
              <Typography
                variant="caption"
                component="time"
                dateTime={tweet.created_at}
                sx={TweetContentStyles.tweetAuthorTypography}
                aria-label={`Posted on ${fullDate}`}
              >
                {timestamp}
              </Typography>
            )}
            <Typography variant="caption" sx={TweetContentStyles.tweetAuthorTypography}>
              Author: {tweetAuthor}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ ...TweetContentStyles.actionsContainer, justifyContent: 'space-between' }}>
          <Box sx={TweetContentStyles.actionButtons}>
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={() => onLike(tweet.tweet_id, isLiked)}
                onTouchStart={() => onLike(tweet.tweet_id, isLiked)}
                aria-label={isLiked ? 'Unlike tweet' : 'Like tweet'}
                sx={{ ...TweetContentStyles.likeButton, minWidth: 36, p: 0.5 }}
                disabled={isModalOpen}
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
                onTouchStart={() => onReply(tweet)}
                aria-label="Reply to tweet"
                sx={{ ...TweetContentStyles.replyButton, minWidth: 36, p: 0.5 }}
                disabled={isModalOpen}
              >
                <ChatBubbleOutlineIcon sx={TweetContentStyles.replyIcon} />
              </IconButton>
            </motion.div>
            {hasReplies && (
              <Typography
                variant="caption"
                sx={TweetContentStyles.replyCount}
              >
                {replyLabel}
              </Typography>
            )}
          </Box>
          {canEdit && (
            <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                size="medium"
                onClick={handleOpenOptionsDialog}
                onTouchStart={handleOpenOptionsDialog}
                className="tweet-menu"
                aria-label="Tweet options"
                sx={{ ...TweetContentStyles.menuButton, minWidth: 36, p: 0.5 }}
                disabled={isModalOpen}
              >
                <MoreVertIcon sx={TweetContentStyles.menuIcon} />
              </IconButton>
            </motion.div>
          )}
        </Box>
      </Paper>

      <Dialog
        open={openMediaDialog}
        onClose={handleCloseMediaDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={window.innerWidth < 600}
        TransitionComponent={Fade}
        transitionDuration={500}
        aria-labelledby="media-dialog-title"
        aria-describedby="media-dialog-description"
        PaperProps={{
          sx: {
            ...ModalStyles.mediaDialogContainer,
            zIndex: 1101,
            maxHeight: { xs: '90vh', sm: 'auto' },
            overflowY: { xs: 'auto', sm: 'visible' },
          },
          onClick: (e) => e.stopPropagation(),
          onMouseDown: (e) => e.stopPropagation(),
          onTouchStart: (e) => e.stopPropagation(),
        }}
      >
        <DialogTitle id="media-dialog-title" sx={ModalStyles.mediaDialogTitle}>
          All Media
        </DialogTitle>
        <DialogContent sx={ModalStyles.mediaDialogContent} dividers>
          <Typography id="media-dialog-description" sx={{ display: 'none' }}>
            View all media files attached to the tweet.
          </Typography>
          {mediaDialogContent}
        </DialogContent>
        <DialogActions sx={ModalStyles.dialogActions}>
          <IconButton
            onClick={handleCloseMediaDialog}
            onTouchStart={handleCloseMediaDialog}
            sx={ModalStyles.dialogCloseButton}
            aria-label="Close media dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openOptionsDialog}
        onClose={handleCloseOptionsDialog}
        maxWidth="xs"
        fullWidth
        fullScreen={window.innerWidth < 600}
        TransitionComponent={Fade}
        transitionDuration={500}
        aria-labelledby="options-dialog-title"
        aria-describedby="options-dialog-description"
        PaperProps={{
          sx: {
            ...ModalStyles.optionsDialogContainer,
            zIndex: 1101,
            maxHeight: { xs: '90vh', sm: 'auto' },
            overflowY: { xs: 'auto', sm: 'visible' },
          },
          onClick: (e) => e.stopPropagation(),
          onMouseDown: (e) => e.stopPropagation(),
          onTouchStart: (e) => e.stopPropagation(),
        }}
      >
        <DialogTitle id="options-dialog-title" sx={ModalStyles.optionsDialogTitle}>
          Tweet Options
        </DialogTitle>
        <DialogContent sx={ModalStyles.optionsDialogContent} dividers>
          <Typography id="options-dialog-description" sx={{ display: 'none' }}>
            Select an option to edit, pin, or delete the tweet.
          </Typography>
          {optionsDialogContent}
        </DialogContent>
        <DialogActions sx={ModalStyles.dialogActions}>
          <IconButton
            onClick={handleCloseOptionsDialog}
            onTouchStart={handleCloseOptionsDialog}
            sx={ModalStyles.dialogCloseButton}
            aria-label="Close options dialog"
          >
            <CloseIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      {linkModalContent}
    </motion.div>
  );
};

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.tweet.tweet_id === nextProps.tweet.tweet_id &&
    prevProps.tweet.content?.value === nextProps.tweet.content?.value &&
    prevProps.tweet.stats?.like_count === nextProps.tweet.stats?.like_count &&
    prevProps.tweet.is_pinned === nextProps.tweet.is_pinned &&
    prevProps.tweet.status === nextProps.tweet.status &&
    prevProps.tweet.liked_by?.length === nextProps.tweet.liked_by?.length &&
    prevProps.tweet.content?.metadata?.files?.length === nextProps.tweet.content?.metadata?.files?.length &&
    prevProps.tweet.created_at === nextProps.tweet.created_at &&
    prevProps.currentUser.anonymous_id === nextProps.currentUser.anonymous_id &&
    prevProps.currentUser.username === nextProps.currentUser.username &&
    prevProps.userRole === nextProps.userRole &&
    prevProps.isParentHighlighted === nextProps.isParentHighlighted &&
    prevProps.replyCount === nextProps.replyCount &&
    prevProps.parentTweetText === nextProps.parentTweetText &&
    prevProps.bypassOwnership === nextProps.bypassOwnership &&
    prevProps.relatedTweetIds.length === nextProps.relatedTweetIds.length &&
    prevProps.relatedTweetIds.every((id, i) => id === nextProps.relatedTweetIds[i]) &&
    prevProps.availableBoards.length === nextProps.availableBoards.length &&
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
  onModalStateChange: PropTypes.func,
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
  onModalStateChange: null,
};

export default memo(TweetContent, arePropsEqual);