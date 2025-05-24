import { alpha } from '@mui/material';

export const BASE_SHADOW = '0 4px 16px rgba(0,0,0,0.12)';
export const HOVER_SHADOW = '0 8px 24px rgba(0,0,0,0.18)';
export const MEDIA_PREVIEW_SIZE = 250;
export const TWEET_Z_INDEX = 99;


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
    outline: (theme) => `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
};

const baseDialogStyles = {
  bgcolor: 'background.paper',
  boxShadow: BASE_SHADOW,
  borderRadius: 3,
  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  animation: 'fadeIn 0.3s ease-in-out',
  ...baseHoverEffect,
};

const ModalStyles = {
  mediaDialogContainer: {
    ...baseDialogStyles,
    maxWidth: { xs: '100%', sm: '90vw', md: '80vw' },
    margin: { xs: 0, sm: 'auto' },
    height: { xs: '100%', sm: 'auto' },
  },
  mediaDialogTitle: {
    ...baseTypographyStyles,
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    fontWeight: 600,
    padding: { xs: '12px 16px', sm: '16px 24px' },
    borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  },
  mediaDialogContent: {
    maxHeight: { xs: '70vh', sm: '60vh' },
    overflowY: 'auto',
    padding: { xs: '12px', sm: '16px' },
    display: 'flex',
    flexDirection: 'column',
    gap: { xs: 1.5, sm: 2 },
  },
  optionsDialogContainer: {
    ...baseDialogStyles,
    maxWidth: { xs: '80vw', sm: '400px' },
  },
  optionsDialogTitle: {
    ...baseTypographyStyles,
    fontSize: { xs: '1.1rem', sm: '1.25rem' },
    fontWeight: 600,
    padding: { xs: '12px 16px', sm: '16px 24px' },
    borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  },
  optionsDialogContent: {
    padding: { xs: '8px 0', sm: '12px 0' },
    overflowY: 'auto',
  },
  dialogActions: {
    padding: { xs: '8px', sm: '12px' },
    justifyContent: 'flex-end',
  },
  dialogCloseButton: {
    width: { xs: 48, sm: 40 },
    height: { xs: 48, sm: 40 },
    color: 'text.secondary',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.15)',
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
    '&:focus': {
      outline: (theme) => `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
  optionsDialogItem: {
    padding: { xs: '12px 16px', sm: '12px 24px' },
    minHeight: 48,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  modalImage: {
    width: '100%',
    maxHeight: { xs: '280px', sm: '360px' },
    objectFit: 'contain',
    borderRadius: 3,
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalImagePlaceholder: {
    bgcolor: (theme) => theme.palette.grey[200],
    width: '100%',
    height: { xs: '280px', sm: '360px' },
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: (theme) => theme.palette.grey[500],
  },
  modalOtherFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    padding: 1.5,
    borderRadius: 3,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.grey[100], 0.8),
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    '&:active': {
      transform: 'scale(0.98)',
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
  errorPaper: {
    padding: 2.5,
    textAlign: 'center',
    borderRadius: 8,
    boxShadow: BASE_SHADOW,
    bgcolor: 'background.paper',
    border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  },
  errorTypography: {
    color: 'error.main',
    fontWeight: 500,
    fontSize: { xs: '0.9rem', sm: '1rem' },
  },
};

export default ModalStyles;