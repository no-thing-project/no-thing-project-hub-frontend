// src/components/ChatInput.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  Popper,
  Paper,
  ClickAwayListener,
  Fade,
  Menu,
  MenuItem,
  Alert,
  Button,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Mic,
  Stop,
  Close,
  Reply,
  EmojiEmotions,
  PhotoCamera,
  Videocam,
  MusicNote,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { debounce } from 'lodash';
import { useNotification } from '../../../context/NotificationContext';
import MediaPreview from '../MediaPreview';
import RecorderModal from '../RecorderModal';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../../../constants/validations';

const inputAreaStyles = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  backgroundColor: 'grey.50',
  borderRadius: '0 0 8px 8px',
};

const quickEmojis = ['😊', '👍', '❤️'];

const ChatInput = ({
  conversationId,
  recipient,
  onSendMessage,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  token,
  currentUserId,
  friends,
  socket,
  onTyping,
}) => {
  const theme = useTheme();
  const { showNotification } = useNotification();
  const [messageInput, setMessageInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState('voice');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Validate conversationId
  useEffect(() => {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || typeof conversationId !== 'string' || !uuidPattern.test(conversationId)) {
      const errorMsg = 'Invalid conversation ID';
      console.warn('[ChatInput] Validation error:', errorMsg, { conversationId });
      setError(errorMsg);
    } else {
      console.log('[ChatInput] conversationId:', conversationId);
      setError(null);
    }
  }, [conversationId]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    }
    setRecordingTime(0);
  }, [isRecording]);

  // Cleanup on recipient change
  useEffect(() => {
    return () => {
      setFiles([]);
      setReplyToMessage(null);
      cancelRecording();
    };
  }, [recipient, setReplyToMessage]);

  // Debounced typing indicator
  const emitTyping = useCallback(
    debounce((status) => {
      if (socket?.connected && conversationId) {
        socket.emit('typing', { userId: currentUserId, conversationId, status });
        if (!status) {
          socket.emit('stopTyping', { conversationId });
        }
      }
    }, 300),
    [socket, conversationId, currentUserId]
  );

  // Trigger typing events
  useEffect(() => {
    if (messageInput.trim() && !isSending) {
      emitTyping(true);
    } else {
      emitTyping(false);
    }
    return () => emitTyping.cancel();
  }, [messageInput, emitTyping, isSending]);

  // File upload handler
  const uploadFiles = useCallback(
    async (selectedFiles) => {
      const media = [];
      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
        if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}`);
        }
        // Simulate file upload (replace with actual API call)
        const url = URL.createObjectURL(file);
        media.push({
          type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'voice' : 'file',
          content: url,
          contentType: file.type,
          metadata: { size: file.size },
        });
      }
      return media;
    },
    []
  );

  // Handle file selection
  const handleFileChange = useCallback(
    (event) => {
      const newFiles = Array.from(event.target.files);
      if (files.length + newFiles.length > MAX_FILES) {
        const errorMsg = `Cannot upload more than ${MAX_FILES} files`;
        setError(errorMsg);
        showNotification(errorMsg, 'error');
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      event.target.value = null;
      setAnchorEl(null);
    },
    [files, showNotification]
  );

  // Remove file
  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Start recording
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
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: type === 'voice' ? 'audio/webm' : 'video/webm' });
          const file = new File([blob], `${type}-${Date.now()}.webm`, { type: blob.type });
          setFiles((prev) => [...prev, file]);
          setIsRecording(false);
          setIsModalOpen(false);
          mediaStream.getTracks().forEach((track) => track.stop());
          setStream(null);
        };
        recorder.start();
        if (type === 'video') setIsModalOpen(true);
      } catch (err) {
        const errorMsg = 'Failed to start recording';
        setError(errorMsg);
        showNotification(errorMsg, 'error');
      }
    },
    [showNotification]
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
  }, [stream]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedInput = messageInput.trim();
    if (!trimmedInput && !files.length) return false;
    if (isSending) return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!conversationId || typeof conversationId !== 'string' || !uuidPattern.test(conversationId)) {
      const errorMsg = 'Cannot send message: Invalid conversation ID';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      return false;
    }

    setIsSending(true);
    setError(null);

    try {
      let media = [];
      if (files.length) {
        media = await uploadFiles(files);
      }
      const success = await onSendMessage(
        conversationId,
        trimmedInput || undefined,
        media,
        replyToMessage?.message_id,
        undefined, // scheduledAt
        undefined, // forwardedFrom
        replyToMessage?.thread_id // threadId
      );

      if (success) {
        setMessageInput('');
        setFiles([]);
        setReplyToMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        return true;
      }
      setError('Message not sent');
      return false;
    } catch (err) {
      const errorMsg = err.message || 'Failed to send message. Please check your connection';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [
    conversationId,
    messageInput,
    files,
    replyToMessage,
    onSendMessage,
    uploadFiles,
    setReplyToMessage,
    isSending,
    showNotification,
  ]);

  // Handle mention suggestions
  const handleMentionInput = useCallback(
    (e) => {
      const value = e.target.value;
      setMessageInput(value);
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastWord = textBeforeCursor.split(/\s+/).pop();
      if (lastWord.startsWith('@') && lastWord.length > 1) {
        setMentionQuery(lastWord.slice(1).toLowerCase());
        setAnchorEl(e.currentTarget);
      } else {
        setMentionQuery('');
        setAnchorEl(null);
      }
      emitTyping(true);
    },
    [emitTyping]
  );

  // Insert mention
  const insertMention = useCallback(
    (username) => {
      const cursorPos = messageInput.lastIndexOf('@' + mentionQuery);
      const newInput =
        messageInput.slice(0, cursorPos) + '@' + username + ' ' + messageInput.slice(cursorPos + mentionQuery.length + 1);
      setMessageInput(newInput);
      setMentionQuery('');
      setAnchorEl(null);
    },
    [messageInput, mentionQuery]
  );

  // Filtered friends for mentions
  const filteredFriends = useMemo(
    () =>
      mentionQuery
        ? friends.filter((friend) =>
            friend.username?.toLowerCase().includes(mentionQuery)
          )
        : [],
    [friends, mentionQuery]
  );

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !isSending) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, isSending]
  );

  // Quick emoji handler
  const handleQuickEmoji = useCallback((emoji) => {
    setMessageInput((prev) => prev + emoji);
  }, []);

  // Emoji picker handlers
  const handleEmojiOpen = useCallback((event) => setEmojiAnchorEl(event.currentTarget), []);
  const handleEmojiClose = useCallback(() => setEmojiAnchorEl(null), []);
  const handleEmojiClick = useCallback(
    (emojiObject) => {
      setMessageInput((prev) => prev + emojiObject.emoji);
      handleEmojiClose();
    },
    [handleEmojiClose]
  );

  // Attachment menu handlers
  const handleMenuOpen = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  // Get sender name for reply preview
  const getSenderName = useCallback(
    (senderId) => {
      if (senderId === currentUserId) return 'You';
      const friend = friends.find((f) => f.anonymous_id === senderId);
      return friend?.username || 'Unknown';
    },
    [currentUserId, friends]
  );

  // Format recording time
  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  // Render right button (send or record)
  const renderRightButton = useCallback(() => {
    if (isRecording) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="error">
            {formatTime(recordingTime)}
          </Typography>
          <Tooltip title={`Stop ${recordingType} Recording`}>
            <IconButton size="small" onClick={stopRecording} aria-label="Stop recording">
              <Stop />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Recording">
            <IconButton size="small" onClick={cancelRecording} aria-label="Cancel recording">
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }
    if (messageInput.trim() || files.length > 0) {
      return (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="contained"
            onClick={handleSend}
            startIcon={isSending ? <CircularProgress size="16" /> : <Send />}
            disabled={isSending}
            sx={{ minWidth: '100px', borderRadius: 1 }}
            aria-label="Send message"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </motion.div>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={recordingType === 'video' ? 'Switch to Voice' : 'Switch to Video'}>
          <IconButton
            size="small"
            onClick={() => setRecordingType(recordingType === 'video' ? 'voice' : 'video')}
            aria-label="Switch recording type"
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
  }, [
    isRecording,
    recordingType,
    recordingTime,
    messageInput,
    files,
    isSending,
    handleSend,
    stopRecording,
    cancelRecording,
    startRecording,
  ]);

  // Render reply preview
  const renderReplyPreview = replyToMessage && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <Box
        sx={{
          p: 1,
          mb: 1,
          bgcolor: 'grey.100',
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        aria-label="Reply preview"
      >
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Replying to message by {getSenderName(replyToMessage.sender_id)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}
            noWrap
          >
            {replyToMessage.content?.length > 50
              ? `${replyToMessage.content.slice(0, 50)}...`
              : replyToMessage.content || 'Media message'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => setReplyToMessage(null)}
          aria-label="Cancel reply"
        >
          <Close />
        </IconButton>
      </Box>
    </motion.div>
  );

  return (
    <Box sx={inputAreaStyles} role="region" aria-label="Message input area">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
              {error}
              {error.includes('Failed to send') && (
                <Button size="small" onClick={handleSend}>
                  Retry
                </Button>
              )}
            </Alert>
          </motion.div>
        )}
        {renderReplyPreview}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {files.map((file, index) => (
                <MediaPreview
                  key={index}
                  file={file}
                  onRemove={() => removeFile(index)}
                  maxWidth={80}
                  maxHeight={80}
                />
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {quickEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => handleQuickEmoji(emoji)}
              size="small"
              disabled={isSending || isRecording}
              aria-label={`Add ${emoji} emoji`}
            >
              {emoji}
            </IconButton>
          ))}
          <IconButton
            onClick={handleEmojiOpen}
            size="small"
            disabled={isSending || isRecording}
            aria-label="Open emoji picker"
          >
            <EmojiEmotions />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={messageInput}
          onChange={handleMentionInput}
          onKeyPress={handleKeyPress}
          placeholder={isGroupChat ? 'Message the group...' : `Message ${recipient?.username || 'user'}...`}
          variant="outlined"
          disabled={isSending || isRecording}
          sx={{
            bgcolor: 'white',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 1, minHeight: 40 },
          }}
          inputProps={{ 'aria-label': 'Message input' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Attach files">
                  <IconButton
                    component="label"
                    disabled={isSending || isRecording}
                    aria-label="Open attachment menu"
                    onClick={handleMenuOpen}
                  >
                    <AttachFile fontSize="small" />
                  </IconButton>
                </Tooltip>
                {renderRightButton()}
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Popper open={!!anchorEl && filteredFriends.length > 0} anchorEl={anchorEl} transition>
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper
                sx={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  mt: 1,
                  p: 1,
                  minWidth: 150,
                }}
              >
                {filteredFriends.map((friend) => (
                  <Chip
                    key={friend.anonymous_id}
                    label={`@${friend.username}`}
                    onClick={() => insertMention(friend.username)}
                    sx={{ m: 0.5, cursor: 'pointer' }}
                  />
                ))}
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
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
        accept={SUPPORTED_MIME_TYPES.join(',')}
        multiple
        onChange={handleFileChange}
        aria-hidden="true"
      />
      <RecorderModal
        open={isModalOpen}
        onClose={cancelRecording}
        stream={stream}
        recordingTime={recordingTime}
        onStop={stopRecording}
        recordingType={recordingType}
      />
    </Box>
  );
};

ChatInput.propTypes = {
  conversationId: PropTypes.string.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string,
    name: PropTypes.string,
    username: PropTypes.string,
    conversation_id: PropTypes.string,
  }).isRequired,
  onSendMessage: PropTypes.func.isRequired,
  replyToMessage: PropTypes.shape({
    message_id: PropTypes.string,
    content: PropTypes.string,
    sender_id: PropTypes.string,
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
  onTyping: PropTypes.func.isRequired,
};

export default React.memo(ChatInput);