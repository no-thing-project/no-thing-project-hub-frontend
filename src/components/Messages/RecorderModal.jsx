import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, Modal } from "@mui/material";
import { Stop } from "@mui/icons-material";
import { actionButtonStyles } from "../../styles/BaseStyles";

const modalStyles = {
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

const RecorderModal = ({ open, onClose, stream, recordingTime, onStop }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (open && videoElement && stream?.active) {
      videoElement.srcObject = stream;
      videoElement.play().catch((err) => console.error("Error playing video:", err));
    }
  }, [open, stream, videoRef.current]);

  useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyles}>
        <video
          ref={videoRef}
          style={{ width: "100%", maxWidth: "400px", borderRadius: "8px" }}
          muted
          autoPlay
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" color="error" sx={{ animation: "blink 1s infinite" }}>
            {formatTime(recordingTime)}
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<Stop />}
            onClick={onStop}
            sx={actionButtonStyles}
          >
            Stop Recording
          </Button>
        </Box>
        <style>{`@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
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
};

export default RecorderModal;