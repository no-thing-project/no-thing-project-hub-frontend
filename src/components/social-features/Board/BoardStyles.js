import { alpha } from '@mui/material';

// Constants for reuse
const BOARD_SIZE = 10000;
const BASE_Z_INDEX = 10; // Board
const BASE_SHADOW = '0 4px 16px rgba(0,0,0,0.12)';
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

const baseButtonStyles = {
  borderRadius: '24px',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': { transform: 'scale(1.02)' },
};

const baseTypographyStyles = {
  color: 'text.primary',
  fontWeight: 400,
  lineHeight: 1.6,
};

const BoardStyles = {
  boardContainer: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: BASE_Z_INDEX,
  },
  boardMain: (isListView, dragging) => ({
    flex: 1,
    position: 'relative',
    overflow: isListView ? 'auto' : 'hidden',
    cursor: isListView ? 'default' : dragging ? 'grabbing' : 'grab',
    touchAction: isListView ? 'auto' : 'none',
    bgcolor: isListView ? (theme) => theme.palette.grey[50] : 'background.paper',
    zIndex: BASE_Z_INDEX,
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
    zIndex: BASE_Z_INDEX,
  }),
  boardTitleContainer: (scale) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) scale(${1 / scale})`,
    pointerEvents: 'none',
    maxWidth: '85vw',
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
    fontSize: { xs: '0.9rem', sm: '1rem' },
  },
  boardBackButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 99,
  },
  boardBackButton: {
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    bgcolor: 'background.paper',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[100], transform: 'scale(1.1)' },
  },
  boardControlsContainer: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 99,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    bgcolor: 'background.paper',
    borderRadius: 3,
    p: 1,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    '&:hover': { transform: 'scale(1.03)' },
    '@media (max-width: 600px)': { transform: 'scale(0.9)', gap: 1 },
  },
  boardViewToggleButton: {
    ...baseButtonStyles,
    px: { xs: 1.75, sm: 2.25 },
    py: 0.75,
    bgcolor: (theme) => theme.palette.grey[100],
    color: 'text.primary',
    '&:hover': {
      bgcolor: 'primary.light',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    '@media (max-width: 600px)': { fontSize: '0.8rem', px: 1.25 },
  },
  boardZoomButton: {
    bgcolor: (theme) => theme.palette.grey[100],
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[200], transform: 'scale(1.1)' },
  },
  boardZoomText: {
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    color: 'text.secondary',
    fontWeight: 500,
  },
  boardListViewContainer: {
    p: { xs: 2.5, sm: 3 },
    maxWidth: { xs: '95vw', sm: '720px' },
    mx: 'auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  boardListViewTweet: (isReply) => ({
    width: '100%',
    maxWidth: { xs: '95vw', sm: '640px' },
    mx: 'auto',
    mb: 2.5,
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
    fontSize: { xs: '0.9rem', sm: '1rem' },
  },
  boardErrorButton: {
    ...baseButtonStyles,
    px: 3.5,
    py: 1.25,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)', bgcolor: 'primary.light' },
  },
  boardEditDialog: {
    '& .MuiDialog-paper': {
      ...baseModalStyles,
      borderRadius: 3,
      p: 2.5,
      zIndex: MODAL_Z_INDEX,
    },
  },
  boardEditDialogTitle: {
    ...baseTypographyStyles,
    fontWeight: 500,
    fontSize: { xs: '1.15rem', sm: '1.25rem' },
    pb: 1.5,
  },
  boardEditDialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2.5,
    pt: 1.5,
  },
  boardEditTextField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      transition: 'all 0.2s ease',
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
        borderColor: 'primary.main',
      },
    },
  },
  boardEditFormControl: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      transition: 'all 0.2s ease',
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
        borderColor: 'primary.main',
      },
    },
  },
  boardEditCancelButton: {
    ...baseButtonStyles,
    px: 3.5,
    color: 'text.secondary',
    '&:hover': { bgcolor: (theme) => theme.palette.grey[100] },
  },
  boardEditSaveButton: {
    ...baseButtonStyles,
    px: 3.5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      bgcolor: 'primary.light',
    },
    '&:disabled': {
      bgcolor: (theme) => theme.palette.grey[300],
      color: (theme) => theme.palette.grey[500],
      boxShadow: 'none',
    },
  },
};

export default BoardStyles;