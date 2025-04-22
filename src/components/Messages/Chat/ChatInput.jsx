import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
  Avatar,
  Paper,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Send,
  Mic,
  Videocam,
  MoreVert,
  AttachFile,
  PhotoCamera,
  MusicNote,
  Stop,
  Reply,
  Clear,
  EmojiEmotions,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import RecorderModal from '../RecorderModal';
import { actionButtonStyles } from '../../../styles/BaseStyles';

const inputAreaStyles = {
  p: { xs: 1, md: 2 },
  borderTop: '1px solid',
  borderColor: 'grey.300',
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 0.5, md: 1 },
  backgroundColor: 'grey.50',
  boxSizing: 'border-box',
  minHeight: 80, // Ensure input area doesn't collapse
};

const ChatInput = ({
  conversationId,
  recipient,
  onSendMediaMessage,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  token,
  currentUserId,
  friends,
  chatBackground,
}) => {
  const theme = useTheme();
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState('voice');
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    }
    setRecordingTime(0);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      clearPendingMedia();
      setReplyToMessage(null);
      cancelRecording();
    };
  }, [recipient, clearPendingMedia, setReplyToMessage]);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() && !pendingMediaList.length) return;
    setIsSending(true);
    setError(null);

    const messageData = {
      conversationId,
      content: messageInput.trim() || (pendingMediaList.length ? 'Media message' : ''),
      media: pendingMediaList,
      replyTo: replyToMessage?.message_id || null,
      selectedText: replyToMessage?.selectedText || null,
    };

    try {
      await onSendMediaMessage(messageData);
      setMessageInput('');
      clearPendingMedia();
      setReplyToMessage(null);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  }, [
    messageInput,
    pendingMediaList,
    replyToMessage,
    conversationId,
    onSendMediaMessage,
    clearPendingMedia,
    setReplyToMessage,
  ]);

  const handleFileUpload = useCallback(
    (event, type) => {
      const files = Array.from(event.target.files);
      files.forEach((file) => setPendingMediaFile(file));
      setAnchorEl(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    },
    [setPendingMediaFile]
  );

  const startRecording = useCallback(
    async (type) => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        setStream(mediaStream);
        setIsRecording(true);
        const recorder = new MediaRecorder(mediaStream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: type === 'voice' ? 'audio/webm' : 'video/webm',
          });
          setPendingMediaFile({
            file: new File([blob], `${type}_${Date.now()}.webm`, { type: blob.type }),
            type,
            preview: URL.createObjectURL(blob),
          });
          setIsRecording(false);
          setIsModalOpen(false);
          mediaStream.getTracks().forEach((track) => track.stop());
          setStream(null);
        };
        recorder.start();
        if (type === 'video') setIsModalOpen(true);
      } catch (err) {
        setError('Failed to start recording.');
        console.error('Recording error:', err);
      }
    },
    [setPendingMediaFile]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsRecording(false);
    setIsModalOpen(false);
    setRecordingTime(0);
    chunksRef.current = [];
  }, [stream]);

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;

  const getSenderName = useCallback(
    (senderId) => {
      if (senderId === currentUserId) return 'You';
      const friend = friends.find((f) => f.anonymous_id === senderId);
      return friend?.username || 'Unknown';
    },
    [currentUserId, friends]
  );

  const renderRightButton = () => {
    if (isRecording) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{ animation: 'blink 1s infinite' }}
          >
            {formatTime(recordingTime)}
          </Typography>
          <Tooltip title={`Stop ${recordingType} Recording`}>
            <IconButton size="small" onClick={stopRecording}>
              <Stop />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Recording">
            <IconButton size="small" onClick={cancelRecording}>
              <Clear />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }
    if (messageInput.trim() || pendingMediaList.length) {
      return (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="contained"
            onClick={handleSend}
            startIcon={isSending ? <CircularProgress size={16} /> : <Send />}
            disabled={isSending}
            sx={{ ...actionButtonStyles, minWidth: '100px', borderRadius: 1, flexShrink: 0 }}
            aria-label="Send message"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </motion.div>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <Tooltip
          title={recordingType === 'video' ? 'Switch to Voice' : 'Switch to Video'}
        >
          <IconButton
            size="small"
            onClick={() =>
              setRecordingType(recordingType === 'video' ? 'voice' : 'video')
            }
            aria-label={`Switch to ${recordingType === 'video' ? 'voice' : 'video'} recording`}
          >
            {recordingType === 'video' ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
        <Tooltip title={`Start ${recordingType} Recording`}>
          <IconButton
            size="small"
            onClick={() => startRecording(recordingType)}
            aria-label={`Start ${recordingType} recording`}
          >
            {recordingType === 'voice' ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEmojiOpen = (event) => setEmojiAnchorEl(event.currentTarget);
  const handleEmojiClose = () => setEmojiAnchorEl(null);

  const handleEmojiClick = (emojiObject) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    handleEmojiClose();
  };

  const removeMedia = (index) => {
    const updatedMedia = pendingMediaList.filter((_, i) => i !== index);
    clearPendingMedia();
    updatedMedia.forEach((media) => setPendingMediaFile(media));
  };

  const renderReplyPreview = () => {
    if (!replyToMessage) return null;
    const senderName = getSenderName(replyToMessage.sender_id);
    const content = replyToMessage.selectedText || replyToMessage.content;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1,
            mb: 1,
            bgcolor: 'grey.100',
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 1,
            minHeight: 40,
          }}
          aria-label="Reply preview"
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Replying to {senderName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}
              noWrap
            >
              {content.length > 50 ? `${content.slice(0, 50)}...` : content}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setReplyToMessage(null)}
            aria-label="Cancel reply"
          >
            <Clear />
          </IconButton>
        </Paper>
      </motion.div>
    );
  };

  const renderMediaPreview = () => {
    if (!pendingMediaList.length) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          mb: 1,
          p: 1,
          bgcolor: 'grey.100',
          borderRadius: 1,
          minHeight: 100,
        }}
        aria-label="Media preview"
      >
        <AnimatePresence>
          {pendingMediaList.map((media, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                {media.type.startsWith('image') ? (
                  <img
                    src={media.preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                ) : media.type.startsWith('video') ? (
                  <video
                    src={media.preview}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                ) : (
                  <Chip label="File" size="small" />
                )}
                <IconButton
                  size="small"
                  onClick={() => removeMedia(index)}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                  aria-label={`Remove media ${index + 1}`}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    );
  };

  return (
    <Box sx={inputAreaStyles}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      {renderReplyPreview()}
      {renderMediaPreview()}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}>
        <IconButton
          onClick={handleEmojiOpen}
          aria-label="Open emoji picker"
          sx={{ alignSelf: 'center', flexShrink: 0 }}
        >
          <EmojiEmotions />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          variant="outlined"
          sx={{
            bgcolor: 'white',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              minHeight: 40,
            },
            flex: 1,
            minWidth: 0,
          }}
          disabled={isRecording}
          aria-label="Message input"
        />
        <IconButton
          onClick={handleMenuOpen}
          aria-label="Open attachment menu"
          sx={{ alignSelf: 'center', flexShrink: 0 }}
        >
          <AttachFile />
        </IconButton>
        {renderRightButton()}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        aria-label="Attachment menu"
      >
        <MenuItem
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload photo"
        >
          <PhotoCamera sx={{ mr: 1 }} /> Photo
        </MenuItem>
        <MenuItem
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload video"
        >
          <Videocam sx={{ mr: 1 }} /> Video
        </MenuItem>
        <MenuItem
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload audio"
        >
          <MusicNote sx={{ mr: 1 }} /> Audio
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={handleEmojiClose}
        aria-label="Emoji picker"
      >
        <MenuItem sx={{ p: 0 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </MenuItem>
      </Menu>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*"
        onChange={(e) => handleFileUpload(e, 'media')}
        multiple
        aria-hidden="true"
      />
      <RecorderModal
        open={isModalOpen}
        onClose={cancelRecording}
        stream={stream}
        recordingTime={recordingTime}
        onStop={stopRecording}
        onCancel={cancelRecording}
      />
    </Box>
  );
};

ChatInput.propTypes = {
  conversationId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    group_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  pendingMediaList: PropTypes.arrayOf(
    PropTypes.shape({
      file: PropTypes.instanceOf(File),
      type: PropTypes.string,
      preview: PropTypes.string,
    })
  ).isRequired,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    sender_id: PropTypes.string,
    content: PropTypes.string,
    selectedText: PropTypes.string,
  }),
  setReplyToMessage: PropTypes.func.isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  token: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
  chatBackground: PropTypes.string.isRequired,
};

export default React.memo(ChatInput);