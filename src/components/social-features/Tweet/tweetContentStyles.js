import { alpha } from '@mui/material';

// Constants for reuse
const TWEET_Z_INDEX = 99;
const BASE_SHADOW = '0 1px 6px rgba(0,0,0,0.06)'; // Subtle shadow
const HOVER_SHADOW = '0 3px 10px rgba(0,0,0,0.1)';
const MEDIA_PREVIEW_SIZE = 150; // Smaller for mobile

// Reusable style objects
const baseTypographyStyles = {
  color: 'text.primary',
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 400,
  lineHeight: 1.4,
  letterSpacing: '0.01em',
};

const baseHoverEffect = {
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: HOVER_SHADOW,
  },
  '&:focus': {
    outline: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    outlineOffset: 1,
  },
};

const TweetContentStyles = {
  tweetCard: (isPinned, isListView) => ({
    p: { xs: 1, sm: 1.5 }, // Tighter padding
    mb: 0.5, // Tighter margin
    bgcolor: (theme) =>
      isPinned
        ? `linear-gradient(145deg, ${alpha(theme.palette.warning.light, 0.15)}, ${alpha(
            theme.palette.warning.light,
            0.05
          )})`
        : theme.palette.background.paper,
    borderRadius: '32px', // Consistent corners
    width: { xs: '40vw', sm: isListView ? '90vw' : '260px' }, // 40vw mobile
    maxHeight: { xs: '70vh', sm: 'auto' }, // 70vh mobile
    overflowY: { xs: 'auto', sm: 'visible' }, // Scrollable mobile
    minWidth: { xs: '30vw', sm: '220px' },
    maxWidth: isListView ? { xs: '40vw', sm: '440px' } : { xs: '40vw', sm: '260px' },
    boxShadow: BASE_SHADOW,
    position: 'relative',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.4)}`,
    transition: 'all 0.2s ease-out',
    zIndex: TWEET_Z_INDEX,
    ...baseHoverEffect,
    '&.dragging': {
      opacity: 1,
      boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.02)',
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
    ...baseTypographyStyles,
    color: 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Aligned scale
    fontWeight: 400,
  },
  pinnedIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  pinnedIcon: {
    fontSize: { xs: '1rem', sm: '1.25rem' }, // Proportional
    color: '#FFD700',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  replyToContainer: {
    borderLeft: (theme) => `2px solid ${theme.palette.primary.main}`,
    pl: 0.75,
    mb: 0.5,
    bgcolor: (theme) => alpha(theme.palette.grey[50], 0.95),
    p: 0.5,
    borderRadius: '6px',
    fontStyle: 'italic',
    color: 'text.secondary',
  },
  replyToCaption: {
    ...baseTypographyStyles,
    fontWeight: 500,
    color: 'primary.main',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
  },
  replyToText: {
    ...baseTypographyStyles,
    mt: 0.25,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    color: 'text.secondary',
  },
  contentText: (hasMedia) => ({
    ...baseTypographyStyles,
    mb: hasMedia ? 0.75 : 0,
    fontSize: { xs: '0.875rem', sm: '1rem' }, // Larger for readability
    wordBreak: 'break-word',
  }),
  imageContainer: (hasText) => ({
    position: 'relative',
    mb: hasText ? 0.75 : 0,
    mt: 0.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0.5,
    borderRadius: '6px',
    width: '100%',
  }),
  image: (isSingle) => ({
    width: '100%',
    maxHeight: isSingle ? { xs: '100px', sm: '120px' } : { xs: '50px', sm: '60px' }, // Fit 70vh
    aspectRatio: '16/9',
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '6px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.4)}`,
    opacity: 0.99,
    transition: 'all 0.2s ease-out',
    '&:hover': {
      transform: 'scale(1.01)',
      opacity: 1,
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    },
    '&:focus': {
      outline: (theme) => `1px solid ${theme.palette.primary.main}`,
      outlineOffset: 1,
    },
  }),
  imagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: '100%',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    ...baseTypographyStyles,
  },
  imageViewAll: {
    ...baseTypographyStyles,
    color: 'primary.main',
    cursor: 'pointer',
    mt: 0.5,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 600,
    textAlign: 'right',
    textDecoration: 'underline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
  videoContainer: (hasTextOrImages) => ({
    mb: hasTextOrImages ? 0.75 : 0,
    mt: 0.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }),
  videoInner: {
    position: 'relative',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  video: (duration) => ({
    width: '100%',
    maxHeight: duration && duration < 15 ? '80px' : '160px', // Fit 70vh
    aspectRatio: '16/9',
    borderRadius: '6px',
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    opacity: 0.99,
    transition: 'all 0.2s ease-out',
    '&:hover': {
      transform: 'scale(1.01)',
      opacity: 1,
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
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
    opacity: 0.99,
    transition: 'all 0.2s ease-out',
    '&:hover': {
      transform: 'scale(1.01)',
      opacity: 1,
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    },
  }),
  videoViewAll: {
    ...baseTypographyStyles,
    color: 'primary.main',
    cursor: 'pointer',
    mt: 0.5,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 600,
    textAlign: 'right',
    textDecoration: 'underline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
  audioContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 0.75 : 0,
    mt: 0.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }),
  audioPlayer: {
    width: '100%',
    height: '32px', // Smaller for 70vh
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '6px',
    p: 0.5,
    position: 'relative',
    overflow: 'hidden',
    '& audio': {
      width: '100%',
      height: '100%',
      '&::-webkit-media-controls-panel': {
        backgroundColor: 'transparent',
      },
    },
    '& .audioVisualizer': {
      display: 'none',
    },
  },
  audioViewAll: {
    ...baseTypographyStyles,
    color: 'primary.main',
    cursor: 'pointer',
    mt: 0.5,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 600,
    textAlign: 'right',
    textDecoration: 'underline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
  otherFilesContainer: (hasText) => ({
    mb: hasText ? 0.75 : 0,
    mt: 0.5,
    width: '100%',
    maxWidth: { xs: '40vw', sm: '220px' },
  }),
  otherFileItem: (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    mt: index > 0 ? 0.5 : 0,
    p: 0.5,
    borderRadius: '6px',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
    },
  }),
  otherFileIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1rem', sm: '1.25rem' },
  },
  otherFileLink: {
    ...baseTypographyStyles,
    color: 'primary.main',
    textDecoration: 'none',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 500,
    transition: 'all 0.2s ease-out',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  otherFilesViewAll: {
    ...baseTypographyStyles,
    color: 'primary.main',
    cursor: 'pointer',
    mt: 0.5,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 600,
    textAlign: 'right',
    textDecoration: 'underline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
  readMoreButton: {
    ...baseTypographyStyles,
    color: 'primary.main',
    textTransform: 'none',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    fontWeight: 600,
    textDecoration: 'underline',
    '&:hover': {
      color: 'primary.dark',
    },
  },
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    mt: 0.75,
    justifyContent: 'space-between',
    gap: 0.5,
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.25, sm: '0.5rem' },
  },
  likeButton: {
    p: { xs: 0.25, sm: 0.5 },
    minWidth: 36, // Touch-friendly
    borderRadius: '4px',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
      transform: 'scale(1.1)',
    },
  },
  likeIcon: (isLiked) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '1rem', sm: '1.25rem' },
  }),
  likeCount: (isLiked, animate) => ({
    ...baseTypographyStyles,
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    transform: animate ? 'scale(1.15)' : 'scale(1)',
    ml: 0.25,
    transition: 'transform 0.2s ease-out',
  }),
  replyButton: {
    p: { xs: 0.25, sm: 0.5 },
    minWidth: 36,
    borderRadius: '4px',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
      transform: 'scale(1.1)',
    },
  },
  replyIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1rem', sm: '1.25rem' },
  },
  replyCount: {
    ...baseTypographyStyles,
    color: 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    ml: 0.25,
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 0.5,
    mt: 0.75,
    flexWrap: 'wrap',
  },
  menuButton: {
    p: { xs: 0.25, sm: 0.5 },
    minWidth: 36,
    borderRadius: '4px',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      transform: 'scale(1.1)',
    },
  },
  menuIcon: {
    color: 'text.secondary',
    fontSize: { xs: '1rem', sm: '1.25rem' },
  },
  tweetHighlight: (isHighlighted) => ({
    zIndex: isHighlighted ? TWEET_Z_INDEX + 1 : TWEET_Z_INDEX,
    boxShadow: isHighlighted ? '0 4px 12px rgba(0,0,0,0.1)' : BASE_SHADOW,
    background: isHighlighted
      ? 'linear-gradient(145deg, #FFFFFF, #F0F2F5)'
      : (theme) => theme.palette.background.paper,
    transform: isHighlighted ? 'scale(1.03) translateY(-1px)' : 'none',
    transition: 'all 0.2s ease-out',
    borderColor: isHighlighted
      ? (theme) => theme.palette.primary.main
      : (theme) => alpha(theme.palette.grey[200], 0.4),
  }),
  draggableContainer: (isDraggable, dragging, hovered, isPinned) => ({
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    cursor: isDraggable ? (dragging ? 'grabbing' : 'grab') : 'default',
    zIndex: dragging || hovered ? TWEET_Z_INDEX + 1 : isPinned ? TWEET_Z_INDEX + 2 : TWEET_Z_INDEX,
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out, z-index 0.2s ease-out',
    touchAction: isDraggable ? 'none' : 'auto',
    '&:focus': {
      outline: isDraggable ? (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
      outlineOffset: 1,
    },
  }),
};

export default TweetContentStyles;