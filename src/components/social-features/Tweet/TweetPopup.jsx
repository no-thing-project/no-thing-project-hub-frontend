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
import { useFileUpload } from '../../../hooks/useFileUpload';
import { SUPPORTED_MIME_TYPES } from '../../../constants/validations';

const MAX_TWEET_LENGTH = 1000;

const TweetPopup = ({ x, y, onSubmit, onClose }) => {
  const [form, setForm] = useState({ draft: '', scheduledAt: '' });
  const [recording, setRecording] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const dialogRef = useRef(null);
  const { files, handleFileChange, removeFile, cleanup, fileUrlsRef } = useFileUpload();

  useEffect(() => {
    dialogRef.current?.focus();
    return () => {
      cleanup();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recording) {
        recording.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recording, cleanup]);

  // Start recording
  const startRecording = useCallback(
    async (type) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          type === 'voice' ? { audio: true } : { audio: true, video: true }
        );
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: type === 'voice' ? 'audio/webm' : 'video/webm' });
          const file = new File([blob], `${type}_${Date.now()}.webm`, { type: blob.type });
          handleFileChange({ target: { files: [file] } });
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setRecording(stream);
        setRecordingType(type);
      } catch (err) {
        setError('Failed to start recording. Please check permissions.');
      }
    },
    [handleFileChange]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (recording) {
      recording.getTracks().forEach((track) => track.stop());
    }
    setRecording(null);
    setRecordingType(null);
  }, [recording]);

  // Submit handler
  const handleSubmit = useCallback(
    async () => {
      if (!form.draft.trim() && !files.length) {
        setError('Please add text or files to submit');
        return;
      }
      if (form.draft.length > MAX_TWEET_LENGTH) {
        setError(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit`);
        return;
      }
      if (form.scheduledAt && new Date(form.scheduledAt) < new Date()) {
        setError('Scheduled time must be in the future');
        return;
      }
      setLoading(true);
      try {
        const contentType = files.length ? files[0].type.split('/')[0] : 'text';
        const content = {
          type: contentType,
          value: form.draft.trim() || '',
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
        await onSubmit(content, x, y, form.scheduledAt || null, files, setUploadProgress);
        setForm({ draft: '', scheduledAt: '' });
        cleanup();
      } catch (err) {
        setError(err.message || 'Failed to submit tweet');
      } finally {
        setLoading(false);
      }
    },
    [form, files, x, y, onSubmit, cleanup]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const isSubmitDisabled = useMemo(
    () => loading || (!form.draft.trim() && !files.length) || form.draft.length > MAX_TWEET_LENGTH,
    [loading, form.draft, files]
  );

  const renderFilePreview = useCallback(
    (file, index) => {
      const fileUrl = fileUrlsRef.current.get(file) || URL.createObjectURL(file);
      fileUrlsRef.current.set(file, fileUrl);
      const previewStyle = {
        width: '100%',
        height: '80px',
        objectFit: 'cover',
        borderRadius: 4,
      };

      return (
        <Grid item xs={6} key={`file-${index}`}>
          <Box sx={{ position: 'relative' }}>
            {file.type.startsWith('image') ? (
              <img src={fileUrl} alt={`Preview ${index + 1}`} style={previewStyle} />
            ) : file.type.startsWith('video') ? (
              <video src={fileUrl} style={previewStyle} controls />
            ) : file.type.startsWith('audio') ? (
              <audio src={fileUrl} controls style={{ width: '100%', height: '80px' }} />
            ) : (
              <Box sx={{ p: 1, bgcolor: 'grey.200', borderRadius: 4, textAlign: 'center' }}>
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
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      );
    },
    [removeFile]
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
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
      role="dialog"
      aria-labelledby="tweet-popup-title"
      ref={dialogRef}
    >
      <Typography id="tweet-popup-title" sx={{ display: 'none' }}>
        Create a new tweet
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        <TextField
          placeholder="What's on your mind?"
          value={form.draft}
          onChange={(e) => setForm((prev) => ({ ...prev, draft: e.target.value }))}
          onKeyPress={handleKeyPress}
          autoFocus
          fullWidth
          multiline
          maxRows={4}
          margin="dense"
          variant="outlined"
          sx={{ ...inputStyles, '& .MuiInputBase-root': { borderRadius: '20px', padding: '8px 16px' } }}
          inputProps={{ maxLength: MAX_TWEET_LENGTH }}
          aria-label="Tweet content"
        />
        <Typography
          variant="caption"
          sx={{
            alignSelf: 'flex-end',
            color: form.draft.length > MAX_TWEET_LENGTH ? 'error.main' : 'text.secondary',
          }}
        >
          {form.draft.length}/{MAX_TWEET_LENGTH}
        </Typography>
        {files.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1}>
              {files.slice(0, 4).map((file, index) => renderFilePreview(file, index))}
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
          />
          <IconButton
            onClick={() => fileInputRef.current.click()}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            aria-label="Upload media"
          >
            <PhotoCamera />
          </IconButton>
          <IconButton
            onClick={() => startRecording('voice')}
            disabled={!!recording}
            sx={{
              color: recordingType === 'voice' ? 'primary.main' : 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
            aria-label="Record audio"
          >
            <Mic />
          </IconButton>
          <IconButton
            onClick={() => startRecording('video_message')}
            disabled={!!recording}
            sx={{
              color: recordingType === 'video_message' ? 'primary.main' : 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
            aria-label="Record video"
          >
            <VideoCall />
          </IconButton>
          {recording && (
            <Button
              onClick={stopRecording}
              variant="contained"
              color="error"
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none' }}
              aria-label="Stop recording"
            >
              Stop Recording
            </Button>
          )}
        </Box>
        <TextField
          label="Schedule (optional)"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={inputStyles}
          inputProps={{ min: new Date().toISOString().slice(0, 16) }}
          aria-label="Schedule tweet"
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly', mt: 2, gap: 1 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={actionButtonStyles}
            disabled={isSubmitDisabled}
            aria-label="Submit tweet"
          >
            {loading ? <CircularProgress size={24} /> : 'Add Post'}
          </Button>
          <Button onClick={onClose} variant="contained" sx={cancelButtonStyle} aria-label="Cancel tweet creation">
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