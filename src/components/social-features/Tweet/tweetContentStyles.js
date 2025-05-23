import { alpha } from '@mui/material';

// Constants for reuse
const MAX_TWEET_LENGTH = 1000;
const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 400;
const BOARD_SIZE = 10000;

// Reusable utility functions for dynamic styles
const dynamicCharCountColor = (isError) => ({
  color: isError ? 'error.main' : 'text.secondary',
});

const dynamicMediaButtonColor = (isActive) => ({
  color: isActive ? 'primary.main' : 'text.secondary',
  bgcolor: isActive
    ? (theme) => alpha(theme.palette.primary.main, 0.1)
    : (theme) => alpha(theme.palette.grey[200], 0.5),
  '&:hover': {
    bgcolor: isActive
      ? (theme) => alpha(theme.palette.primary.main, 0.2)
      : (theme) => alpha(theme.palette.grey[300], 0.7),
  },
});

const TweetContentStyles = {
  // ===============================
  // TweetPopup Styles
  // ===============================
  popupModal: {
    '& .MuiDialog-paper': {
      position: 'absolute',
      minWidth: { xs: '280px', sm: POPUP_WIDTH },
      maxWidth: { xs: '90vw', sm: '400px' },
      bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
      backdropFilter: 'blur(8px)',
      borderRadius: 2,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      },
    },
    '& .MuiBackdrop-root': {
      backgroundColor: 'transparent',
    },
  },
  popupTitle: {
    display: 'none', // Hidden for accessibility
  },
  popupTextField: {
    '& .MuiInputBase-root': {
      borderRadius: '24px',
      padding: '10px 16px',
      bgcolor: (theme) => theme.palette.grey[100],
      transition: 'all 0.2s ease',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme) => theme.palette.grey[300],
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  },
  popupCharCount: (isError) => ({
    alignSelf: 'flex-end',
    fontSize: '0.75rem',
    ...dynamicCharCountColor(isError),
  }),
  popupFilePreviewContainer: {
    mt: 1,
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: 2,
    p: 1,
    transition: 'background-color 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[200] },
  },
  popupPreviewMedia: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid',
    borderColor: (theme) => theme.palette.grey[300],
    transition: 'transform 0.2s ease',
    '&:hover': { transform: 'scale(1.02)' },
  },
  popupCirclePreviewMedia: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '1px solid',
    borderColor: (theme) => theme.palette.grey[300],
    backgroundColor: 'black',
    transition: 'transform 0.2s ease',
    '&:hover': { transform: 'scale(1.02)' },
  },
  popupPreviewPlaceholder: {
    width: '100%',
    height: '80px',
    bgcolor: (theme) => theme.palette.grey[200],
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    color: 'text.secondary',
  },
  popupDeleteFileButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    bgcolor: (theme) => theme.palette.error.main,
    color: 'white',
    transition: 'background-color 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.error.dark },
    p: 0.5,
  },
  popupActionButton: {
    borderRadius: '24px',
    textTransform: 'none',
    px: 3,
    py: 1,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.02)' },
  },
  popupCancelButton: {
    borderRadius: '24px',
    textTransform: 'none',
    px: 3,
    py: 1,
    bgcolor: (theme) => theme.palette.grey[300],
    color: 'text.primary',
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[400], transform: 'scale(1.02)' },
  },
  popupInputBar: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '24px',
    p: 1,
    mt: 1,
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
  },
  popupMediaButton: (isActive) => ({
    p: 1.5,
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    ...dynamicMediaButtonColor(isActive),
    '&:hover': { transform: 'scale(1.1)' },
  }),
  popupRecordingContainer: {
    mt: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  popupRecordingChip: {
    bgcolor: (theme) => theme.palette.error.main,
    color: 'white',
    fontWeight: 500,
    borderRadius: '16px',
    px: 2,
    py: 0.5,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { transform: 'scale(0.95)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(0.95)' },
    },
  },
  popupVideoPreviewContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mt: 1,
    animation: 'fadeIn 0.3s ease-in',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
  },
  popupLivePreview: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    border: '2px solid',
    borderColor: (theme) => theme.palette.grey[300],
    bgcolor: 'black',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  },
  popupAudioPreviewContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mt: 1,
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    bgcolor: (theme) => theme.palette.grey[900],
    border: '2px solid',
    borderColor: (theme) => theme.palette.grey[300],
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s ease-in',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
  },
  popupAudioVisualizer: {
    width: '80%',
    height: '60%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
  },
  popupVisualizerBar: (index) => ({
    width: '4px',
    height: '100%',
    bgcolor: 'primary.main',
    borderRadius: '2px',
    animation: `pulse${index} 0.7s ease-in-out infinite alternate`,
    animationDelay: `${index * 0.05}s`,
    [`@keyframes pulse${index}`]: {
      '0%': { transform: 'scaleY(0.2)' },
      '100%': { transform: 'scaleY(1)' },
    },
  }),
  popupAudioPlayer: {
    width: '100%',
    height: '48px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '10px',
    p: 1,
    '& audio': {
      width: '100%',
      height: '100%',
      '&::-webkit-media-controls-panel': {
        backgroundColor: 'transparent',
      },
    },
  },
  popupProgressContainer: {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
  },

  // ===============================
  // TweetContent Styles
  // ===============================
  tweetCard: (isPinned, isListView) => ({
    p: 4,
    mb: 1,
    bgcolor: (theme) =>
      isPinned ? alpha(theme.palette.warning.light, 0.25) : theme.palette.background.paper,
    borderRadius: 3,
    minWidth: { xs: '60vw', sm: '360px' },
    maxWidth: isListView ? { xs: '90vw', sm: '900px' } : { xs: '90vw', sm: '360px' },
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    position: 'relative',
    opacity: 0.97,
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      bgcolor: (theme) => alpha(theme.palette.grey[50], 0.9),
      opacity: 1,
    },
    '&.dragging': {
      opacity: 1,
      boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
      transform: 'scale(1.04)',
    },
    '&:focus-within': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
      opacity: 1,
    },
  }),
  tweetTitle: {
    display: 'none',
  },
  pinnedIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  pinnedIcon: {
    fontSize: '1.1rem',
    color: '#FFD700',
    '&:hover': {
      color: '#FFC107',
      transform: 'scale(1.15)',
    },
  },
  replyToContainer: {
    borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
    pl: 2,
    mb: 2,
    bgcolor: (theme) => alpha(theme.palette.grey[50], 0.85),
    p: 1.5,
    borderRadius: 2,
    fontStyle: 'italic',
    color: 'text.secondary',
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
  },
  replyToCaption: {
    fontWeight: 600,
    color: 'primary.main',
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
  },
  replyToText: {
    mt: 0.75,
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
    lineHeight: 1.5,
  },
  contentText: (hasMedia) => ({
    mb: hasMedia ? 2.5 : 0,
    color: 'text.primary',
    fontWeight: 400,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    wordBreak: 'break-word',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  }),
  imageContainer: (hasText) => ({
    position: 'relative',
    mb: hasText ? 2.5 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    borderRadius: 1,
    width: '100%',
  }),
  image: (isSingle) => ({
    width: '100%',
    height: isSingle ? { xs: '180px', sm: '220px' } : { xs: '90px', sm: '110px' },
    objectFit: 'cover',
    objectPosition: 'center',
    borderRadius: '20px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    opacity: 0.97,
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
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  imageViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
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
    mb: hasTextOrImages ? 2.5 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }),
  videoInner: {
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
    background: (theme) => `linear-gradient(145deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
  },
  video: (duration) => ({
    width: '100%',
    height: duration && duration < 15 ? '140px' : '260px',
    borderRadius: 10,
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    opacity: 0.97,
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
    background: (theme) => `linear-gradient(145deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
  },
  circleVideo: (duration) => ({
    width: duration && duration < 15 ? '140px' : '260px',
    height: duration && duration < 15 ? '140px' : '260px',
    borderRadius: '50%',
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    opacity: 0.97,
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
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  audioContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2.5 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }),
  audioPlayer: {
    width: '100%',
    height: '48px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '10px',
    p: 1,
    '& audio': {
      width: '100%',
      height: '100%',
      '&::-webkit-media-controls-panel': {
        backgroundColor: 'transparent',
      },
    },
  },
  audioViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  otherFilesContainer: (hasText) => ({
    mb: hasText ? 2.5 : 0,
    mt: 1.5,
    width: '100%',
    maxWidth: { xs: '100%', sm: '360px' },
  }),
  otherFileItem: (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mt: index > 0 ? 1.5 : 0,
    p: 1,
    borderRadius: 2,
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  }),
  otherFileIcon: {
    color: 'text.secondary',
    fontSize: '1.3rem',
  },
  otherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  otherFilesViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },
  readMoreButton: {
    color: 'primary.main',
    textTransform: 'none',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
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
    gap: { xs: 0.75, sm: 1.5 },
  },
  likeButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
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
    fontSize: { xs: '1.2rem', sm: '1.3rem' },
  }),
  likeCount: (isLiked, animate) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.9rem' },
    transform: animate ? 'scale(1.25)' : 'scale(1)',
    ml: 0.75,
  }),
  replyButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
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
    fontSize: { xs: '1.2rem', sm: '1.3rem' },
  },
  replyCount: {
    color: 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.9rem' },
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
    fontSize: { xs: '1.2rem', sm: '1.3rem' },
  },
  menuPaper: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    borderRadius: 2,
    mt: 0.5,
    minWidth: '180px',
  },
  deleteMenuItem: {
    color: 'error.main',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.error.main, 0.15),
    },
  },
  mediaModalBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
    p: { xs: 2.5, sm: 4 },
    maxWidth: { xs: '95vw', sm: '90vw', md: '900px' },
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 3,
    outline: 'none',
    animation: 'fadeIn 0.3s ease-in-out',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.98)' },
      to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
    },
  },
  mediaModalTitle: {
    mb: 2.5,
    fontWeight: 600,
    fontSize: { xs: '1.2rem', sm: '1.35rem' },
    color: 'text.primary',
  },
  mediaModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2.5,
    p: 1.5,
  },
  modalImage: {
    width: '100%',
    maxHeight: { xs: '320px', sm: '420px' },
    objectFit: 'contain',
    objectPosition: 'center',
    borderRadius: '10px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalImagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: { xs: '320px', sm: '420px' },
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
  },
  modalVideo: {
    width: '100%',
    maxHeight: { xs: '320px', sm: '420px' },
    borderRadius: '10px',
    backgroundColor: 'black',
    objectFit: 'contain',
    objectPosition: 'center',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalAudioPlayer: {
    width: '100%',
    height: '48px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '10px',
    p: 1,
    '& audio': {
      width: '100%',
      height: '100%',
      '&::-webkit-media-controls-panel': {
        backgroundColor: 'transparent',
      },
    },
  },
  modalOtherFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.5,
    borderRadius: 2,
    '&:hover': {
      bgcolor: (theme) => theme.palette.grey[100],
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalOtherFileIcon: {
    color: 'text.secondary',
    fontSize: '1.3rem',
  },
  modalOtherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },

  // ===============================
  // Board Styles
  // ===============================
  boardContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  boardMain: (isListView, dragging) => ({
    flex: 1,
    position: 'relative',
    overflow: isListView ? 'auto' : 'hidden',
    cursor: isListView ? 'default' : dragging ? 'grabbing' : 'grab',
    touchAction: isListView ? 'auto' : 'none',
    bgcolor: isListView ? (theme) => theme.palette.grey[50] : 'background.paper',
  }),
  boardCanvas: (scale, offset) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: 'background.paper',
    backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
    transformOrigin: 'top left',
  }),
  boardTitleContainer: (scale) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${1 / scale})`,
    pointerEvents: 'none',
    maxWidth: '80vw',
    textAlign: 'center',
  }),
  boardTitle: (titleLength) => ({
    color: (theme) => theme.palette.grey[300],
    fontSize: `${Math.min(16, 100 / (titleLength || 1))}vw`,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media (max-width: 600px)': { fontSize: `calc(${Math.min(16, 100 / (titleLength || 1))}vw * 0.8)` },
  }),
  boardEmptyMessage: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'text.secondary',
    fontSize: '1rem',
  },
  boardBackButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1100,
  },
  boardBackButton: {
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    bgcolor: 'background.paper',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[100], transform: 'scale(1.1)' },
  },
  boardControlsContainer: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    bgcolor: 'background.paper',
    borderRadius: 2,
    p: 0.75,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': { transform: 'scale(1.03)' },
    '@media (max-width: 600px)': { transform: 'scale(0.9)', gap: 1 },
  },
  boardViewToggleButton: {
    borderRadius: 2,
    textTransform: 'none',
    px: { xs: 1.5, sm: 2 },
    py: 0.5,
    bgcolor: (theme) => theme.palette.grey[100],
    color: 'text.primary',
    '&:hover': {
      bgcolor: 'primary.light',
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    '@media (max-width: 600px)': { fontSize: '0.75rem', px: 1 },
  },
  boardZoomButton: {
    bgcolor: (theme) => theme.palette.grey[100],
    '&:hover': { bgcolor: (theme) => theme.palette.grey[200], transform: 'scale(1.1)' },
  },
  boardZoomText: {
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    color: 'text.secondary',
    fontWeight: 500,
  },
  boardListViewContainer: {
    p: { xs: 2, sm: 3 },
    maxWidth: { xs: '95vw', sm: '680px' },
    mx: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  boardListViewTweet: (isReply) => ({
    width: '100%',
    maxWidth: { xs: '95vw', sm: '600px' },
    mx: 'auto',
    mb: 2,
    pl: isReply ? 4 : 0,
    borderLeft: isReply
      ? (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
      : 'none',
  }),
  boardErrorContainer: {
    p: 3,
    textAlign: 'center',
  },
  boardErrorText: {
    color: 'error.main',
    mb: 2,
    fontWeight: 500,
    fontSize: '1rem',
  },
  boardErrorButton: {
    borderRadius: 2,
    textTransform: 'none',
    px: 3,
    py: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'scale(1.03)', bgcolor: 'primary.light' },
  },
  boardEditDialog: {
    '& .MuiDialog-paper': { borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', p: 2 },
  },
  boardEditDialogTitle: {
    fontWeight: 500,
    fontSize: { xs: '1.1rem', sm: '1.25rem' },
    pb: 1,
  },
  boardEditDialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    pt: 1,
  },
  boardEditTextField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
  },
  boardEditFormControl: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      },
    },
  },
  boardEditCancelButton: {
    borderRadius: 2,
    textTransform: 'none',
    px: 3,
    color: 'text.secondary',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[100], transform: 'scale(1.03)' },
  },
  boardEditSaveButton: {
    borderRadius: 2,
    textTransform: 'none',
    px: 3,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'scale(1.03)',
      bgcolor: 'primary.light',
    },
    '&:disabled': { bgcolor: (theme) => theme.palette.grey[300], color: (theme) => theme.palette.grey[500], boxShadow: 'none' },
  },
};

export default TweetContentStyles;