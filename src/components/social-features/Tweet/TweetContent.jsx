import React, { useEffect, useState, useCallback } from 'react';
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
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PropTypes from 'prop-types';

const TweetContent = React.memo(
  ({
    tweet,
    currentUser,
    userRole,
    onLike,
    onDelete,
    onReply,
    onReplyHover,
    onEdit,
    onMove,
    onChangeType,
    onPinToggle,
    isParentHighlighted = false,
    replyCount = 0,
    parentTweetText = null,
    bypassOwnership = false,
  }) => {
    const isLiked = tweet.liked_by?.some(u => u.anonymous_id === currentUser?.anonymous_id);
    const tweetAuthor = tweet.username || tweet.user?.username || 'Someone';
    const [animate, setAnimate] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
      if (tweet.stats?.likes !== undefined) {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
      }
    }, [tweet.stats?.likes]);

    const handleMouseEnter = useCallback(() => {
      setHovered(true);
      if ((tweet.parent_tweet_id || tweet.child_tweet_ids?.length > 0) && onReplyHover) {
        onReplyHover(tweet.parent_tweet_id || tweet.tweet_id);
      }
    }, [onReplyHover, tweet.parent_tweet_id, tweet.tweet_id, tweet.child_tweet_ids]);

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

    const handleOpenModal = useCallback(event => {
      event.stopPropagation();
      setOpenModal(true);
    }, []);

    const handleCloseModal = useCallback(() => setOpenModal(false), []);

    // Allow editing if user is moderator, administrator, tweet owner, or bypassOwnership is true
    const canEdit = bypassOwnership || (
      ['moderator', 'administrator'].includes(userRole) ||
      (tweet?.anonymous_id || tweet.user_id) === currentUser?.anonymous_id ||
      (tweet.username && currentUser.username && tweet.username === currentUser.username)
    );

    // Debug log for menu visibility
    useEffect(() => {
      console.log('TweetContent Debug:', {
        tweetId: tweet.tweet_id,
        canEdit,
        userRole,
        tweetAnonymousId: tweet.anonymous_id,
        tweetUserId: tweet.user_id,
        tweetUsername: tweet.username,
        tweetContent: tweet.content,
        currentUserAnonymousId: currentUser.anonymous_id,
        currentUserUsername: currentUser.username,
        bypassOwnership,
      });
    }, [
      tweet.tweet_id,
      tweet.anonymous_id,
      tweet.user_id,
      tweet.username,
      tweet.content,
      currentUser.anonymous_id,
      currentUser.username,
      canEdit,
      bypassOwnership,
      userRole,
    ]);

    const renderContent = useCallback((content) => {
      const files = content.metadata?.files || [];

      switch (content.type) {
        case 'text':
          return (
            <Typography
              variant="body1"
              sx={{ marginBottom: '8px', color: '#424242', fontWeight: 200 }}
            >
              {content.value}
            </Typography>
          );
        case 'image':
          return (
            <Box sx={{ position: 'relative' }}>
              <Grid container spacing={1}>
                {files.slice(0, 4).map((file, index) => (
                  <Grid item xs={6} key={file.fileKey || index}>
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={file.url}
                        alt={`Tweet media ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                        onError={e => (e.target.src = '/fallback-image.png')}
                      />
                      {index === 3 && files.length > 4 && (
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
                            +{files.length - 4}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {files.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
                  onClick={handleOpenModal}
                  role="button"
                  tabIndex={0}
                  onKeyPress={e => e.key === 'Enter' && handleOpenModal(e)}
                >
                  View all media
                </Typography>
              )}
            </Box>
          );
        case 'video':
          return (
            <Box>
              {files[0]?.url ? (
                <video
                  src={files[0].url}
                  controls
                  style={{
                    maxWidth: '100%',
                    borderRadius: '8px',
                  }}
                  onError={e => console.error('Video load error:', e)}
                />
              ) : (
                <Typography color="error">Video unavailable</Typography>
              )}
              {files.length > 1 && (
                <Typography
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
                  onClick={handleOpenModal}
                  role="button"
                  tabIndex={0}
                  onKeyPress={e => e.key === 'Enter' && handleOpenModal(e)}
                >
                  View all media
                </Typography>
              )}
            </Box>
          );
        case 'audio':
          return (
            <Box>
              {files[0]?.url ? (
                <audio
                  src={files[0].url}
                  controls
                  style={{ width: '100%' }}
                  onError={e => console.error('Audio load error:', e)}
                />
              ) : (
                <Typography color="error">Audio unavailable</Typography>
              )}
              {files.length > 1 && (
                <Typography
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer', mt: 1 }}
                  onClick={handleOpenModal}
                  role="button"
                  tabIndex={0}
                  onKeyPress={e => e.key === 'Enter' && handleOpenModal(e)}
                >
                  View all media
                </Typography>
              )}
            </Box>
          );
        default:
          return <Typography color="error">Unsupported content type</Typography>;
      }
    }, [handleOpenModal]);

    return (
      <>
        <Paper
          id={`tweet-${tweet.tweet_id}`}
          className="tweet-card"
          elevation={3}
          onClick={e => {
            if (e.target.closest('.tweet-menu')) {
              e.stopPropagation();
              return;
            }
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            padding: '16px',
            backgroundColor: hovered ? 'background.default' : 'background.paper',
            borderRadius: 1,
            minWidth: '180px',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.01)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            },
            ...(isParentHighlighted && {
              backgroundColor: 'background.hover',
            }),
            ...(tweet.status === 'pending' && {
              border: '1px dashed #888',
            }),
          }}
          role="article"
          aria-labelledby={`tweet-title-${tweet.tweet_id}`}
        >
          <Typography id={`tweet-title-${tweet.tweet_id}`} sx={{ display: 'none' }}>
            Tweet by {tweetAuthor}
          </Typography>
          {parentTweetText && (
            <Box
              sx={{
                borderLeft: '3px solid',
                borderColor: '#CDD0D5',
                paddingLeft: '8px',
                marginBottom: '8px',
                fontStyle: 'italic',
                fontWeight: 200,
                color: '#CDD0D5',
              }}
            >
              Reply to: {parentTweetText}
            </Box>
          )}

          {renderContent(tweet.content)}

          <Typography
            variant="body1"
            sx={{ color: 'text.secondary', fontSize: '1rem' }}
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
              marginTop: 1,
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  sx={{ color: isLiked ? 'text.primary' : 'text.secondary' }}
                />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  marginLeft: 0.5,
                  marginTop: 0.2,
                  color: isLiked ? 'text.primary' : 'text.secondary',
                  transform: animate ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 300ms ease',
                }}
              >
                {tweet.stats?.likes || 0}
              </Typography>
              {canEdit && ( // Show reply button only for authorized users
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    onReply(tweet);
                  }}
                  sx={{ ml: 1 }}
                  aria-label="Reply to tweet"
                >
                  <ChatBubbleOutlineIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </IconButton>
              )}
              {replyCount > 0 && (
                <Typography variant="caption" sx={{ marginLeft: 0.5, color: 'text.secondary' }}>
                  {replyCount}
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
                  aria-controls="tweet-menu"
                  aria-haspopup="true"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  id="tweet-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    onClick={() => { onEdit(tweet); handleMenuClose(); }}
                    aria-label="Edit tweet"
                  >
                    Edit Tweet
                  </MenuItem>
                  <MenuItem
                    onClick={() => { onMove(tweet); handleMenuClose(); }}
                    aria-label="Move to another board"
                  >
                    Move to Another Board
                  </MenuItem>
                  <MenuItem
                    onClick={() => { onChangeType(tweet); handleMenuClose(); }}
                    aria-label="Change tweet type"
                  >
                    Change Type
                  </MenuItem>
                  <MenuItem
                    onClick={() => { onPinToggle(tweet); handleMenuClose(); }}
                    aria-label={tweet.is_pinned ? 'Unpin tweet' : 'Pin tweet'}
                  >
                    {tweet.is_pinned ? 'Unpin Tweet' : 'Pin Tweet'}
                  </MenuItem>
                  <MenuItem
                    onClick={() => { onDelete(tweet.tweet_id); handleMenuClose(); }}
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
          open={openModal}
          onClose={handleCloseModal}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{ timeout: 500 }}
          aria-labelledby="media-modal-title"
        >
          <Fade in={openModal}>
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
                overflow: 'auto',
                borderRadius: 2,
              }}
            >
              <Typography id="media-modal-title" variant="h6" sx={{ mb: 2 }}>
                All Media
              </Typography>
              <Grid container spacing={2}>
                {tweet.content.metadata?.files?.map((file, index) => (
                  <Grid item xs={12} sm={6} md={4} key={file.fileKey || index}>
                    {file.contentType.startsWith('image') ? (
                      <img
                        src={file.url}
                        alt={`Media ${index + 1}`}
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                        onError={e => (e.target.src = '/fallback-image.png')}
                      />
                    ) : file.contentType.startsWith('video') ? (
                      <video
                        src={file.url}
                        controls
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          borderRadius: '8px',
                        }}
                        onError={e => console.error('Video load error:', e)}
                      />
                    ) : file.contentType.startsWith('audio') ? (
                      <audio
                        src={file.url}
                        controls
                        style={{ width: '100%' }}
                        onError={e => console.error('Audio load error:', e)}
                      />
                    ) : (
                      <Typography>Unsupported file type</Typography>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Modal>
      </>
    );
  }
);

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
  onMove: PropTypes.func.isRequired,
  onChangeType: PropTypes.func.isRequired,
  onPinToggle: PropTypes.func.isRequired,
  isParentHighlighted: PropTypes.bool,
  replyCount: PropTypes.number,
  parentTweetText: PropTypes.string,
  bypassOwnership: PropTypes.bool,
};

export default TweetContent;