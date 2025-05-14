import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  LinearProgress,
} from '@mui/material';
import { PhotoCamera, Mic, VideoCall, Delete } from '@mui/icons-material';
import { actionButtonStyles, cancelButtonStyle, inputStyles } from '../../../styles/BaseStyles';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../../../constants/validations';

const MAX_TWEET_LENGTH = 280;

const TweetPopup = ({ x, y, onSubmit, onClose }) => {
  const [draft, setDraft] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileUrlsRef = useRef(new Map());
  const dialogRef = useRef(null);

  // Focus dialog on mount and cleanup URLs on unmount
  useEffect(() => {
    dialogRef.current?.focus();
    return () => {
      fileUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      fileUrlsRef.current.clear();
    };
  }, []);

  const validateFile = useCallback(file => {
    if (!file) return false;
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      return false;
    }
    return true;
  }, []);

  const handleFileChange = useCallback(
    e => {
      const newFiles = Array.from(e.target.files).filter(validateFile);
      if (newFiles.length + files.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
      setError(null);
    },
    [files, validateFile]
  );

  const removeFile = useCallback(
    index => {
      setFiles(prev => {
        const fileToRemove = prev[index];
        const url = fileUrlsRef.current.get(fileToRemove);
        if (url) {
          URL.revokeObjectURL(url);
          fileUrlsRef.current.delete(fileToRemove);
        }
        return prev.filter((_, i) => i !== index);
      });
    },
    []
  );

  const startRecording = useCallback(
    async type => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          type === 'voice' ? { audio: true } : { audio: true, video: true }
        );
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: type === 'voice' ? 'audio/webm' : 'video/webm' });
          if (blob.size > MAX_FILE_SIZE) {
            setError('Recorded file exceeds 50MB limit');
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          const file = new File([blob], `${type}_${Date.now()}.webm`, { type: blob.type });
          if (!validateFile(file)) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          setFiles(prev => [...prev, file]);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setRecording(stream);
        setRecordingType(type);
        setError(null);
      } catch (err) {
        setError('Failed to start recording. Please check device permissions.');
        console.error('Recording failed:', err);
      }
    },
    [validateFile]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (recording) {
      recording.getTracks().forEach(track => track.stop());
    }
    setRecording(null);
    setRecordingType(null);
  }, [recording]);

  const handleSubmit = useCallback(
    async () => {
      if (!draft.trim() && !files.length) {
        setError('Please add text or files to submit');
        return;
      }
      if (draft.length > MAX_TWEET_LENGTH) {
        setError(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`);
        return;
      }
      if (scheduledAt && new Date(scheduledAt) < new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const contentType = files.length ? files[0].type.split('/')[0] : 'text';
        const content = {
          type: contentType,
          value: draft.trim() || '',
          metadata: {
            files: [],
            style: {},
            hashtags: [],
            mentions: [],
            poll_options: [],
            event_details: {},
            quote_ref: null,
            embed_data: null,
          },
        };
        await onSubmit(content, x, y, scheduledAt || null, files, setUploadProgress);
        setDraft('');
        setFiles([]);
        setScheduledAt('');
        setUploadProgress(0);
        fileUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
        fileUrlsRef.current.clear();
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to submit tweet');
        console.error('Tweet submission failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [draft, files, x, y, scheduledAt, onSubmit, onClose]
  );

  const handleKeyPress = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isSubmitDisabled = useMemo(
    () => loading || (!draft.trim() && !files.length) || draft.length > MAX_TWEET_LENGTH,
    [loading, draft, files]
  );

  return (
    <Paper
      elevation={5}
      sx={{
        position: 'absolute',
        top: y,
        left: x,
        p: 2,
        minWidth: { xs: '280px', sm: '300px' },
        maxWidth: { xs: '90vw', sm: '400px' },
        backgroundColor: 'background.paper',
        borderRadius: 2,
        zIndex: 1200,
      }}
      role="dialog"
      aria-labelledby="tweet-popup-title"
      tabIndex={-1}
      ref={dialogRef}
    >
      <Typography id="tweet-popup-title" sx={{ display: 'none' }}>
        Create a new tweet
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} role="alert">
            {error}
          </Alert>
        )}
        <TextField
          placeholder="What's on your mind?"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
          fullWidth
          multiline
          maxRows={4}
          margin="dense"
          variant="outlined"
          sx={{
            ...inputStyles,
            '& .MuiInputBase-root': { borderRadius: '20px', padding: '8px 16px' },
          }}
          aria-label="Tweet message input"
          inputProps={{ maxLength: MAX_TWEET_LENGTH }}
        />
        <Typography
          variant="caption"
          sx={{
            alignSelf: 'flex-end',
            color: draft.length > MAX_TWEET_LENGTH ? 'error.main' : 'text.secondary',
          }}
        >
          {draft.length}/{MAX_TWEET_LENGTH}
        </Typography>
        {files.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1}>
              {files.slice(0, 4).map((file, index) => {
                const fileUrl = fileUrlsRef.current.get(file) || URL.createObjectURL(file);
                fileUrlsRef.current.set(file, fileUrl);
                return (
                  <Grid item xs={6} key={`file-${index}`}>
                    <Box sx={{ position: 'relative' }}>
                      {file.type.startsWith('image') ? (
                        <img
                          src={fileUrl}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                          onError={() => setError('Failed to load image preview')}
                        />
                      ) : file.type.startsWith('video') ? (
                        <video
                          src={fileUrl}
                          style={{
                            width: '100%',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                          controls
                          onError={() => setError('Failed to load video preview')}
                        />
                      ) : file.type.startsWith('audio') ? (
                        <audio
                          src={fileUrl}
                          controls
                          style={{ width: '100%', height: '80px' }}
                          onError={() => setError('Failed to load audio preview')}
                        />
                      ) : (
                        <Box
                          sx={{
                            p: 1,
                            bgcolor: 'grey.200',
                            borderRadius: 4,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption">File</Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                        }}
                        aria-label={`Remove file ${index + 1}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
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
                            borderRadius: 4,
                          }}
                        >
                          <Typography sx={{ color: 'white' }}>
                            +{files.length - 4}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
        {loading && uploadProgress > 0 && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Uploading: {uploadProgress}%
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <input
            type="file"
            accept={SUPPORTED_MIME_TYPES.join(',')}
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
            aria-hidden="true"
          />
          <IconButton
            onClick={() => fileInputRef.current.click()}
            sx={{ color: 'text.secondary' }}
            aria-label="Upload image, video, or audio"
          >
            <PhotoCamera />
          </IconButton>
          <IconButton
            onClick={() => startRecording('voice')}
            disabled={!!recording}
            sx={{
              color: recordingType === 'voice' ? 'primary.main' : 'text.secondary',
            }}
            aria-label="Record voice message"
          >
            <Mic />
          </IconButton>
          <IconButton
            onClick={() => startRecording('video_message')}
            disabled={!!recording}
            sx={{
              color: recordingType === 'video_message' ? 'primary.main' : 'text.secondary',
            }}
            aria-label="Record video message"
          >
            <VideoCall />
          </IconButton>
          {recording && (
            <Button
              onClick={stopRecording}
              variant="contained"
              color="error"
              size="small"
              aria-label="Stop recording"
            >
              Stop
            </Button>
          )}
        </Box>
        <TextField
          label="Schedule (optional)"
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={inputStyles}
          aria-label="Schedule tweet"
          inputProps={{
            min: new Date().toISOString().slice(0, 16),
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly', mt: 2 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={actionButtonStyles}
            disabled={isSubmitDisabled}
            aria-label="Submit tweet"
          >
            {loading ? <CircularProgress size={24} /> : 'Add Post'}
          </Button>
          <Button
            onClick={onClose}
            variant="contained"
            sx={cancelButtonStyle}
            aria-label="Cancel tweet"
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

TweetPopup.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default memo(TweetPopup);