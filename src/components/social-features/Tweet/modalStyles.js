import { alpha } from '@mui/material';

// Constants for reuse
const MODAL_Z_INDEX = 120; // Above TweetPopup (z-index: 100) and TweetContent (z-index: 99)
const BASE_SHADOW = '0 4px 16px rgba(0,0,0,0.12)';
const HOVER_SHADOW = '0 8px 24px rgba(0,0,0,0.18)';
const MEDIA_PREVIEW_SIZE = 250; // Unified size for circular previews, consistent with TweetContentStyles

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

const baseModalStyles = {
  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
  backdropFilter: 'blur(8px)',
  boxShadow: BASE_SHADOW,
  borderRadius: 3,
  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  outline: 'none',
  animation: 'fadeIn 0.3s ease-in-out',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translate(-50%, -48%) scale(0.98)' },
    to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
  },
  ...baseHoverEffect,
};

const ModalStyles = {
  optionsModalBox: {
    ...baseModalStyles,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90vw', sm: '340px' },
    maxWidth: '95vw',
    p: { xs: 2.5, sm: 3 },
    zIndex: MODAL_Z_INDEX,
    touchAction: 'none', // Prevent touch events from passing through
  },
  optionsModalContent: {
    p: { xs: 2, sm: 2.5 },
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
  },
  optionsModalTitle: {
    ...baseTypographyStyles,
    mb: 2,
    fontWeight: 600,
    fontSize: { xs: '1.1rem', sm: '1.25rem' },
  },
  optionsModalHiddenTitle: {
    display: 'none', // For accessibility
  },
  optionsModalItem: {
    borderRadius: 3,
    p: { xs: 1.5, sm: 2 },
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'scale(0.98)', // Feedback for touch
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
    minHeight: 48, // Larger tap area for mobile
  },
  optionsModalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: MODAL_Z_INDEX + 1,
    p: { xs: 1, sm: 1.25 },
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.15)',
    },
    '&:active': {
      transform: 'scale(0.95)', // Touch feedback
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
  },
  mediaModalBox: {
    ...baseModalStyles,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    p: { xs: 2.5, sm: 3.5 },
    width: { xs: '95vw', sm: '90vw', md: '960px' },
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: MODAL_Z_INDEX,
    touchAction: 'none', // Prevent touch events from passing through
  },
  mediaModalTitle: {
    ...baseTypographyStyles,
    mb: 2.5,
    fontWeight: 600,
    fontSize: { xs: '1.2rem', sm: '1.35rem' },
  },
  mediaModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    p: { xs: 1.5, sm: 2 },
  },
  mediaModalContainer: {
    ...baseModalStyles,
    width: { xs: '95vw', sm: '85vw', md: '960px' },
    maxWidth: '95vw',
    p: { xs: 2.5, sm: 3 },
    position: 'relative',
    zIndex: MODAL_Z_INDEX,
  },
  mediaModalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: MODAL_Z_INDEX + 1,
    p: { xs: 1, sm: 1.25 },
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.15)',
    },
    '&:active': {
      transform: 'scale(0.95)', // Touch feedback
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
  },
  modalImage: {
    width: '100%',
    maxHeight: { xs: '280px', sm: '360px' },
    objectFit: 'contain',
    objectPosition: 'center',
    borderRadius: '10px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
  },
  modalImagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: { xs: '280px', sm: '360px' },
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  modalVideo: {
    width: '100%',
    maxHeight: { xs: '280px', sm: '360px' },
    borderRadius: '10px',
    backgroundColor: 'black',
    objectFit: 'contain',
    objectPosition: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
  },
  modalAudioPlayer: {
    width: '100%',
    height: '48px',
    bgcolor: (theme) => theme.palette.grey[100],
    borderRadius: '12px',
    p: 1.25,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
    '& .audioVisualizer': {
      position: 'absolute',
      top: 0,
      left: 0,
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
  modalOtherFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.5,
    borderRadius: 3,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'scale(0.98)', // Touch feedback
    },
  },
  modalOtherFileIcon: {
    color: 'text.secondary',
    fontSize: '1.25rem',
  },
  modalOtherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
    '&:focus': {
      outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      outlineOffset: 2,
    },
  },
  errorPaper: {
    p: 2.5,
    textAlign: 'center',
    borderRadius: 3,
    boxShadow: BASE_SHADOW,
    bgcolor: (theme) => theme.palette.background.paper,
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  },
  errorTypography: {
    color: 'error.main',
    fontWeight: 500,
    fontSize: { xs: '0.9rem', sm: '1rem' },
  },
};

export default ModalStyles;