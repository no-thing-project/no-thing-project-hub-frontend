import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Collapse,
  Tooltip,
} from '@mui/material';
import { PhotoCamera, Mic, Videocam, Stop, Schedule } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { isEqual } from 'lodash';
import TweetPopupStyles from './TweetPopupStyles'; // Updated import
import { useFileUpload } from '../../../hooks/useFileUpload';
import { SUPPORTED_MIME_TYPES } from '../../../constants/validations';

const MAX_TWEET_LENGTH = 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const RECORDING_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const POPUP_WIDTH = 320;
const POPUP_HEIGHT = 400;

const TweetPopup = ({ x, y, onSubmit, onClose, parentTweet, onBoardUpdate }) => {
  const [form, setForm] = useState({ draft: '', scheduledAt: '' });
  const [recording, setRecording] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const dialogRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const { files, handleFileChange, removeFile, cleanup, fileUrlsRef } = useFileUpload();

  useEffect(() => {
    dialogRef.current?.focus();
    return () => {
      cleanup();
      stopRecording();
    };
  }, [cleanup]);

  useEffect(() => {
    if (recording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next * 1000 >= RECORDING_TIMEOUT) {
            stopRecording();
            setError('Recording stopped: Maximum duration reached (5 minutes).');
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [recording]);

  useEffect(() => {
    if (recording && recordingType === 'video_message' && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = recording;
      videoPreviewRef.current.play().catch((err) => {
        console.error('Video preview error:', err);
        setError('Failed to display video preview.');
      });
    }
    return () => {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    };
  }, [recording, recordingType]);

  const startRecording = useCallback(
    async (type) => {
      try {
        const constraints = type === 'voice' ? { audio: true } : { audio: true, video: { width: 1280, height: 720 } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: type === 'voice' ? 'audio/webm' : 'video/webm;codecs=vp8,opus',
        });
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const mimeType = type === 'voice' ? 'audio/webm' : 'video/webm';
          const blob = new Blob(chunks, { type: mimeType });
          const fileName = `${type}_${Date.now()}.webm`;
          const file = new File([blob], fileName, { type: mimeType });
          if (blob.size > MAX_FILE_SIZE) {
            setError('Recorded file exceeds 50MB limit.');
            return;
          }
          handleFileChange({ target: { files: [file] } });
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
        setRecording(stream);
        setRecordingType(type);
        setRecordingTime(0);
        setError(null);
      } catch (err) {
        setError('Failed to start recording. Please check microphone/camera permissions.');
        console.error('Recording error:', err);
      }
    },
    [handleFileChange]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (recording) {
      recording.getTracks().forEach((track) => track.stop());
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setRecording(null);
    setRecordingType(null);
    setRecordingTime(0);
    clearInterval(recordingTimerRef.current);
  }, [recording]);

  const handleFileInputChange = useCallback(
    (e) => {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter((file) => {
        if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
          setError(`Unsupported file type: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`File too large: ${file.name} exceeds 50MB limit`);
          return false;
        }
        return true;
      });
      if (validFiles.length) {
        handleFileChange({ target: { files: validFiles } });
        setError(null);
      }
      fileInputRef.current.value = null;
    },
    [handleFileChange]
  );

  const handleSubmit = useCallback(
    async () => {
      if (!form.draft.trim() && !files.length) {
        setError('Please add text or media to submit.');
        return;
      }
      if (form.draft.length > MAX_TWEET_LENGTH) {
        setError(`Tweet exceeds ${MAX_TWEET_LENGTH} character limit.`);
        return;
      }
      if (form.scheduledAt && new Date(form.scheduledAt) < new Date()) {
        setError('Scheduled time must be in the future.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const contentType = files.length ? files[0].type.split('/')[0] : 'text';
        const content = {
          type: contentType,
          value: form.draft.trim() || '',
          metadata: {
            files: files.map((file, index) => ({
              fileKey: file.name,
              url: fileUrlsRef.current.get(file) || URL.createObjectURL(file),
              contentType: file.type,
              duration: file.type.startsWith('video') ? 0 : undefined,
            })),
            style: {},
            hashtags: [],
            mentions: [],
            poll_options: [],
            event_details: {},
            quote_ref: null,
            embed_data: null,
          },
        };
        const position = parentTweet
          ? { x: parentTweet.position.x, y: parentTweet.position.y + 180 } // Position below parent
          : { x, y: y + 180 };
        const newTweet = await onSubmit(
          content,
          position.x,
          position.y,
          form.scheduledAt || null,
          files,
          (progress) => setUploadProgress(progress),
          parentTweet?.tweet_id || null
        );
        if (onBoardUpdate && newTweet) {
          onBoardUpdate(newTweet); // Update board state
        }
        setSubmitSuccess(true);
        setTimeout(() => {
          setForm({ draft: '', scheduledAt: '' });
          cleanup();
          onClose();
          setSubmitSuccess(false);
        }, 500); // Delay for success animation
      } catch (err) {
        setError(err.message || 'Failed to submit tweet.');
        console.error('Submit error:', err);
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    },
    [form, files, onSubmit, cleanup, onClose, fileUrlsRef, parentTweet, x, y, onBoardUpdate]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !recording) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, recording]
  );

  const isSubmitDisabled = useMemo(
    () =>
      loading ||
      (!form.draft.trim() && !files.length) ||
      form.draft.length > MAX_TWEET_LENGTH ||
      !!recording,
    [loading, form.draft, files, recording]
  );

  const renderFilePreview = useCallback(
    (file, index) => {
      const fileUrl = fileUrlsRef.current.get(file) || URL.createObjectURL(file);
      fileUrlsRef.current.set(file, fileUrl);

      return (
        <Grid item xs={6} sm={3} key={`file-${index}`}>
          <Box sx={TweetPopupStyles.popupFilePreviewContainer}> 
            {file.type.startsWith('image') ? (
              <LazyLoadImage
                src={fileUrl}
                alt={`Preview ${index + 1}`}
                style={TweetPopupStyles.popupPreviewMedia} 
                effect="blur"
                placeholder={<Box sx={TweetPopupStyles.popupPreviewPlaceholder}>Loading Image...</Box>} 
              />
            ) : file.type.startsWith('video') ? (
              <video
                src={fileUrl}
                style={TweetPopupStyles.popupCirclePreviewMedia} 
                controls
                preload="metadata"
                poster={fileUrl + '#t=0.1'}
                aria-label={`Video preview ${index + 1}`}
              />
            ) : file.type.startsWith('audio') ? (
              <Box sx={TweetPopupStyles.popupAudioPlayer}> 
                <audio
                  src={fileUrl}
                  controls
                  style={{ width: '100%' }}
                  preload="metadata"
                  aria-label={`Audio preview ${index + 1}`}
                />
              </Box>
            ) : (
              <Box sx={TweetPopupStyles.popupPreviewPlaceholder}> 
                <Typography variant="caption">File: {file.name}</Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={() => removeFile(index)}
              sx={TweetPopupStyles.popupDeleteFileButton} 
              aria-label={`Remove file ${index + 1}`}
            >
              <Stop fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      );
    },
    [removeFile, fileUrlsRef]
  );

  const recordingStatus = useMemo(() => {
    if (!recording) return null;
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    const label = `Recording ${recordingType === 'voice' ? 'Audio' : 'Video'}: ${minutes}:${seconds
      .toString()
      .padStart(2, '0')}`;

    return (
      <Box sx={TweetPopupStyles.popupRecordingContainer}> 
        <Chip
          label={label}
          sx={TweetPopupStyles.popupRecordingChip} 
          aria-label={`Recording ${recordingType} duration`}
        />
        {recordingType === 'video_message' ? (
          <Box sx={TweetPopupStyles.popupVideoPreviewContainer}> 
            <video
              ref={videoPreviewRef}
              style={TweetPopupStyles.popupLivePreview} 
              muted
              autoPlay
              aria-label="Live video recording preview"
            />
          </Box>
        ) : (
          <Box sx={TweetPopupStyles.popupAudioPreviewContainer}> 
            <Box sx={TweetPopupStyles.popupAudioVisualizer}> 
              {[...Array(12)].map((_, i) => (
                <Box key={i} sx={TweetPopupStyles.popupVisualizerBar(i)} /> 
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }, [recording, recordingType, recordingTime]);

  const renderMediaButtons = useMemo(() => {
    const toggleRecording = (type) => () =>
      recordingType === type ? stopRecording() : startRecording(type);

    return (
      <Box sx={TweetPopupStyles.popupInputBar}> 
        <input
          type="file"
          accept={SUPPORTED_MIME_TYPES.join(',')}
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
          disabled={loading || recording}
        />
        <Tooltip title="Upload Media" placement="top">
          <IconButton
            onClick={() => fileInputRef.current.click()}
            sx={TweetPopupStyles.popupMediaButton(false)} 
            aria-label="Upload media"
            disabled={loading || recording}
          >
            <PhotoCamera fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={recordingType === 'voice' ? 'Stop Audio Recording' : 'Start Audio Recording'} placement="top">
          <IconButton
            onClick={toggleRecording('voice')}
            sx={TweetPopupStyles.popupMediaButton(recordingType === 'voice')} 
            aria-label={recordingType === 'voice' ? 'Stop audio recording' : 'Start audio recording'}
            disabled={loading}
          >
            {recordingType === 'voice' ? <Stop fontSize="small" /> : <Mic fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={recordingType === 'video_message' ? 'Stop Video Recording' : 'Start Video Recording'} placement="top">
          <IconButton
            onClick={toggleRecording('video_message')}
            sx={TweetPopupStyles.popupMediaButton(recordingType === 'video_message')} 
            aria-label={recordingType === 'video_message' ? 'Stop video recording' : 'Start video recording'}
            disabled={loading}
          >
            {recordingType === 'video_message' ? <Stop fontSize="small" /> : <Videocam fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  }, [recordingType, recording, loading, handleFileInputChange, startRecording, stopRecording]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: submitSuccess ? 1.05 : 1 }}
      transition={{ duration: 0.3 }}
    >
      <Dialog
        open={true}
        onClose={onClose}
        PaperProps={{ sx: TweetPopupStyles.popupDialogPaper }} 
        style={{ '& .MuiBackdrop-root': TweetPopupStyles.popupDialogBackdrop }} 
        aria-labelledby="tweet-popup-title"
        ref={dialogRef}
      >
        <Typography id="tweet-popup-title" sx={TweetPopupStyles.popupTitle}> 
          {parentTweet ? 'Reply to Tweet' : 'Create a new tweet'}
        </Typography>
        <Box sx={TweetPopupStyles.popupContentBox}> 
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={TweetPopupStyles.popupErrorAlert}> 
              {error}
            </Alert>
          )}
          {parentTweet && (
            <Typography variant="caption" sx={TweetPopupStyles.popupParentTweetCaption}> 
              Replying to {parentTweet.username || 'Anonymous'}
            </Typography>
          )}
          <TextField
            placeholder={parentTweet ? 'Write your reply...' : "What's on your mind?"}
            value={form.draft}
            onChange={(e) => setForm((prev) => ({ ...prev, draft: e.target.value }))}
            onKeyPress={handleKeyPress}
            autoFocus
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            sx={TweetPopupStyles.popupTextField} 
            inputProps={{ maxLength: MAX_TWEET_LENGTH }}
            aria-label={parentTweet ? 'Reply content' : 'Tweet content'}
            disabled={loading}
          />
          <Typography
            variant="caption"
            sx={TweetPopupStyles.popupCharCount(form.draft.length > MAX_TWEET_LENGTH)} 
          >
            {form.draft.length}/{MAX_TWEET_LENGTH}
          </Typography>
          {files.length > 0 && (
            <Box sx={TweetPopupStyles.popupFilePreviewContainer}> 
              <Grid container spacing={1}>
                {files.slice(0, 4).map((file, index) => renderFilePreview(file, index))}
              </Grid>
              {files.length > 4 && (
                <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                  +{files.length - 4} more file(s)
                </Typography>
              )}
            </Box>
          )}
          {recordingStatus}
          {loading && uploadProgress > 0 && (
            <Box sx={TweetPopupStyles.popupProgressContainer}> 
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Uploading: {uploadProgress}%
              </Typography>
            </Box>
          )}
          {renderMediaButtons}
          <Button
            onClick={() => setShowSchedule((prev) => !prev)}
            startIcon={<Schedule />}
            variant="text"
            size="small"
            style={TweetPopupStyles.popupScheduleButton} 
            aria-label={showSchedule ? 'Hide schedule' : 'Show schedule'}
          >
            {showSchedule ? 'Hide Schedule' : 'Schedule Post'}
          </Button>
          <Collapse in={showSchedule} timeout="auto">
            <TextField
              label="Schedule (optional)"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              style={TweetPopupStyles.popupTextField} 
              inputProps={{ min: new Date().toISOString().slice(0, 16) }}
              aria-label="Schedule tweet"
              disabled={loading || recording}
            />
          </Collapse>
          <Box sx={TweetPopupStyles.popupButtonContainer}> 
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              style={TweetPopupStyles.popupActionButton} 
              disabled={isSubmitDisabled}
              aria-label={parentTweet ? 'Submit reply' : 'Submit tweet'}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : parentTweet ? 'Reply' : 'Add Post'}
            </Button>
            <Button
              onClick={onClose}
              variant="contained"
              style={TweetPopupStyles.popupCancelButton} 
              aria-label="Cancel tweet creation"
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </motion.div>
  );
};

TweetPopup.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  parentTweet: PropTypes.shape({
    tweet_id: PropTypes.string,
    username: PropTypes.string,
    position: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  }),
  onBoardUpdate: PropTypes.func,
};

TweetPopup.defaultProps = {
  parentTweet: null,
  onBoardUpdate: null,
};

const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.onSubmit === nextProps.onSubmit &&
    prevProps.onClose === nextProps.onClose &&
    isEqual(prevProps.parentTweet, nextProps.parentTweet) &&
    prevProps.onBoardUpdate === nextProps.onBoardUpdate
  );
};

export default memo(TweetPopup, arePropsEqual);