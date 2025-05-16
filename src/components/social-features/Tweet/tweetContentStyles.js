import { alpha } from '@mui/material';

const MAX_TWEET_LENGTH = 1000;

const TweetContentStyles = {
  // Tweet Card (Paper)
  tweetCard: (isPinned, isParentHighlighted, isListView) => ({
    p: 4,
    mb: 1,
    bgcolor: (theme) =>
    isPinned
      ? alpha(theme.palette.warning.light, 0.25)
      : isParentHighlighted
      ? alpha(theme.palette.primary.light, 0.15)
      : theme.palette.background.paper,
    borderRadius: 3,
    minWidth: { xs: '60vw', sm: '360px' },
    maxWidth: isListView ? { xs: '90vw', sm: '900px' } : { xs: '90vw', sm: '360px' },
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    opacity: 0.97,
    border: (theme) =>
    isParentHighlighted
      ? `2px solid ${theme.palette.primary.main}`
      : `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
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
    '&.list-view': {
      maxWidth: { xs: '95vw', sm: '680px' },
      margin: '0 auto',
      mb: 3
    },
  }),

  // Hidden Tweet Title
  tweetTitle: {
    display: 'none',
  },

  // Pinned Icon
  pinnedIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  pinnedIcon: {
    fontSize: '1.1rem',
    color: '#FFD700',
    transition: 'color 0.3s ease, transform 0.2s ease',
    '&:hover': {
      color: '#FFC107',
      transform: 'scale(1.15)',
    },
  },

  // Reply To Section
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
    transition: 'background-color 0.3s ease',
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

  // Tweet Content
  contentText: (hasMedia) => ({
    mb: hasMedia ? 2.5 : 0,
    color: 'text.primary',
    fontWeight: 400,
    fontSize: { xs: '0.95rem', sm: '1rem' },
    wordBreak: 'break-word',
    lineHeight: 1.6,
    letterSpacing: '0.01em',
  }),

  // Image Grid
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
    transition: 'transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease',
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
    bgcolor: 'grey.200',
    width: '100%',
    height: '100%',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'grey.500',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    '&:hover': { opacity: 1 },
  },
  imageOverlayText: {
    color: 'white',
    fontWeight: 600,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  imageViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'color 0.3s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
    '&:focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },

  // Video
  videoContainer: (hasTextOrImages) => ({
    mb: hasTextOrImages ? 2.5 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }),
  videoInner: {
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    background: (theme) => `linear-gradient(145deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
  },
  video: (duration) => ({
    width: '100%',
    maxHeight: duration && duration < 15 ? '140px' : '260px',
    borderRadius: duration && duration < 15 ? '18px' : '10px',
    objectFit: 'cover',
    objectPosition: 'center',
    backgroundColor: 'black',
    transition: 'transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease',
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
    transition: 'color 0.3s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },

  // Audio
  audioContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2.5 : 0,
    mt: 1.5,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }),
  audioInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    bgcolor: 'grey.100',
    p: 1.5,
    borderRadius: '10px',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  audio: {
    width: '100%',
    maxHeight: '48px',
    opacity: 0.97,
    '&::-webkit-media-controls-panel': {
      backgroundColor: 'transparent',
    },
    '&:hover': {
      opacity: 1,
    },
  },
  audioViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1.5,
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
    fontWeight: 600,
    textAlign: 'right',
    transition: 'color 0.3s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },

  // Other Files
  otherFilesContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2.5 : 0,
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
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      bgcolor: 'grey.100',
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
    transition: 'color 0.3s ease',
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
    transition: 'color 0.3s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },

  // Metadata
  metadataContainer: {
    mt: 2,
    borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
    pt: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.75,
  },
  authorText: {
    color: 'text.secondary',
    fontSize: { xs: '0.9rem', sm: '0.95rem' },
    lineHeight: 1.5,
    fontWeight: 500,
  },
  statusText: {
    color: 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.85rem' },
    fontStyle: 'italic',
  },

  // Actions
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
    transition: 'all 0.3s ease',
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
    transition: 'color 0.3s ease, transform 0.2s ease',
  }),
  likeCount: (isLiked, animate) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.9rem' },
    transform: animate ? 'scale(1.25)' : 'scale(1)',
    transition: 'transform 0.3s ease, color 0.3s ease',
    ml: 0.75,
  }),
  replyButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
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
    transition: 'color 0.3s ease, transform 0.2s ease',
  },
  replyCount: {
    color: 'text.secondary',
    fontSize: { xs: '0.8rem', sm: '0.9rem' },
    ml: 0.75,
  },
  menuButton: {
    p: { xs: 0.75, sm: 1 },
    minWidth: 0,
    borderRadius: '50%',
    transition: 'all 0.3s ease',
    '&:hover': {
      bgcolor: 'grey.100',
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
    transition: 'color 0.3s ease, transform 0.2s ease',
  },
  menuPaper: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    borderRadius: 2,
    mt: 0.5,
    minWidth: '180px',
  },
  deleteMenuItem: {
    color: 'error.main',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      bgcolor: (theme) => alpha(theme.palette.error.main, 0.15),
    },
  },

  // Media Modal
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
    animation: 'fadeIn 0.3s ease',
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
    transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalImagePlaceholder: {
    bgcolor: 'grey.200',
    width: '100%',
    height: { xs: '320px', sm: '420px' },
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'grey.500',
  },
  modalVideo: {
    width: '100%',
    maxHeight: { xs: '320px', sm: '420px' },
    borderRadius: '10px',
    backgroundColor: 'black',
    objectFit: 'contain',
    objectPosition: 'center',
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  modalAudio: {
    width: '100%',
    maxHeight: '48px',
    bgcolor: 'grey.100',
    borderRadius: '10px',
  },
  modalOtherFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.5,
    borderRadius: 2,
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      bgcolor: 'grey.100',
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
    transition: 'color 0.3s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark',
    },
  },

  // Edit Dialog
  editDialogContent: {
    mt: 2.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 2.5,
  },
  editTextField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover fieldset': {
        borderColor: 'primary.main',
      },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
  },
  editCharCount: (charCount) => ({
    display: 'block',
    mt: 0.75,
    fontSize: { xs: '0.8rem', sm: '0.85rem' },
    color:
      charCount > MAX_TWEET_LENGTH
        ? 'error.main'
        : charCount > MAX_TWEET_LENGTH * 0.9
        ? 'warning.main'
        : 'text.secondary',
    transition: 'color 0.3s ease',
  }),
  editFormControl: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '&:hover fieldset': {
        borderColor: 'primary.main',
      },
      '&.Mui-focused fieldset': {
        boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    },
  },
};

export default TweetContentStyles;