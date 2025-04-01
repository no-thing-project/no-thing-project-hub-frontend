import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, Modal, IconButton, Menu, MenuItem } from "@mui/material";
import { Stop, ShapeLine } from "@mui/icons-material";

const MODAL_STYLES = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
};

const VIDEO_SHAPES = {
  square: "none",
  circle: "circle(50%)",
  heart: "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 ...')", // truncated path for brevity
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
};

const VIDEO_STYLES = (shape) => ({
  width: "100%",
  maxWidth: "400px",
  borderRadius: shape === "square" ? "8px" : "0",
  clipPath: VIDEO_SHAPES[shape],
  backgroundColor: "black",
});

const RecorderModal = ({
  open,
  onClose,
  stream,
  recordingTime: externalRecordingTime,
  onStop,
  initialShape = "square",
}) => {
  const videoRef = useRef(null);
  const [shape, setShape] = useState(initialShape);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(externalRecordingTime);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open && stream) {
      const videoElement = videoRef.current;
      if (videoElement && stream.active && stream.getVideoTracks().length > 0) {
        videoElement.srcObject = stream;
        videoElement
          .play()
          .catch((err) => setMediaError("Failed to play video stream."));
      } else {
        setMediaError("Stream is not active or has no video tracks.");
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timerRef.current);
        if (videoElement && videoElement.srcObject) {
          videoElement.srcObject.getTracks().forEach((track) => track.stop());
          videoElement.srcObject = null;
        }
      };
    }
  }, [open, stream]);

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;

  const handleShapeMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleShapeMenuClose = () => setAnchorEl(null);
  const handleShapeChange = (newShape) => {
    setShape(newShape);
    handleShapeMenuClose();
  };

  const handleStop = () => {
    clearInterval(timerRef.current);
    onStop(shape);
    setRecordingTime(0);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={MODAL_STYLES}>
        {mediaError ? (
          <Typography variant="body1" color="error">
            {mediaError}
          </Typography>
        ) : (
          <>
            <Box sx={{ position: "relative" }}>
              <video
                ref={videoRef}
                style={VIDEO_STYLES(shape)}
                muted
                autoPlay
                playsInline
              />
              <IconButton
                size="small"
                onClick={handleShapeMenuOpen}
                sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255, 255, 255, 0.7)" }}
              >
                <ShapeLine />
              </IconButton>
            </Box>

            <Typography variant="body1">{formatTime(recordingTime)}</Typography>

            <Button variant="contained" color="error" startIcon={<Stop />} onClick={handleStop}>
              Stop Recording
            </Button>
          </>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleShapeMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {Object.keys(VIDEO_SHAPES).map((shapeOption) => (
            <MenuItem key={shapeOption} onClick={() => handleShapeChange(shapeOption)}>
              {shapeOption.charAt(0).toUpperCase() + shapeOption.slice(1)}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Modal>
  );
};

RecorderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stream: PropTypes.object,
  recordingTime: PropTypes.number,
  onStop: PropTypes.func.isRequired,
  initialShape: PropTypes.oneOf(["square", "circle", "heart", "diamond"]),
};

RecorderModal.defaultProps = {
  recordingTime: 0,
  initialShape: "square",
};

export default RecorderModal;
