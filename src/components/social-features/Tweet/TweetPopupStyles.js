import { alpha } from '@mui/material';

// Constants for reuse
const MAX_TWEET_LENGTH = 1000;
const POPUP_WIDTH = 360; // Slightly increased for better spacing on mobile
const POPUP_HEIGHT = 440; // Adjusted for better content fit
const BASE_Z_INDEX = 10; // Board
const POPUP_Z_INDEX = 100; // TweetPopup
const MODAL_SHADOW = '0 8px 28px rgba(0,0,0,0.22)';
const MEDIA_PREVIEW_SIZE = 250; // Unified size for all circular previews (video, audio, recording)

// Reusable style objects
const baseModalStyles = {
  bgcolor: 'background.paper',
  boxShadow: MODAL_SHADOW,
  borderRadius: 3,
  outline: 'none',
  animation: 'fadeIn 0.3s ease-in-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.98)' },
    to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
  },
};

const baseButtonStyles = {
  borderRadius: '24px',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': { transform: 'scale(1.02)' },
};

const baseHoverEffect = {
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  '&:focus': {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
};

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
    transform: 'scale(1.1)',
  },
});

const TweetPopupStyles = {
  popupModal: {
    '& .MuiDialog-paper': {
      ...baseModalStyles,
      position: 'absolute',
      minWidth: { xs: '300px', sm: POPUP_WIDTH, md: '420px' },
      maxWidth: { xs: '95vw', sm: '420px' },
      bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
      backdropFilter: 'blur(8px)',
      p: { xs: 2.5, sm: 3 },
      zIndex: POPUP_Z_INDEX,
      ...baseHoverEffect,
    },
    '&.MuiBackdropRoot': {
      backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.4),
    },
  },
  popupTitle: {
    display: 'none', // Hidden for accessibility
  },
  popupTextField: {
    '& .MuiInputBaseRoot': {
      borderRadius: '24px',
      padding: '12px 16px',
      bgcolor: (theme) => theme.palette.grey[100],
      transition: 'all 0.2s ease',
    },
    '& .MuiOutlinedInputNotchedOutline': {
      borderColor: (theme) => theme.palette.grey[300],
    },
    '&:hover .MuiOutlinedInputNotchedOutline': {
      borderColor: 'primary.main',
    },
    '&MuiOutlinedInputNotchedOutline': {
      boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
      borderColor: 'primary.main',
    },
  },
  popupCharCount: (isError) => ({
    alignSelf: 'flex-end',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
    ...dynamicCharCountColor(isError),
  }),
  popupFilePreviewContainer: {
    mt: 1.5,
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: 3,
    p: 1.5,
    transition: 'background-color 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[200] },
  },
  popupPreviewMedia: {
    width: '100%',
    height: MEDIA_PREVIEW_SIZE,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid',
    borderColor: (theme) => theme.palette.grey[300],
    transition: 'transform 0.2s ease',
    '&:hover': { transform: 'scale(1.02)' },
  },
  popupCirclePreviewMedia: {
    width: MEDIA_PREVIEW_SIZE,
    height: MEDIA_PREVIEW_SIZE,
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
    height: MEDIA_PREVIEW_SIZE,
    bgcolor: (theme) => theme.palette.grey[200],
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'text.secondary',
  },
  popupDeleteFileButton: {
    position: 'relative',
    top: 6,
    right: 6,
    bgcolor: (theme) => theme.palette.error.main,
    color: 'white',
    p: 0.75,
    transition: 'background-color 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.error.dark },
  },
  popupActionButton: {
    ...baseButtonStyles,
    px: 3.5,
    py: 1.25,
    fontWeight: 500,
    '&:hover': { bgcolor: 'primary.dark' },
  },
  popupCancelButton: {
    ...baseButtonStyles,
    px: 3.5,
    py: 1.25,
    bgcolor: (theme) => theme.palette.grey[300],
    color: 'text.primary',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[400] },
  },
  popupInputBar: {
    display: 'flex',
    gap: 1.5,
    alignItems: 'center',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '24px',
    p: 1.25,
    mt: 1.5,
    position: 'sticky',
    bottom: 0,
    zIndex: BASE_Z_INDEX + 1,
  },
  popupMediaButton: (isActive) => ({
    p: 1.75,
    borderRadius: '50%',
    ...dynamicMediaButtonColor(isActive),
  }),
  popupRecordingContainer: {
    mt: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1.5,
  },
  popupRecordingChip: {
    bgcolor: (theme) => theme.palette.error.main,
    color: 'white',
    fontWeight: 500,
    borderRadius: '16px',
    px: 2.5,
    py: 0.75,
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
    mt: 1.5,
    animation: 'fadeIn 0.3s ease-in',
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
  },
  popupLivePreview: {
    width: MEDIA_PREVIEW_SIZE,
    height: MEDIA_PREVIEW_SIZE,
    borderRadius: '50%',
    border: '2px solid',
    borderColor: (theme) => theme.palette.grey[300],
    bgcolor: 'black',
    objectFit: 'cover',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
  },
  popupAudioPreviewContainer: {
    alignItems: 'center',
    animation: 'fadeIn 0.3s ease-in',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    '@keyframes fadeIn': {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { backgroundColor: (theme) => alpha(theme.palette.error.light, 0.2) },
      '50%': { backgroundColor: (theme) => alpha(theme.palette.error.light, 0.4) },
      '100%': { backgroundColor: (theme) => alpha(theme.palette.error.light, 0.2) },
    },
  },
  popupVisualizerBar: (index) => ({
    width: '2px',
    height: '100%',
    bgcolor: 'primary.main',
    borderRadius: '1px',
    animation: `pulse${index} ${0.5 + (index % 5) * 0.15}s ease-in-out infinite alternate`,
    animationDelay: `${index * 0.03}s`,
    [`@keyframes pulse${index}`]: {
      '0%': { transform: `scaleY(${0.2 + (index % 4) * 0.1})` },
      '100%': { transform: `scaleY(${0.8 + (index % 4) * 0.1})` },
    },
  }),
  popupAudioPlayer: {
    width: '100%',
    height: '40px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '16px',
    p: 1,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
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
  },
  popupAudioVisualizer: (isLive = false) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '1px',
    padding: '0 4px',
    opacity: isLive ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
  }),
  popupProgressContainer: {
    mt: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
  },
  popupDialogPaper: {
    position: 'absolute',
    m: 0,
    width: { xs: '95vw', sm: POPUP_WIDTH },
    maxHeight: { xs: '85vh', sm: POPUP_HEIGHT },
    overflowY: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: POPUP_Z_INDEX,
  },
  popupDialogBackdrop: {
    backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.4),
  },
  popupContentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: { xs: 2, sm: 2.5 },
  },
  popupErrorAlert: {
    borderRadius: 3,
  },
  popupParentTweetCaption: {
    color: 'text.secondary',
    fontStyle: 'italic',
    fontSize: { xs: '0.8rem', sm: '0.85rem' },
  },
  popupScheduleButton: {
    alignSelf: 'flex-start',
    textTransform: 'none',
    color: 'primary.main',
    fontSize: { xs: '0.8rem', sm: '0.85rem' },
  },
  popupButtonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    mt: 2.5,
    gap: 1.5,
  },
};

export default TweetPopupStyles;