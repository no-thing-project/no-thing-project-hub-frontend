import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Grid,
  Backdrop,
  Fade,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import PropTypes from 'prop-types';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Emoji from 'react-emoji-render';
import { useTweets } from '../../../hooks/useTweets';

const TweetContent = ({
  tweet,
  currentUser,
  userRole,
  onLike,
  onDelete,
  onReply,
  onReplyHover,
  onEdit,
  onPinToggle,
  isParentHighlighted = false,
  replyCount = 0,
  parentTweetText = null,
  bypassOwnership = false,
  relatedTweetIds = [],
  availableBoards = [],
  token,
  boardId,
  onLogout,
  navigate,
}) => {
  const MAX_TWEET_LENGTH = 280;

  const { fetchTweet } = useTweets(token, boardId, currentUser, onLogout, navigate);
  const [parentText, setParentText] = useState(parentTweetText);
  const isLiked = useMemo(
    () => tweet.liked_by?.some(u => u.anonymous_id === currentUser?.anonymous_id) ?? false,
    [tweet.liked_by, currentUser?.anonymous_id]
  );
  const tweetAuthor = tweet.username || tweet.user?.username || 'Someone';
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMediaModal, setOpenMediaModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    content: tweet.content?.value || '',
    status: tweet.status || 'approved',
    boardId: tweet.board_id || '',
  });

  useEffect(() => {
    if (tweet.stats?.likes !== undefined) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [tweet.stats?.likes]);

  useEffect(() => {
    if (tweet.parent_tweet_id && !parentTweetText) {
      fetchTweet(tweet.parent_tweet_id).then(parent => {
        if (parent) {
          setParentText(parent.content?.value || 'Parent tweet not found');
        }
      });
    }
  }, [tweet.parent_tweet_id, parentTweetText, fetchTweet]);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(tweet.tweet_id);
    }
  }, [onReplyHover, tweet.tweet_id, tweet.parent_tweet_id, tweet.child_tweet_ids]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
      onReplyHover(null);
    }
  }, [onReplyHover, tweet.parent_tweet_id, tweet.child_tweet_ids]);

  const handleMenuOpen = useCallback(event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleOpenMediaModal = useCallback(event => {
    event.stopPropagation();
    setOpenMediaModal(true);
  }, []);

  const handleCloseMediaModal = useCallback(() => setOpenMediaModal(false), []);

  const handleOpenEditModal = useCallback(() => {
    setEditForm({
      content: tweet.content?.value || '',
      status: tweet.status || 'approved',
      boardId: tweet.board_id || '',
    });
    setEditModalOpen(true);
    handleMenuClose();
  }, [tweet.content?.value, tweet.status, tweet.board_id]);

  const handleCloseEditModal = useCallback(() => setEditModalOpen(false), []);

  const handleEditSubmit = useCallback(() => {
    if (!editForm.content.trim()) {
      return;
    }
    onEdit({
      ...tweet,
      content: { ...tweet.content, value: editForm.content },
      status: editForm.status,
      board_id: editForm.boardId,
    });
    setEditModalOpen(false);
  }, [editForm, onEdit, tweet]);

  const canEdit = useMemo(() => {
    return (
      bypassOwnership ||
      ['moderator', 'administrator'].includes(userRole) ||
      tweet?.anonymous_id === currentUser?.anonymous_id ||
      tweet?.user_id === currentUser?.anonymous_id ||
      (tweet.username && currentUser.username && tweet.username === currentUser.username)
    );
  }, [
    bypassOwnership,
    userRole,
    tweet.anonymous_id,
    tweet.user_id,
    tweet.username,
    currentUser.anonymous_id,
    currentUser.username,
  ]);

  const isRelated = relatedTweetIds.includes(tweet.tweet_id);
  const highlightStyle = (hovered || isRelated || isParentHighlighted)
    ? { border: '2px solid #1976d2', boxShadow: '0 0 8px rgba(25, 118, 210, 0.3)' }
    : {};

  const renderContent = useMemo(() => {
    const files = tweet.content.metadata?.files || [];
    const imageFiles = files.filter(f => f.contentType?.startsWith('image') || f.url?.match(/\.(jpg|jpeg|png|gif)$/i));
    const videoFiles = files.filter(f => f.contentType?.startsWith('video') || f.url?.match(/\.(mp4|webm)$/i));
    const audioFiles = files.filter(f => f.contentType?.startsWith('audio') || f.url?.match(/\.(mp3|wav|webm)$/i));

    const renderImages = () => {
      if (imageFiles.length === 0) return null;
      return (
        <Box sx={{ position: 'relative', mb: tweet.content.value ? 2 : 0 }}>
          <Grid container spacing={1}>
            {imageFiles.slice(0, 4).map((file, index) => (
              <Grid item xs={imageFiles.length === 1 ? 12 : 6} sm={imageFiles.length === 1 ? 12 : 3} key={file.fileKey || index}>
                <LazyLoadImage
                  src={file.url}
                  alt={`Tweet media ${index + 1}`}
                  effect="blur"
                  style={{
                    width: '100%',
                    height: imageFiles.length === 1 ? '200px' : '100px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                  onError={e => (e.target.src = '/fallback-image.png')}
                  placeholder={<Box sx={{ bgcolor: 'grey.200', width: '100%', height: '100%', borderRadius: '8px' }} />}
                />
                {index === 3 && imageFiles.length > 4 && (
                  <Box
                    sx={{
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
                    }}
                  >
                    <Typography sx={{ color: 'white' }}>
                      +{imageFiles.length - 4}
                    </Typography>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
          {imageFiles.length > 0 && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
              onClick={handleOpenMediaModal}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === 'Enter' && handleOpenMediaModal(e)}
              aria-label="View all media"
            >
              View all media ({imageFiles.length})
            </Typography>
          )}
        </Box>
      );
    };

    const renderVideos = () => {
      if (videoFiles.length === 0) return null;
      return (
        <Box sx={{ mb: tweet.content.value || imageFiles.length > 0 ? 2 : 0 }}>
          <Box sx={{ position: 'relative' }}>
            <video
              src={videoFiles[0].url}
              controls
              style={{
                width: '100%',
                maxHeight: videoFiles[0].duration && videoFiles[0].duration < 15 ? '100px' : '200px',
                borderRadius: videoFiles[0].duration && videoFiles[0].duration < 15 ? '50%' : '8px',
                objectFit: 'cover',
              }}
              onError={e => console.error('Video load error:', e)}
              preload="metadata"
              aria-label="Tweet video"
            />
          </Box>
          {videoFiles.length > 1 && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
              onClick={handleOpenMediaModal}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === 'Enter' && handleOpenMediaModal(e)}
              aria-label="View all videos"
            >
              View all videos ({videoFiles.length})
            </Typography>
          )}
        </Box>
      );
    };

    const renderAudio = () => {
      if (audioFiles.length === 0) return null;
      return (
        <Box sx={{ mb: tweet.content.value || imageFiles.length > 0 || videoFiles.length > 0 ? 2 : 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <audio
              src={audioFiles[0].url}
              controls
              style={{ width: '100%' }}
              onError={e => console.error('Audio load error:', e)}
              preload="metadata"
              aria-label="Tweet audio"
            />
          </Box>
          {audioFiles.length > 1 && (
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
              onClick={handleOpenMediaModal}
              role="button"
              tabIndex={0}
              onKeyPress={e => e.key === 'Enter' && handleOpenMediaModal(e)}
              aria-label="View all audio"
            >
              View all audio ({audioFiles.length})
            </Typography>
          )}
        </Box>
      );
    };

    return (
      <>
        {tweet.content.value && (
          <Typography
            variant="body1"
            sx={{
              mb: imageFiles.length > 0 || videoFiles.length > 0 || audioFiles.length > 0 ? 2 : 0,
              color: '#424242',
              fontWeight: 200,
              wordBreak: 'break-word',
            }}
          >
            <Emoji text={tweet.content.value} />
          </Typography>
        )}
        {renderImages()}
        {renderVideos()}
        {renderAudio()}
      </>
    );
  }, [tweet.content, handleOpenMediaModal]);

  return (
    <>
      <Paper
        id={`tweet-${tweet.tweet_id}`}
        className="tweet-card"
        elevation={3}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          p: '16px',
          bgcolor: tweet.is_pinned ? 'rgba(255, 215, 0, 0.1)' : 'background.paper',
          borderRadius: 1,
          minWidth: { xs: '180px', sm: '240px' },
          maxWidth: { xs: '90vw', sm: '320px' },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease-in-out',
          ...highlightStyle,
        }}
        role="article"
        aria-labelledby={`tweet-title-${tweet.tweet_id}`}
      >
        <Typography id={`tweet-title-${tweet.tweet_id}`} sx={{ display: 'none' }}>
          Tweet by {tweetAuthor}
        </Typography>
        {tweet.is_pinned && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <PushPinIcon fontSize="small" sx={{ color: 'gold', transition: 'color 0.2s ease' }} />
          </Box>
        )}
        {parentText && (
          <Box
            sx={{
              borderLeft: '3px solid',
              borderColor: 'grey.300',
              pl: '8px',
              mb: '8px',
              fontStyle: 'italic',
              fontWeight: 200,
              color: 'grey.600',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption">Replying to:</Typography>
            <Typography variant="body2">
              <Emoji text={parentText} />
            </Typography>
          </Box>
        )}

        {renderContent}

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 1 }}
        >
          Author: {tweetAuthor}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
        >
          Status: {tweet.status}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onLike(tweet.tweet_id, isLiked);
              }}
              aria-label={isLiked ? 'Unlike tweet' : 'Like tweet'}
            >
              <ThumbUpIcon
                fontSize="small"
                sx={{ color: isLiked ? 'primary.main' : 'text.secondary', transition: 'color 0.2s ease' }}
              />
            </IconButton>
            <Typography
              variant="caption"
              sx={{
                mt: 0.2,
                color: isLiked ? 'primary.main' : 'text.secondary',
                transform: animate ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            >
              {tweet.stats?.likes || 0}
            </Typography>
            {canEdit && (
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onReply(tweet);
                }}
                aria-label="Reply to tweet"
              >
                <ChatBubbleOutlineIcon fontSize="small" sx={{ color: 'text.secondary', transition: 'color 0.2s ease' }} />
              </IconButton>
            )}
            {(tweet.child_tweet_ids?.length > 0 || replyCount > 0) && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {tweet.child_tweet_ids?.length || replyCount} {tweet.child_tweet_ids?.length === 1 ? 'Reply' : 'Replies'}
              </Typography>
            )}
          </Box>

          {canEdit && (
            <Box>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                className="tweet-menu"
                aria-label="Tweet options"
                aria-controls={`tweet-menu-${tweet.tweet_id}`}
                aria-haspopup="true"
              >
                <MoreVertIcon fontSize="small" sx={{ transition: 'color 0.2s ease' }} />
              </IconButton>
              <Menu
                id={`tweet-menu-${tweet.tweet_id}`}
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                slotProps={{
                  paper: {
                    sx: { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
                  },
                }}
              >
                <MenuItem
                  onClick={handleOpenEditModal}
                  aria-label="Edit tweet"
                >
                  Edit Tweet
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onPinToggle(tweet);
                    handleMenuClose();
                  }}
                  aria-label={tweet.is_pinned ? 'Unpin tweet' : 'Pin tweet'}
                >
                  {tweet.is_pinned ? 'Unpin Tweet' : 'Pin Tweet'}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    onDelete(tweet.tweet_id);
                    handleMenuClose();
                  }}
                  sx={{ color: 'error.main' }}
                  aria-label="Delete tweet"
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Paper>

      <Modal
        open={openMediaModal}
        onClose={handleCloseMediaModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
        aria-labelledby="media-modal-title"
      >
        <Fade in={openMediaModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 2,
            }}
            role="dialog"
            aria-labelledby="media-modal-title"
          >
            <Typography id="media-modal-title" variant="h6" sx={{ mb: 2 }}>
              All Media
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tweet.content.metadata?.files?.map((file, index) => (
                <Box key={file.fileKey || index}>
                  {file.contentType?.startsWith('image') || file.url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <LazyLoadImage
                      src={file.url}
                      alt={`Media ${index + 1}`}
                      effect="blur"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                      onError={e => (e.target.src = '/fallback-image.png')}
                      placeholder={<Box sx={{ bgcolor: 'grey.200', width: '100%', height: '300px', borderRadius: '8px' }} />}
                    />
                  ) : file.contentType?.startsWith('video') || file.url?.match(/\.(mp4|webm)$/i) ? (
                    <video
                      src={file.url}
                      controls
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                      }}
                      onError={e => console.error('Video load error:', e)}
                      aria-label={`Video ${index + 1}`}
                    />
                  ) : file.contentType?.startsWith('audio') || file.url?.match(/\.(mp3|wav|webm)$/i) ? (
                    <audio
                      src={file.url}
                      controls
                      style={{ width: '100%' }}
                      onError={e => console.error('Audio load error:', e)}
                      aria-label={`Audio ${index + 1}`}
                    />
                  ) : (
                    <Typography>Unsupported file type</Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tweet</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            label="Tweet Content"
            value={editForm.content}
            onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
            sx={{ mt: 2 }}
            aria-label="Tweet content"
            minRows={3}
            inputProps={{ maxLength: MAX_TWEET_LENGTH }}
          />
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1, color: editForm.content.length > MAX_TWEET_LENGTH ? 'error.main' : 'text.secondary' }}
          >
            {editForm.content.length}/{MAX_TWEET_LENGTH}
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tweet Status</InputLabel>
            <Select
              value={editForm.status}
              label="Tweet Status"
              onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
              aria-label="Tweet status"
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="announcement">Announcement</MenuItem>
              <MenuItem value="reminder">Reminder</MenuItem>
              <MenuItem value="pinned">Pinned</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Move to Board</InputLabel>
            <Select
              value={editForm.boardId}
              label="Move to Board"
              onChange={e => setEditForm(prev => ({ ...prev, boardId: e.target.value }))}
              aria-label="Move to board"
            >
              {availableBoards.map(b => (
                <MenuItem key={b.board_id} value={b.board_id}>
                  {b.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} aria-label="Cancel edit tweet">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            aria-label="Save edited tweet"
            disabled={!editForm.content.trim() || editForm.content.length > MAX_TWEET_LENGTH}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

TweetContent.propTypes = {
  tweet: PropTypes.shape({
    tweet_id: PropTypes.string.isRequired,
    content: PropTypes.shape({
      type: PropTypes.string.isRequired,
      value: PropTypes.string,
      metadata: PropTypes.shape({
        files: PropTypes.arrayOf(
          PropTypes.shape({
            url: PropTypes.string.isRequired,
            fileKey: PropTypes.string.isRequired,
            contentType: PropTypes.string.isRequired,
            size: PropTypes.number.isRequired,
            duration: PropTypes.number,
          })
        ),
      }),
    }).isRequired,
    username: PropTypes.string,
    user: PropTypes.shape({
      username: PropTypes.string,
    }),
    anonymous_id: PropTypes.string,
    user_id: PropTypes.string,
    parent_tweet_id: PropTypes.string,
    child_tweet_ids: PropTypes.arrayOf(PropTypes.string),
    liked_by: PropTypes.arrayOf(
      PropTypes.shape({
        anonymous_id: PropTypes.string,
        username: PropTypes.string,
      })
    ),
    stats: PropTypes.shape({
      likes: PropTypes.number,
      like_count: PropTypes.number,
      view_count: PropTypes.number,
    }),
    status: PropTypes.string,
    is_pinned: PropTypes.bool,
    board_id: PropTypes.string,
  }).isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  userRole: PropTypes.string.isRequired,
  onLike: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
  onReplyHover: PropTypes.func,
  onEdit: PropTypes.func.isRequired,
  onPinToggle: PropTypes.func.isRequired,
  isParentHighlighted: PropTypes.bool,
  replyCount: PropTypes.number,
  parentTweetText: PropTypes.string,
  bypassOwnership: PropTypes.bool,
  relatedTweetIds: PropTypes.arrayOf(PropTypes.string),
  availableBoards: PropTypes.arrayOf(
    PropTypes.shape({
      board_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  token: PropTypes.string.isRequired,
  boardId: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
};

export default memo(TweetContent);