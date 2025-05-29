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
  Menu,
  MenuItem,
  useMediaQuery,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { Mic, Videocam, Stop, Schedule, Pause, Delete, PlayArrow, Close, AttachFile } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { isEqual } from 'lodash';
import { useDrag } from '@use-gesture/react';
import TweetPopupStyles from './TweetPopupStyles';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { SUPPORTED_MIME_TYPES } from '../../../constants/validations';
import axios from 'axios';
import URLParse from 'url-parse';
import { Link } from 'react-router-dom';

const MAX_TWEET_LENGTH = 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const RECORDING_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 440;
const LONG_PRESS_DELAY = 500; // 500ms for long-press

const TweetPopup = ({ x, y, onSubmit, onClose, parentTweet, onBoardUpdate }) => {
  const [form, setForm] = useState({ draft: '', scheduledAt: '' });
  const [recording, setRecording] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState('voice');
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const dialogRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const { files, handleFileChange, removeFile, cleanup, fileUrlsRef } = useFileUpload();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  const bindDrag = useDrag(({ movement: [mx], event }) => {
    if (Math.abs(mx) > 50) {
      setRecordingMode(recordingMode === 'voice' ? 'video_message' : 'voice');
      event.preventDefault();
    }
  }, { enabled: isMobile && !recordingType });

  useEffect(() => {
    dialogRef.current?.focus();
    return () => {
      cleanup();
      stopRecording();
    };
  }, [cleanup]);

  useEffect(() => {
    if (recording && !isPaused) {
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
  }, [recording, isPaused]);

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

  useEffect(() => {
    const fetchLinkPreview = async () => {
      const urlRegex = /(https?:\/\/[^\s]+)/;
      const urlMatch = form.draft.match(urlRegex);
      if (!urlMatch) {
        setLinkPreview(null);
        return;
      }
      const url = urlMatch[0];
      try {
        let previewData = {};
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = extractYouTubeId(url);
          const response = await axios.get(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          previewData = {
            url,
            type: 'youtube',
            title: response.data.title,
            description: response.data.author_name,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          };
        } else if (url.includes('spotify.com')) {
          const response = await axios.get(
            `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
          );
          previewData = {
            url,
            type: 'spotify',
            title: response.data.title,
            description: response.data.provider_name,
            thumbnail: response.data.thumbnail_url,
          };
        } else if (url.includes('soundcloud.com')) {
          const response = await axios.get(
            `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          previewData = {
            url,
            type: 'soundcloud',
            title: response.data.title,
            description: response.data.author_name,
            thumbnail: response.data.thumbnail_url,
          };
        } else {
          const response = await axios.get(
            `https://api.microlink.io?url=${encodeURIComponent(url)}`
          );
          previewData = {
            url,
            type: 'generic',
            title: response.data.data.title,
            description: response.data.data.description,
            thumbnail: response.data.data.image?.url,
          };
        }
        setLinkPreview(previewData);
      } catch (error) {
        console.error(`Failed to fetch preview for ${url}:`, error);
        setLinkPreview(null);
      }
    };

    const debounce = setTimeout(() => {
      fetchLinkPreview();
    }, 500);

    return () => clearTimeout(debounce);
  }, [form.draft]);

  const extractYouTubeId = (url) => {
    const parsed = new URLParse(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1);
    }
    return parsed.query.split('v=')[1]?.split('&')[0];
  };

  const renderLinkPreview = useMemo(() => {
    if (!linkPreview) return null;
    return (
      <Card sx={TweetPopupStyles.popupLinkPreviewCard}>
        {linkPreview.thumbnail && (
          <CardMedia
            component="img"
            image={linkPreview.thumbnail}
            alt={linkPreview.title}
            sx={TweetPopupStyles.popupLinkPreviewImage}
          />
        )}
        <CardContent sx={TweetPopupStyles.popupLinkPreviewContent}>
          <Typography variant="subtitle2" sx={TweetPopupStyles.popupLinkPreviewTitle}>
            <Link href={linkPreview.url} target="_blank" rel="noopener">
              {linkPreview.title || linkPreview.url}
            </Link>
          </Typography>
          {linkPreview.description && (
            <Typography variant="caption" sx={TweetPopupStyles.popupLinkPreviewDescription}>
              {linkPreview.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }, [linkPreview]);


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
        setIsPaused(false);
        setError(null);
      } catch (err) {
        setError('Failed to start recording. Please check microphone/camera permissions.');
        console.error('Recording error:', err);
      }
    },
    [handleFileChange]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [recording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [recording, isPaused]);

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
    setIsPaused(false);
    clearInterval(recordingTimerRef.current);
  }, [recording]);

  const discardRecording = useCallback(() => {
    stopRecording();
    setError(null);
  }, [stopRecording]);

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
          ? { x: parentTweet.position.x, y: parentTweet.position.y + 180 }
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
          onBoardUpdate(newTweet);
        }
        setSubmitSuccess(true);
        setTimeout(() => {
          setForm({ draft: '', scheduledAt: '' });
          cleanup();
          onClose();
          setSubmitSuccess(false);
        }, 500);
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
        <Grid item xs={12} key={`file-${index}`}>
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
              <Box sx={{ position: 'relative' }}>
                <video
                  src={fileUrl}
                  style={TweetPopupStyles.popupCirclePreviewMedia}
                  controls
                  preload="metadata"
                  poster={fileUrl + '#t=0.1'}
                  aria-label={`Video preview ${index + 1}`}
                />
                <Box sx={TweetPopupStyles.popupPreviewOverlay}>
                  <IconButton
                    size="small"
                    onClick={() => removeFile(index)}
                    sx={TweetPopupStyles.popupDeleteFileButton}
                    aria-label={`Remove file ${index + 1}`}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : file.type.startsWith('audio') ? (
              <Box sx={TweetPopupStyles.popupAudioPlayer}>
                <audio
                  src={fileUrl}
                  controls
                  style={{ width: '100%' }}
                  preload="metadata"
                  aria-label={`Audio preview ${index + 1}`}
                />
                <Box sx={TweetPopupStyles.popupAudioVisualizer(false)}>
                  {[...Array(24)].map((_, i) => (
                    <Box key={i} sx={TweetPopupStyles.popupVisualizerBar(i)} />
                  ))}
                </Box>
                <Box sx={TweetPopupStyles.popupPreviewOverlay}>
                  <IconButton
                    size="small"
                    onClick={() => removeFile(index)}
                    sx={TweetPopupStyles.popupDeleteFileButton}
                    aria-label={`Remove file ${index + 1}`}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box sx={TweetPopupStyles.popupPreviewPlaceholder}>
                <Typography variant="caption">File: {file.name}</Typography>
              </Box>
            )}
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
          <Box sx={TweetPopupStyles.popupAudioVisualizer(true)}>
            {[...Array(24)].map((_, i) => (
              <Box key={i} sx={TweetPopupStyles.popupVisualizerBar(i)} />
            ))}
          </Box>
        )}
        <Box sx={TweetPopupStyles.popupRecordingControls}>
          <Tooltip title={isPaused ? 'Resume' : 'Pause'} placement="top">
            <IconButton
              onClick={isPaused ? resumeRecording : pauseRecording}
              sx={TweetPopupStyles.popupMediaButton(isPaused)}
              aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Stop" placement="top">
            <IconButton
              onClick={stopRecording}
              sx={TweetPopupStyles.popupMediaButton(false)}
              aria-label="Stop recording"
            >
              <Stop fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  }, [recording, recordingType, recordingTime, isPaused, pauseRecording, resumeRecording, stopRecording]);

  const toggleRecording = useCallback(
    (type) => () => recordingType === type ? stopRecording() : startRecording(type),
    [recordingType, startRecording, stopRecording]
  );

  const renderInputBar = useMemo(() => {
    return (
        <Box
          sx={{
            ...TweetPopupStyles.popupInputBar,
            position: 'static',
            zIndex: 'auto',
            gap: 1,
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
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
                <AttachFile fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ position: 'relative', flex: 1 }}>
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
                sx={{
                  ...TweetPopupStyles.popupTextField,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    padding: '6px 12px',
                    minHeight: '32px',
                    fontSize: '0.875rem',
                  },
                }}
                inputProps={{ maxLength: MAX_TWEET_LENGTH }}
                aria-label={parentTweet ? 'Reply content' : 'Tweet content'}
                disabled={loading}
              />
              <Typography
                variant="caption"
                sx={{
                  ...TweetPopupStyles.popupCharCount(form.draft.length > MAX_TWEET_LENGTH),
                  position: 'absolute',
                  right: '8px',
                  bottom: '4px',
                  fontSize: '0.75rem',
                }}
                aria-live="polite"
              >
                {form.draft.length}/{MAX_TWEET_LENGTH}
              </Typography>
            </Box>
            <motion.div
          key={recordingType || recordingMode}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {recordingType === 'voice' ? (
            <Tooltip title="Stop Audio Recording (save to add another)" placement="top">
              <IconButton
                onClick={toggleRecording('voice')}
                sx={TweetPopupStyles.popupMediaButton(true)}
                aria-label="Stop audio recording"
                disabled={loading}
              >
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : recordingType === 'video_message' ? (
            <Tooltip title="Stop Video Recording (save to add another)" placement="top">
              <IconButton
                onClick={toggleRecording('video_message')}
                sx={TweetPopupStyles.popupMediaButton(true)}
                aria-label="Stop video recording"
                disabled={loading}
              >
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip
              title={
                isMobile
                  ? `Start ${recordingMode === 'voice' ? 'Audio' : 'Video'} Recording (swipe or hold to switch)`
                  : `Start ${recordingMode === 'voice' ? 'Audio' : 'Video'} Recording (right-click to switch)`
              }
              placement="top"
            >
              <IconButton
                {...bindDrag()}
                onClick={() => toggleRecording(recordingMode)()}
                onTouchStart={() => {
                  if (isMobile) {
                    longPressTimerRef.current = setTimeout(() => {
                      setRecordingMode(recordingMode === 'voice' ? 'video_message' : 'voice');
                    }, LONG_PRESS_DELAY);
                  }
                }}
                onTouchEnd={() => {
                  if (isMobile && longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onContextMenu={(e) => {
                  if (!isMobile) {
                    e.preventDefault();
                    setRecordingMode(recordingMode === 'voice' ? 'video_message' : 'voice');
                  }
                }}
                sx={TweetPopupStyles.popupMediaButton(false)}
                aria-label={
                  isMobile
                    ? `Start ${recordingMode === 'voice' ? 'audio' : 'video'} recording, hold to switch mode`
                    : `Start ${recordingMode === 'voice' ? 'audio' : 'video'} recording, right-click to switch mode`
                }
                aria-haspopup="true"
                disabled={loading}
              >
                {recordingMode === 'voice' ? <Mic fontSize="small" /> : <Videocam fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </motion.div>
        <Tooltip
          title={
            isMobile
              ? 'Submit tweet (long-press for schedule)'
              : 'Submit tweet (right-click for schedule)'
          }
          placement="top"
        >
          <Button
            onClick={(e) => {
              if (!menuAnchorEl) {
                handleSubmit();
              }
              e.preventDefault();
            }}
            onContextMenu={(e) => {
              if (!isMobile) {
                e.preventDefault();
                setMenuAnchorEl(e.currentTarget);
              }
            }}
            onTouchStart={() => {
              if (isMobile) {
                longPressTimerRef.current = setTimeout(() => {
                  setMenuAnchorEl(fileInputRef.current);
                }, LONG_PRESS_DELAY);
              }
            }}
            onTouchEnd={() => {
              if (isMobile && longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            }}
            variant="contained"
            color="primary"
            sx={{ ...TweetPopupStyles.popupActionButton, minWidth: '90px' }}
            disabled={isSubmitDisabled}
            aria-label="Submit tweet or open schedule menu"
            aria-controls={menuAnchorEl ? 'schedule-menu' : undefined}
            aria-haspopup="true"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : parentTweet ? 'Reply' : 'Add Post'}
          </Button>
        </Tooltip>
        <Menu
          id="schedule-menu"
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          PaperProps={{
            sx: {
              minWidth: 120,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          }}
          aria-labelledby="submit-button"
        >
          <MenuItem
            onClick={() => {
              setShowSchedule((prev) => !prev);
              setMenuAnchorEl(null);
            }}
            sx={{ fontSize: '0.875rem', padding: '8px 16px' }}
            aria-label="Toggle schedule input"
          >
            Schedule Post
          </MenuItem>
        </Menu>
        </Box>
          {renderLinkPreview}
        </Box>
    );
  }, [
    recordingType,
    recording,
    loading,
    handleFileInputChange,
    startRecording,
    stopRecording,
    form.draft,
    parentTweet,
    handleKeyPress,
    handleSubmit,
    isSubmitDisabled,
    files,
    recordingMode,
    isMobile,
    bindDrag,
    toggleRecording,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: submitSuccess ? 1.05 : 1 }}
      transition={{ duration: 0.3 }}
    >
      <Dialog
        open={true}
        onClose={onClose}
        PaperProps={{
          sx: {
            ...TweetPopupStyles.popupDialogPaper,
            position: 'relative',
          },
        }}
        sx={{ '& .MuiBackdrop-root': TweetPopupStyles.popupDialogBackdrop }}
        aria-labelledby="tweet-popup-title"
        ref={dialogRef}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 10,
            right: 25,
            zIndex: 1,
            color: 'grey.600',
            padding: '4px',
            '&:hover': { bgcolor: 'grey.200' },
          }}
          aria-label="Close tweet popup"
          disabled={loading || uploadProgress > 0}
        >
          <Close fontSize="small" />
        </IconButton>
        <Typography
          id="tweet-popup-title"
          sx={{
            ...TweetPopupStyles.popupTitle,
            pr: 5, // Space for Close icon
          }}
        >
          {parentTweet ? 'Reply to Tweet' : 'Create a new tweet'}
        </Typography>
        <Box sx={TweetPopupStyles.popupContentBox}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={TweetPopupStyles.popupErrorAlert}>
              {error}
            </Alert>
          )}
          {parentTweet && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'medium' }}>
                Replying to:
              </Typography>
              <Box
                component="blockquote"
                sx={{
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                  pl: 2,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  m: 0,
                }}
              >
                <Typography variant="body2">
                  {parentTweet.content?.value
                    .split(/\s+/)
                    .slice(0, 10)
                    .join(' ')
                  }...
                </Typography>
              </Box>
            </Box>
          )}
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
          <Collapse in={showSchedule} timeout="auto">
            <TextField
              label="Schedule (optional)"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ ...TweetPopupStyles.popupTextField, mb: 1 }}
              inputProps={{ min: new Date().toISOString().slice(0, 16) }}
              aria-label="Schedule tweet"
              disabled={loading || recording}
            />
          </Collapse>
          {renderInputBar}
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