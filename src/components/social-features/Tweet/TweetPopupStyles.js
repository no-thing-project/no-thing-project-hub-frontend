import { alpha } from '@mui/material';

// Constants for reuse
const MAX_TWEET_LENGTH = 1000;
const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 440;
const BASE_Z_INDEX = 10;
const POPUP_Z_INDEX = 100;
const MODAL_SHADOW = '0 8px 28px rgba(0,0,0,0.22)';
const MEDIA_PREVIEW_SIZE = 250;

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
  '&:active': { transform: 'scale(0.98)' },
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
    : 'transparent',
  '&:hover': {
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
    transform: 'scale(1.1)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
});

const TweetPopupStyles = {
  popupModal: {
    '& .MuiDialog-paper': {
      ...baseModalStyles,
      position: 'absolute',
      minWidth: '300px',
      maxWidth: '95vw',
      bgcolor: (theme) => alpha(theme.palette.background.paper, 0.98),
      backdropFilter: 'blur(12px)',
      p: 2,
      zIndex: POPUP_Z_INDEX,
      ...baseHoverEffect,
    },
    '&.MuiBackdropRoot': {
      backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.5),
    },
  },
  popupTitle: {
    display: 'none',
  },
  popupTextField: {
    '& .MuiInputBase-root': {
      borderRadius: '16px',
      padding: '10px 14px',
      bgcolor: (theme) => theme.palette.grey[50],
      transition: 'all 0.2s ease',
      minHeight: '48px',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: (theme) => theme.palette.grey[200],
    },
    '&:hover .MuiOutlinedInputNotchedOutline': {
      borderColor: 'primary.main',
      boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '&.Mui-focused .MuiOutlinedInputNotchedOutline': {
      borderColor: 'primary.main',
      boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
  },
  popupCharCount: (isError) => ({
    alignSelf: 'flex-end',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
    ...dynamicCharCountColor(isError),
  }),
  popupFilePreviewContainer: {
    mt: 1,
    bgcolor: 'transparent',
    borderRadius: 8,
    p: 0.5,
    transition: 'all 0.2s ease',
  },
  popupPreviewMedia: {
    width: '100%',
    height: MEDIA_PREVIEW_SIZE,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid',
    borderColor: (theme) => theme.palette.grey[200],
    transition: 'transform 0.2s ease',
    '&:hover': { transform: 'scale(1.01)' },
  },
  popupCirclePreviewMedia: {
    width: MEDIA_PREVIEW_SIZE,
    height: MEDIA_PREVIEW_SIZE,
    objectFit: 'cover',
    borderRadius: '50%',
    border: '1px solid',
    borderColor: (theme) => theme.palette.grey[200],
    backgroundColor: 'black',
    transition: 'transform 0.2s ease',
    '&:hover': { transform: 'scale(1.01)' },
  },
  popupPreviewPlaceholder: {
    width: '100%',
    height: MEDIA_PREVIEW_SIZE,
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: 'text.secondary',
  },
  popupDeleteFileButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    bgcolor: (theme) => alpha(theme.palette.error.main, 0.8),
    color: 'white',
    p: 0.5,
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.error.dark },
  },
  popupActionButton: {
    ...baseButtonStyles,
    px: 3,
    py: 1,
    fontWeight: 600,
    borderRadius: '16px',
    '&:hover': { bgcolor: 'primary.dark' },
  },
  popupCancelButton: {
    ...baseButtonStyles,
    px: 3,
    py: 1,
    bgcolor: (theme) => theme.palette.grey[200],
    color: 'text.primary',
    borderRadius: '16px',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[300] },
  },
  popupInputBar: {
    display: 'flex',
    alignItems: 'center',
    bgcolor: (theme) => theme.palette.grey[50],
    borderRadius: '16px',
    p: 0.75,
    mt: 1,
    position: 'sticky',
    bottom: 0,
    zIndex: BASE_Z_INDEX + 1,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  },
  popupMediaButton: (isActive) => ({
    p: 1,
    borderRadius: '50%',
    ...dynamicMediaButtonColor(isActive),
  }),
  popupRecordingContainer: {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  popupRecordingChip: {
    bgcolor: (theme) => theme.palette.error.main,
    color: 'white',
    fontWeight: 500,
    borderRadius: '12px',
    px: 2,
    py: 0.5,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { transform: 'scale(0.95)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(0.95)' },
    },
  },
  popupRecordingControls: {
    display: 'flex',
    gap: 1,
    mt: 0.5,
    justifyContent: 'center',
  },
  popupVideoPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    border: '50%',
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
  popupAudioVisualizer: (isLive = false) => ({
    position: 'absolute',
    width: '30%',
    height: '30%',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    opacity: isLive ? 1 : 0,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
  }),
  popupVisualizerBar: (index) => ({
    width: '40px',
    height: '30%',
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
    bgcolor: (theme) => theme.palette.grey[50],
    borderRadius: '16px',
    p: 0.75,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
  popupProgressContainer: {
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5,
  },
  popupDialogPaper: {
    position: 'absolute',
    m: 1,
    padding: '5px',
    width: { xs: '95vw', sm: '600px' },
    maxWidth: { sm: '90vw' },
    bottom: '4rem',
    maxHeight: '90vh',
    overflowY: 'auto',
    backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.98),
    backdropFilter: 'blur(12px)',
    borderRadius: 3,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: POPUP_Z_INDEX,
  },
  popupDialogBackdrop: {
    backgroundColor: (theme) => alpha(theme.palette.grey[900], 0.5),
  },
  popupContentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
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
    justifyContent: 'flex-end',
    mt: 1.5,
    gap: 1,
  },
};

export default TweetPopupStyles;