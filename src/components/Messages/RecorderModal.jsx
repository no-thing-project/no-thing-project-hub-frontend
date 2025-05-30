import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Modal,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Stop, ShapeLine, Clear } from '@mui/icons-material';
import { actionButtonStyles } from '../../styles/BaseStyles';

const modalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const videoShapes = {
  square: 'none',
  circle: 'circle(50%)',
  heart:
    "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')",
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
};

const RecorderModal = ({
  open,
  onClose,
  stream,
  recordingTime,
  onStop,
  initialShape = 'square',
  onCancel,
}) => {
  const videoRef = useRef(null);
  const [shape, setShape] = useState(initialShape);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mediaError, setMediaError] = useState(null);

  useEffect(() => {
    const checkMediaAccess = async () => {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        testStream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        setMediaError('Cannot access camera or microphone. Please check permissions.');
      }
    };
    if (open) checkMediaAccess();
  }, [open]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (open && videoElement && stream) {
      if (stream.active && stream.getVideoTracks().length > 0) {
        videoElement.srcObject = stream;
        videoElement
          .play()
          .catch((err) => console.error('Error playing video:', err));
      } else {
        setMediaError('Stream is not active or has no video tracks.');
      }
    }
    return () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
    };
  }, [open, stream]);

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const handleShapeMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleShapeMenuClose = () => setAnchorEl(null);
  const handleShapeChange = (newShape) => {
    setShape(newShape);
    handleShapeMenuClose();
  };

  const handleStop = () => onStop(shape);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyles}>
        {mediaError ? (
          <Typography variant="body1" color="error">
            {mediaError}
          </Typography>
        ) : (
          <>
            <Box sx={{ position: 'relative' }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: shape === 'square' ? '8px' : '0',
                  clipPath: videoShapes[shape],
                  backgroundColor: 'black',
                }}
                muted
                autoPlay
                playsInline
              />
              <IconButton
                size="small"
                onClick={handleShapeMenuOpen}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <ShapeLine />
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleShapeMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {Object.keys(videoShapes).map((shapeKey) => (
                <MenuItem
                  key={shapeKey}
                  onClick={() => handleShapeChange(shapeKey)}
                >
                  {shapeKey.charAt(0).toUpperCase() + shapeKey.slice(1)}
                </MenuItem>
              ))}
            </Menu>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="caption"
                color="error"
                sx={{ animation: 'blink 1s infinite' }}
              >
                {formatTime(recordingTime)}
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={handleStop}
                sx={actionButtonStyles}
              >
                Stop Recording
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Clear />}
                onClick={onCancel}
                sx={actionButtonStyles}
              >
                Cancel
              </Button>
            </Box>
          </>
        )}
        <style>
          {`@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}
        </style>
      </Box>
    </Modal>
  );
};

RecorderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stream: PropTypes.object,
  recordingTime: PropTypes.number.isRequired,
  onStop: PropTypes.func.isRequired,
  initialShape: PropTypes.oneOf(['square', 'circle', 'heart', 'diamond']),
  onCancel: PropTypes.func.isRequired,
};

RecorderModal.defaultProps = {
  initialShape: 'square',
};

export default React.memo(RecorderModal);