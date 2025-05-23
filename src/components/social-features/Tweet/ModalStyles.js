import { alpha } from '@mui/material';

// Constants for reuse
const MODAL_Z_INDEX = 111; // Edit Tweet Modal, Options Modal, Media Modal
const MODAL_SHADOW = '0 8px 28px rgba(0,0,0,0.22)';

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

const baseTypographyStyles = {
  color: 'text.primary',
  fontWeight: 400,
  lineHeight: 1.6,
};

const ModalStyles = {
  optionsModalBox: {
    ...baseModalStyles,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '85vw', sm: '320px' },
    maxWidth: '95vw',
    p: { xs: 2.5, sm: 3 },
    zIndex: MODAL_Z_INDEX,
  },
  optionsModalContent: {
    p: 2.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
  },
  optionsModalTitle: {
    ...baseTypographyStyles,
    mb: 2,
    fontWeight: 600,
    fontSize: { xs: '1.15rem', sm: '1.25rem' },
  },
  optionsModalItem: {
    borderRadius: 3,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.02)',
    },
  },
  mediaModalBox: {
    ...baseModalStyles,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    p: { xs: 3, sm: 4 },
    maxWidth: { xs: '95vw', sm: '90vw', md: '960px' },
    maxHeight: '90vh',
    overflowY: 'auto',
    zIndex: MODAL_Z_INDEX,
  },
  mediaModalTitle: {
    ...baseTypographyStyles,
    mb: 2.5,
    fontWeight: 600,
    fontSize: { xs: '1.25rem', sm: '1.35rem' },
  },
  mediaModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    p: 2,
  },
  modalImage: {
    width: '100%',
    maxHeight: { xs: '240px', sm: '300px' },
    objectFit: 'contain',
    objectPosition: 'center',
    borderRadius: '10px',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalImagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: { xs: '240px', sm: '300px' },
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
  },
  modalVideo: {
    width: '100%',
    maxHeight: { xs: '240px', sm: '300px' },
    borderRadius: '10px',
    backgroundColor: 'black',
    objectFit: 'contain',
    objectPosition: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
      bgcolor: (theme) => theme.palette.grey[100],
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
  },
  mediaModalContainer: {
    width: { xs: '95vw', sm: '85vw', md: '960px' },
    maxWidth: '95vw',
    p: { xs: 2.5, sm: 3 },
    position: 'relative',
  },
  mediaModalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  optionsModalContainer: {
    width: { xs: '85vw', sm: '320px' },
    maxWidth: '95vw',
    p: { xs: 2.5, sm: 3 },
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: MODAL_Z_INDEX,
  },
  optionsModalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  optionsModalHiddenTitle: {
    display: 'none',
  },
  errorPaper: {
    p: 2.5,
    textAlign: 'center',
  },
  errorTypography: {
    color: 'error.main',
    fontWeight: 500,
  },
};

export default ModalStyles;