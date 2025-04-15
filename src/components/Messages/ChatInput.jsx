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
  Gif,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import RecorderModal from './RecorderModal';
import { actionButtonStyles } from '../../styles/BaseStyles';

const inputAreaStyles = {
  p: { xs: 1, md: 2 },
  borderTop: '1px solid',
  borderColor: 'grey.300',
  display: 'flex',
  flexDirection: 'column',
  gap: { xs: 0.5, md: 1 },
  backgroundColor: 'grey.50',
};

/**
 * ChatInput component for handling message input and sending
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
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

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    }
    setRecordingTime(0);
  }, [isRecording]);

  // Cleanup on conversation change or unmount
  useEffect(() => {
    return () => {
      clearPendingMedia();
      setReplyToMessage(null);
      cancelRecording();
    };
  }, [recipient, clearPendingMedia, setReplyToMessage]);

  // Handle message sending
  const handleSend = useCallback(async () => {
    if (!messageInput.trim() && !pendingMediaList.length) return;
    setIsSending(true);
    setError(null);

    const messageData = {
      conversationId,
      content: messageInput.trim() || (pendingMediaList.length ? 'Media message' : ''),
      media: pendingMediaList,
      replyTo: replyToMessage?.message_id || null,
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

  // Handle file upload
  const handleFileUpload = useCallback(
    (event, type) => {
      const files = Array.from(event.target.files);
      files.forEach((file) => setPendingMediaFile(file));
      setAnchorEl(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    },
    [setPendingMediaFile]
  );

  // Start recording (voice or video)
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

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // Cancel recording
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

  // Handle Enter key for sending
  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Format recording time
  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;

  // Get sender name for group chat replies
  const getSenderName = useCallback(
    (senderId) => {
      if (senderId === currentUserId) return 'You';
      const friend = friends.find((f) => f.anonymous_id === senderId);
      return friend?.username || 'Unknown';
    },
    [currentUserId, friends]
  );

  // Render right button (send or record)
  const renderRightButton = () => {
    if (isRecording) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            sx={{ ...actionButtonStyles, minWidth: '100px' }}
            aria-label="Send message"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </motion.div>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip
          title={recordingType === 'video' ? 'Switch to Voice' : 'Switch to Video'}
        >
          <IconButton
            size="small"
            onClick={() =>
              setRecordingType(recordingType === 'video' ? 'voice' : 'video')
            }
            aria-label={`Switch to ${recordingType === 'video' ? 'voice' : 'video'}`}
          >
            {recordingType === 'video' ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
        <Tooltip title={`Record ${recordingType === 'video' ? 'Video' : 'Voice'}`}>
          <IconButton
            size="small"
            onClick={() => startRecording(recordingType)}
            aria-label={`Record ${recordingType}`}
          >
            {recordingType === 'video' ? <Videocam /> : <Mic />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Handle emoji selection
  const handleEmojiClick = useCallback(
    (emoji) => {
      setMessageInput((prev) => prev + emoji.emoji);
      setEmojiAnchorEl(null);
    },
    []
  );

  return (
    <Box sx={{ ...inputAreaStyles, bgcolor: chatBackground || 'grey.50' }} aria-label="Chat input area">
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 1, width: '100%' }}
          aria-live="assertive"
        >
          {error}
        </Alert>
      )}
      <AnimatePresence>
        {replyToMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%' }}
          >
            <Paper
              sx={{
                p: 1,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
              aria-label="Reply to message"
            >
              <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                <Reply />
              </Avatar>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography variant="caption" color="text.secondary">
                  Replying to {isGroupChat ? getSenderName(replyToMessage.sender_id) : 'message'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {replyToMessage.content?.length > 50
                    ? `${replyToMessage.content.slice(0, 50)}...`
                    : replyToMessage.content || 'Media'}
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
        )}
      </AnimatePresence>
      {pendingMediaList.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {pendingMediaList.map((media, index) => (
            <Chip
              key={index}
              label={media.name || media.file?.name || `Media ${index + 1}`}
              onDelete={() => {
                const newList = pendingMediaList.filter((_, i) => i !== index);
                clearPendingMedia();
                newList.forEach((file) => setPendingMediaFile(file));
              }}
              sx={{ maxWidth: '200px' }}
              aria-label={`Remove ${media.name || `Media ${index + 1}`}`}
            />
          ))}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*,audio/*"
          aria-label="Upload media"
        />
        <Tooltip title="More Options">
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            disabled={isRecording || isSending}
            aria-label="More options"
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          aria-label="Media options menu"
        >
          <MenuItem component="label">
            <AttachFile sx={{ mr: 1 }} /> File
            <input
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e, 'file')}
            />
          </MenuItem>
          <MenuItem component="label">
            <PhotoCamera sx={{ mr: 1 }} /> Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
            />
          </MenuItem>
          <MenuItem component="label">
            <Videocam sx={{ mr: 1 }} /> Video
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={(e) => handleFileUpload(e, 'video')}
            />
          </MenuItem>
          <MenuItem component="label">
            <MusicNote sx={{ mr: 1 }} /> Audio
            <input
              type="file"
              hidden
              accept="audio/*"
              onChange={(e) => handleFileUpload(e, 'voice')}
            />
          </MenuItem>
        </Menu>
        <Tooltip title="Add Emoji">
          <IconButton
            size="small"
            onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
            disabled={isRecording || isSending}
            aria-label="Add emoji"
          >
            <EmojiEmotions />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={emojiAnchorEl}
          open={Boolean(emojiAnchorEl)}
          onClose={() => setEmojiAnchorEl(null)}
          aria-label="Emoji picker"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Menu>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{ backgroundColor: 'white', flex: 1 }}
          disabled={isRecording || isSending}
          multiline
          maxRows={4}
          inputProps={{ 'aria-label': 'Message input' }}
        />
        {renderRightButton()}
      </Box>
      <RecorderModal
        open={isModalOpen && recordingType === 'video'}
        onClose={cancelRecording}
        stream={stream}
        recordingTime={recordingTime}
        onStop={stopRecording}
        onCancel={cancelRecording}
      />
      <style>
        {`@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}
      </style>
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
  pendingMediaList: PropTypes.arrayOf(PropTypes.any).isRequired,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string.isRequired,
    content: PropTypes.string,
    sender_id: PropTypes.string,
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
  chatBackground: PropTypes.string,
};

export default React.memo(ChatInput);