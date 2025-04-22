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
  Alert,
} from '@mui/material';
import {
  Send,
  Mic,
  Videocam,
  AttachFile,
  Stop,
  Clear,
  EmojiEmotions,
  PhotoCamera,
  MusicNote,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import RecorderModal from '../RecorderModal';

const inputAreaStyles = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  backgroundColor: 'grey.50',
  borderRadius: '0 0 8px 8px',
};

const quickEmojis = ['😊', '👍', '❤️', '😂', '😍'];

const useMessageSend = ({ conversationId, messageInput, pendingMediaList, replyToMessage, onSendMediaMessage, clearPendingMedia, setReplyToMessage }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSend = useCallback(async () => {
    if (!messageInput.trim() && !pendingMediaList.length) return false;
    setIsSending(true);
    setError(null);

    const messageData = {
      conversationId,
      content: messageInput.trim() || (pendingMediaList.length ? 'Media message' : ''),
      media: pendingMediaList,
      replyTo: replyToMessage?.message_id || null,
      selectedText: replyToMessage?.selectedText || null,
      thread_id: replyToMessage?.thread_id || null,
    };

    try {
      await onSendMediaMessage(messageData);
      clearPendingMedia();
      setReplyToMessage(null);
      return true;
    } catch (err) {
      setError('Failed to send message.');
      console.error('Send message error:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [messageInput, pendingMediaList, replyToMessage, conversationId, onSendMediaMessage, clearPendingMedia, setReplyToMessage]);

  return { handleSend, isSending, error, setError };
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
  socket,
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState('voice');
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const { handleSend, isSending, error, setError } = useMessageSend({
    conversationId,
    messageInput,
    pendingMediaList,
    replyToMessage,
    onSendMediaMessage,
    clearPendingMedia,
    setReplyToMessage,
  });

  // Typing indicator
  useEffect(() => {
    if (!socket || isGroupChat || !recipient?.anonymous_id) return;
    if (messageInput.trim()) {
      socket.emit('typing', { userId: currentUserId, conversationId, status: true });
    } else {
      socket.emit('typing', { userId: currentUserId, conversationId, status: false });
    }
  }, [socket, messageInput, isGroupChat, recipient?.anonymous_id, currentUserId, conversationId]);

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

  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => setPendingMediaFile(file));
    setAnchorEl(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  }, [setPendingMediaFile]);

  const startRecording = useCallback(async (type) => {
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
  }, [setPendingMediaFile, setError]);

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

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey && !isSending) {
      event.preventDefault();
      handleSend().then((success) => {
        if (success) setMessageInput('');
      });
    }
  }, [handleSend, isSending]);

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const getSenderName = useCallback((senderId) => {
    if (senderId === currentUserId) return 'You';
    const friend = friends.find((f) => f.anonymous_id === senderId);
    return friend?.username || 'Unknown';
  }, [currentUserId, friends]);

  const handleQuickEmoji = (emoji) => {
    setMessageInput((prev) => prev + emoji);
  };

  const renderRightButton = () => {
    if (isRecording) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="error">
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
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
          <Button
            variant="contained"
            onClick={() => handleSend().then((success) => success && setMessageInput(''))}
            startIcon={isSending ? <CircularProgress size={16} /> : <Send />}
            disabled={isSending}
            sx={{ minWidth: '100px', borderRadius: 1 }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </motion.div>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={recordingType === 'video' ? 'Switch to Voice' : 'Switch to Video'}>
          <IconButton size="small" onClick={() => setRecordingType(recordingType === 'video' ? 'voice' : 'video')}>
            {recordingType === 'video' ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
        <Tooltip title={`Start ${recordingType} Recording`}>
          <IconButton size="small" onClick={() => startRecording(recordingType)}>
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

  const renderReplyPreview = replyToMessage && (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
      <Box
        sx={{ p: 1, mb: 1, bgcolor: 'grey.100', borderLeft: '3px solid', borderColor: 'primary.main', borderRadius: 1 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          Replying to {getSenderName(replyToMessage.sender_id)}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }} noWrap>
          {replyToMessage.content?.length > 50 ? `${replyToMessage.content.slice(0, 50)}...` : replyToMessage.content}
        </Typography>
        <IconButton size="small" onClick={() => setReplyToMessage(null)}>
          <Clear />
        </IconButton>
      </Box>
    </motion.div>
  );

  return (
    <Box sx={inputAreaStyles}>
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
            {error}
          </Alert>
        </motion.div>
      )}
      {renderReplyPreview}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {quickEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => handleQuickEmoji(emoji)}
              size="small"
              disabled={isSending}
            >
              {emoji}
            </IconButton>
          ))}
          <IconButton onClick={handleEmojiOpen} sx={{ alignSelf: 'center' }} disabled={isSending}>
            <EmojiEmotions />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          variant="outlined"
          sx={{ bgcolor: 'white', borderRadius: 1, '& .MuiOutlinedInput-root': { borderRadius: 1, minHeight: 40 } }}
          disabled={isRecording || isSending}
        />
        <IconButton onClick={handleMenuOpen} sx={{ alignSelf: 'center' }} disabled={isSending}>
          <AttachFile />
        </IconButton>
        {renderRightButton()}
      </Box>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <PhotoCamera sx={{ mr: 1 }} /> Photo
        </MenuItem>
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <Videocam sx={{ mr: 1 }} /> Video
        </MenuItem>
        <MenuItem onClick={() => fileInputRef.current?.click()}>
          <MusicNote sx={{ mr: 1 }} /> Audio
        </MenuItem>
      </Menu>
      <Menu anchorEl={emojiAnchorEl} open={Boolean(emojiAnchorEl)} onClose={handleEmojiClose}>
        <MenuItem sx={{ p: 0 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </MenuItem>
      </Menu>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*"
        multiple
        onChange={handleFileUpload}
      />
      <RecorderModal open={isModalOpen} onClose={cancelRecording} stream={stream} recordingTime={recordingTime} onStop={stopRecording} recordingType={recordingType} />
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
      preview: PropTypes.string,
      type: PropTypes.string,
    })
  ).isRequired,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    content: PropTypes.string,
    sender_id: PropTypes.string,
    selectedText: PropTypes.string,
    thread_id: PropTypes.string,
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
  socket: PropTypes.object,
};

export default React.memo(ChatInput);