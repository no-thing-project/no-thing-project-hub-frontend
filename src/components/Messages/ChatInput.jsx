import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  Send,
  Mic,
  Videocam,
  MoreVert,
  AttachFile,
  PhotoCamera,
  MusicNote,
  Stop,
} from "@mui/icons-material";
import { actionButtonStyles } from "../../styles/BaseStyles";
import RecorderModal from "./RecorderModal";

const inputAreaStyles = {
  p: { xs: 1, md: 2 },
  borderTop: "1px solid",
  borderColor: "grey.300",
  display: "flex",
  gap: { xs: 0.5, md: 1 },
  backgroundColor: "grey.50",
  alignItems: "center",
  flexWrap: "wrap",
};

const ChatInput = ({
  onSendMessage,
  onSendMediaMessage,
  recipient,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  fetchMessagesList,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState("voice");
  const [anchorEl, setAnchorEl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleSend = async () => {
    if (!messageInput.trim() && (!pendingMediaList || !pendingMediaList.length)) return;

    const content = messageInput.trim();
    const messageData = {
      recipientId: recipient.anonymous_id,
      content,
      media: pendingMediaList || [],
    };

    try {
      await onSendMediaMessage(messageData);
      setMessageInput("");
      clearPendingMedia();
      await fetchMessagesList();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingMediaFile(file, type);
      setAnchorEl(null);
    }
  };

  const startRecording = async (type) => {
    if (isRecording) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });

      const recorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === "voice" ? "audio/webm" : "video/webm",
        });
        const file = new File([blob], `${type}_${Date.now()}.webm`, { type: blob.type });
        setPendingMediaFile(file, type);
        chunksRef.current = [];
        setIsRecording(false);
        setIsModalOpen(type === "video" ? false : isModalOpen);
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };
      recorder.onerror = (err) => {
        console.error("Recorder error:", err);
        setIsRecording(false);
        setIsModalOpen(type === "video" ? false : isModalOpen);
      };

      setStream(mediaStream);
      setIsRecording(true);
      recorder.start();
      if (type === "video") {
        setTimeout(() => setIsModalOpen(true), 100);
      }
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleRecordingMode = () =>
    isRecording ? stopRecording() : startRecording(recordingType);
  const switchRecordingType = () =>
    setRecordingType((prev) => (prev === "voice" ? "video" : "voice"));

  const formatTime = (seconds) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  const renderRightButton = () => {
    if (isRecording) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="error" sx={{ animation: "blink 1s infinite" }}>
            {formatTime(recordingTime)}
          </Typography>
          <Tooltip title={`Stop ${recordingType === "voice" ? "Voice" : "Video"} Recording`}>
            <IconButton size="small" onClick={stopRecording}>
              <Stop />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }
    if (messageInput.trim() || (pendingMediaList?.length > 0)) {
      return (
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<Send />}
          sx={{ ...actionButtonStyles, minWidth: { xs: "auto", md: "120px" } }}
        >
          Send
        </Button>
      );
    }
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip title={recordingType === "video" ? "Switch to Voice" : "Switch to Video"}>
          <IconButton size="small" onClick={switchRecordingType}>
            {recordingType === "video" ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
        <Tooltip title={recordingType === "video" ? "Record Video" : "Record Voice"}>
          <IconButton size="small" onClick={toggleRecordingMode}>
            {recordingType === "video" ? <Videocam /> : <Mic />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={inputAreaStyles}>
      <Tooltip title="More Options">
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem component="label">
          <AttachFile sx={{ mr: 1 }} /> Attach File
          <input type="file" hidden onChange={(e) => handleFileUpload(e, "file")} />
        </MenuItem>
        <MenuItem component="label">
          <PhotoCamera sx={{ mr: 1 }} /> Send Photo
          <input type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e, "image")} />
        </MenuItem>
        <MenuItem component="label">
          <Videocam sx={{ mr: 1 }} /> Send Video
          <input type="file" hidden accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
        </MenuItem>
        <MenuItem component="label">
          <MusicNote sx={{ mr: 1 }} /> Send Music
          <input type="file" hidden accept="audio/*" onChange={(e) => handleFileUpload(e, "voice")} />
        </MenuItem>
      </Menu>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSend()}
        sx={{ backgroundColor: "white", flex: 1, minWidth: { xs: "100px", md: "200px" } }}
        disabled={isRecording}
      />

      {renderRightButton()}

      <RecorderModal
        open={isModalOpen && recordingType === "video"}
        onClose={stopRecording}
        stream={stream}
        recordingTime={recordingTime}
        onStop={stopRecording}
      />

      <style>{`@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
    </Box>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onSendMediaMessage: PropTypes.func.isRequired,
  recipient: PropTypes.shape({
    anonymous_id: PropTypes.string.isRequired,
  }).isRequired,
  pendingMediaList: PropTypes.arrayOf(
    PropTypes.shape({
      file: PropTypes.object.isRequired,
      type: PropTypes.string.isRequired,
      preview: PropTypes.string.isRequired,
    })
  ),
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  fetchMessagesList: PropTypes.func.isRequired,
};

export default ChatInput;