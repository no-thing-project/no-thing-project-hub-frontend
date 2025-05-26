import { alpha } from '@mui/material';

// Constants for reuse
const TWEET_Z_INDEX = 99; // TweetContent
const BASE_SHADOW = '0 4px 16px rgba(0,0,0,0.12)';
const HOVER_SHADOW = '0 8px 24px rgba(0,0,0,0.18)';
const MEDIA_PREVIEW_SIZE = 220; // Unified size for all circular previews (video, audio, recording)

// Reusable style objects
const baseTypographyStyles = {
  color: 'text.primary',
  fontWeight: 400,
  lineHeight: 1.6,
};

const baseHoverEffect = {
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: HOVER_SHADOW,
  },
  '&:focus': {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
};

const TweetContentStyles = {
  tweetCard: (isPinned, isListView) => ({
    p: { xs: 2.5, sm: 3 },
    mb: 1.5,
    bgcolor: (theme) =>
      isPinned ? alpha(theme.palette.warning.light, 0.25) : theme.palette.background.paper,
    borderRadius: 3,
    minWidth: { xs: '20vw', sm: '260px', md: '280px' },
    maxWidth: isListView ? { xs: '90vw', sm: '480px' } : { xs: '50vw', sm: '300px' },
    boxShadow: BASE_SHADOW,
    position: 'relative',
    opacity: 0.97,
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    transition: 'all 0.3s ease',
    zIndex: TWEET_Z_INDEX,
    ...baseHoverEffect,
    '&.dragging': {
      opacity: 1,
      boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
      transform: 'scale(1.04)',
    },
  }),
  tweetPaper: {
    position: 'relative',
    overflow: 'visible',
  },
  tweetTitle: {
    display: 'none',
  },
  tweetAuthorTypography: {
    color: 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
  },
  pinnedIconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  pinnedIcon: {
    fontSize: '1.1rem',
    color: '#FFD700',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: '#FFD700',
      transform: 'scale(1.1)',
    },
  },
  replyToContainer: {
    borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
    pl: 1.5,
    mb: 1.5,
    bgcolor: (theme) => alpha(theme.palette.grey[50], 0.85),
    p: 1.25,
    borderRadius: 3,
    fontStyle: 'italic',
    color: 'text.secondary',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  replyToCaption: {
    fontWeight: 600,
    color: 'primary.main',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  replyToText: {
    mt: 0.75,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    lineHeight: 1.5,
  },
  contentText: (hasMedia) => ({
    ...baseTypographyStyles,
    mb: hasMedia ? 2 : 0,
    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
    wordBreak: 'break-word',
    letterSpacing: '0.01em',
  }),
  imageContainer: (hasText) => ({
    position: 'relative',
    mb: hasText ? 2 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
    borderRadius: 1,
    width: '100%',
  }),
  image: (isSingle) => ({
    width: '100%',
    height: isSingle ? { xs: '140px', sm: '160px' } : { xs: '70px', sm: '80px' },
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '15px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    opacity: 0.97,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      opacity: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:focus': {
      outline: (theme) => `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
      opacity: 1,
    },
  }),
  imagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: '100%',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
    fontSize: { xs: '0.8rem', sm: '0.85rem' },
  },
  imageViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
    '&:focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
  videoContainer: (hasTextOrImages) => ({
    mb: hasTextOrImages ? 2 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }),
  videoInner: {
    position: 'relative',
    borderRadius: 3,
    overflow: 'hidden',
  },
  video: (duration) => ({
    width: '100%',
    height: duration && duration < 15 ? '120px' : '200px',
    borderRadius: 8,
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    opacity: 0.97,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      opacity: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  }),
  circleVideoContainer: {
    position: 'relative',
    borderRadius: '50%',
    overflow: 'hidden',
  },
  circleVideo: (duration) => ({
    width: MEDIA_PREVIEW_SIZE,
    height: MEDIA_PREVIEW_SIZE,
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    opacity: 0.97,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      opacity: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  }),
  videoViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  audioContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }),
  audioPlayer: {
    width: '100%',
    height: '48px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '12px',
    p: 1.25,
    position: 'relative',
    overflow: 'hidden',
    '& audio': {
      width: '100%',
      height: '100%',
      '&::-webkit-media-controls-panel': {
        backgroundColor: 'transparent',
      },
      '&:hover + .audioVisualizer, &.playing + .audioVisualizer': {
        opacity: 1,
      },
    },
    '& .audioVisualizer': {
      position: 'absolute',
      top: 0,
      left: '0 !important',
      right: '0 !important',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '0 8px',
      opacity: 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none',
    },
  },
  audioVisualizerBar: (index) => ({
    width: '4px',
    height: '100%',
    bgcolor: 'primary.main',
    borderRadius: '2px',
    animation: `pulse${index} 0.7s ease-in-out infinite alternate`,
    animationDelay: `${index * 0.05}s`,
    [`@keyframes pulse${index}`]: {
      '0%': { transform: 'scaleY(0.3)' },
      '100%': { transform: 'scaleY(1)' },
    },
  }),
  audioViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  otherFilesContainer: (hasText, isListView) => ({
    mb: hasText ? 2 : 0,
    mt: 1.5,
    width: '100%',
    maxWidth: { xs: '47.5vw', sm: '260px' },
  }),
  otherFileItem: (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    mt: index > 0 ? 1.5 : 0,
    p: 1.25,
    borderRadius: 3,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  }),
  otherFileIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1.25rem', sm: '1.25rem' },
  },
  otherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  otherFilesViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  readMoreButton: {
    color: 'primary.main',
    textTransform: 'none',
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    mt: 2,
    justifyContent: 'space-between',
    gap: 1.5,
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.75, sm: 1.25 },
  },
  likeButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.2),
      transform: 'scale(1.15)',
    },
    '&:focus': {
      outline: 'none',
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
    },
  },
  likeIcon: (isLiked) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '1.15rem', sm: '1.25rem' },
  }),
  likeCount: (isLiked, animate) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    transform: animate ? 'scale(1.25)' : 'scale(1)',
    ml: 0.75,
    transition: 'transform 0.2s ease',
  }),
  replyButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.2),
      transform: 'scale(1.15)',
    },
    '&:focus': {
      outline: 'none',
      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
    },
  },
  replyIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1.15rem', sm: '1.25rem' },
  },
  replyCount: {
    color: 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.8rem' },
    ml: 0.75,
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    mt: 2,
  },
  menuButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      transform: 'scale(1.15)',
    },
    '&:focus': {
      outline: 'none',
      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.2),
    },
  },
  menuIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1.15rem', sm: '1.25rem' },
  },
  tweetHighlight: (isHighlighted) => ({
    zIndex: isHighlighted ? TWEET_Z_INDEX + 1 : TWEET_Z_INDEX,
    boxShadow: isHighlighted ? '0 12px 36px rgba(0,0,1,1)' : BASE_SHADOW,
    background: isHighlighted
      ? 'linear-gradient(145deg, #FFFFFF, #F9FBFD)'
      : (theme) => theme.palette.background.paper,
    transform: isHighlighted ? 'scale(1.1) translateY(-4px)' : 'none',
    transition: 'all 0.3s ease',
    borderColor: isHighlighted
      ? (theme) => theme.palette.primary.main
      : (theme) => alpha(theme.palette.grey[200], 0.6),
  }),
  draggableContainer: (isDraggable, dragging, hovered, isPinned) => ({
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    cursor: isDraggable ? (dragging ? 'grabbing' : 'grab') : 'default',
    zIndex: dragging || hovered ? TWEET_Z_INDEX + 1 : isPinned ? TWEET_Z_INDEX + 2 : TWEET_Z_INDEX,
    transition: 'opacity 0.2s ease, transform 0.2s ease, z-index 0.2s ease',
    touchAction: isDraggable ? 'none' : 'auto',
    '&:focus': {
      outline: isDraggable ? (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
      outlineOffset: 2,
    },
  }),
};

export default TweetContentStyles;