import { alpha } from '@mui/material';

const MAX_TWEET_LENGTH = 1000;

const TweetContentStyles = {
  // Tweet Card (Paper)
  tweetCard: (isPinned) => ({
    p: { xs: 1.5, sm: 2 },
    bgcolor: (theme) => (isPinned ? alpha(theme.palette.warning.light, 0.15) : theme.palette.background.paper),
    borderRadius: 2,
    minWidth: { xs: '160px', sm: '220px' },
    maxWidth: { xs: '90vw', sm: '340px' },
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    },
  }),

  // Hidden Tweet Title
  tweetTitle: {
    display: 'none',
  },

  // Pinned Icon
  pinnedIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  pinnedIcon: {
    fontSize: 'small',
    color: '#FFD700',
    transition: 'color 0.3s ease',
  },

  // Reply To Section
  replyToContainer: {
    borderLeft: '4px solid',
    borderColor: 'primary.light',
    pl: 1.5,
    mb: 2,
    bgcolor: 'grey.50',
    p: 1,
    borderRadius: 1,
    fontStyle: 'italic',
    color: 'text.secondary',
  },
  replyToCaption: {
    fontWeight: 500,
    color: 'primary.main',
  },
  replyToText: {
    mt: 0.5,
  },

  // Tweet Content
  contentText: (hasMedia) => ({
    mb: hasMedia ? 2 : 0,
    color: 'text.primary',
    fontWeight: 400,
    wordBreak: 'break-word',
    lineHeight: 1.5,
  }),

  // Image Grid
  imageContainer: (hasText) => ({
    position: 'relative',
    mb: hasText ? 2 : 0,
  }),
  image: (isSingle) => ({
    width: '100%',
    height: isSingle ? '200px' : '100px',
    objectFit: 'cover',
    borderRadius: '8px',
    transition: 'transform 0.3s ease',
    '&:hover': { transform: 'scale(1.05)' },
  }),
  imagePlaceholder: {
    bgcolor: 'grey.200',
    width: '100%',
    height: '100%',
    borderRadius: '8px',
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
    borderRadius: '8px',
  },
  imageOverlayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imageViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1,
    display: 'block',
    '&:hover': { textDecoration: 'underline' },
  },

  // Video
  videoContainer: (hasTextOrImages) => ({
    mb: hasTextOrImages ? 2 : 0,
  }),
  videoInner: {
    position: 'relative',
  },
  video: (duration) => ({
    width: '100%',
    maxHeight: duration && duration < 15 ? '120px' : '240px',
    borderRadius: duration && duration < 15 ? '16px' : '8px',
    objectFit: 'cover',
    backgroundColor: 'black',
  }),
  videoViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1,
    display: 'block',
    '&:hover': { textDecoration: 'underline' },
  },

  // Audio
  audioContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2 : 0,
  }),
  audioInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  audio: {
    width: '100%',
    maxHeight: '48px',
  },
  audioViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1,
    display: 'block',
    '&:hover': { textDecoration: 'underline' },
  },

  // Other Files
  otherFilesContainer: (hasTextOrMedia) => ({
    mb: hasTextOrMedia ? 2 : 0,
  }),
  otherFileItem: (index) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mt: index > 0 ? 1 : 0,
  }),
  otherFileIcon: {
    color: 'text.secondary',
  },
  otherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  otherFilesViewAll: {
    color: 'primary.main',
    cursor: 'pointer',
    mt: 1,
    display: 'block',
    '&:hover': { textDecoration: 'underline' },
  },

  // Metadata
  metadataContainer: {
    mt: 1.5,
    borderTop: '1px solid',
    borderColor: 'divider',
    pt: 1,
  },
  authorText: {
    color: 'text.secondary',
    fontSize: { xs: '0.85rem', sm: '0.9rem' },
  },
  statusText: {
    color: 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
  },

  // Actions
  actionsContainer: {
    display: 'flex',
    alignItems: 'center',
    mt: 1.5,
    justifyContent: 'space-between',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.5, sm: 1 },
  },
  likeButton: {
    '&:hover': { bgcolor: 'primary.light' },
  },
  likeIcon: (isLiked) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    transition: 'color 0.3s ease',
  }),
  likeCount: (isLiked, animate) => ({
    color: isLiked ? 'primary.main' : 'text.secondary',
    transform: animate ? 'scale(1.2)' : 'scale(1)',
    transition: 'transform 0.3s ease',
    fontSize: { xs: '0.75rem', sm: '0.85rem' },
  }),
  replyButton: {
    '&:hover': { bgcolor: 'primary.light' },
  },
  replyIcon: {
    color: 'text.secondary',
    transition: 'color 0.3s ease',
  },
  replyCount: {
    color: 'text.secondary',
    fontSize: { xs: '0.75rem', sm: '0.8rem' },
  },
  menuButton: {
    '&:hover': { bgcolor: 'grey.100' },
  },
  menuIcon: {
    transition: 'color 0.3s ease',
  },
  menuPaper: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: 2,
  },
  deleteMenuItem: {
    color: 'error.main',
  },

  // Media Modal
  mediaModalBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: { xs: 2, sm: 4 },
    maxWidth: { xs: '95vw', sm: '90vw' },
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: 2,
    outline: 'none',
  },
  mediaModalTitle: {
    mb: 2,
    fontWeight: 500,
  },
  mediaModalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  modalImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '1px solid',
    borderColor: 'grey.200',
  },
  modalImagePlaceholder: {
    bgcolor: 'grey.200',
    width: '100%',
    height: '400px',
    borderRadius: '8px',
  },
  modalVideo: {
    width: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    backgroundColor: 'black',
  },
  modalAudio: {
    width: '100%',
    maxHeight: '48px',
  },
  modalOtherFile: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  modalOtherFileIcon: {
    color: 'text.secondary',
  },
  modalOtherFileLink: {
    color: 'primary.main',
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },

  // Edit Dialog
  editDialogContent: {
    mt: 2,
  },
  editTextField: {
    mt: 2,
  },
  editCharCount: (charCount) => ({
    display: 'block',
    mt: 1,
    color:
      charCount > MAX_TWEET_LENGTH
        ? 'error.main'
        : charCount > MAX_TWEET_LENGTH * 0.9
        ? 'warning.main'
        : 'text.secondary',
  }),
  editFormControl: {
    mt: 2,
  },
};

export default TweetContentStyles;