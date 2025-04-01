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
  CircularProgress,
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
  Clear,
  EmojiEmotions,
} from "@mui/icons-material";
import { actionButtonStyles } from "../../styles/BaseStyles";
import RecorderModal from "./RecorderModal";
import EmojiPicker from "emoji-picker-react";

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
  onSendMediaMessage,
  recipient,
  pendingMediaList,
  setPendingMediaFile,
  clearPendingMedia,
  defaultVideoShape,
  replyToMessage,
  setReplyToMessage,
  isGroupChat,
  token,
  currentUserId,
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState("voice");
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      return () => clearInterval(timer);
    }
    setRecordingTime(0);
  }, [isRecording]);

  const handleSend = async () => {
    if (!messageInput.trim() && !pendingMediaList?.length) return;
    setIsSending(true);
    const messageData = {
      ...(isGroupChat ? { groupId: recipient.group_id } : { recipientId: recipient.anonymous_id }),
      content: messageInput.trim() || "Media message",
      media: pendingMediaList,
      ...(replyToMessage && { replyTo: replyToMessage.message_id }),
    };
    try {
      await onSendMediaMessage(messageData);
      setMessageInput("");
      clearPendingMedia();
      setReplyToMessage(null);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingMediaFile({
        file,
        type,
        preview: URL.createObjectURL(file),
        shape: defaultVideoShape,
      });
      setAnchorEl(null);
    }
  };

  const startRecording = async (type) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setStream(mediaStream);
      setIsRecording(true);
      const recorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === "voice" ? "audio/webm" : "video/webm",
        });
        setPendingMediaFile({
          file: new File([blob], `${type}_${Date.now()}.webm`, {
            type: blob.type,
          }),
          type,
          preview: URL.createObjectURL(blob),
          shape: defaultVideoShape,
        });
        setIsRecording(false);
        setIsModalOpen(false);
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };
      recorder.start();
      if (type === "video") setIsModalOpen(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const renderRightButton = () => {
    if (isRecording) {
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{ animation: "blink 1s infinite" }}
          >
            {formatTime(recordingTime)}
          </Typography>
          <Tooltip title={`Stop ${recordingType} Recording`}>
            <IconButton size="small" onClick={stopRecording}>
              <Stop />
            </IconButton>
          </Tooltip>
        </Box>
      );
    }
    if (messageInput.trim() || pendingMediaList?.length) {
      return (
        <Button
          variant="contained"
          onClick={handleSend}
          startIcon={<Send />}
          disabled={isSending}
          sx={actionButtonStyles}
        >
          Send
        </Button>
      );
    }
    return (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip
          title={recordingType === "video" ? "Switch to Voice" : "Switch to Video"}
        >
          <IconButton
            size="small"
            onClick={() =>
              setRecordingType(recordingType === "video" ? "voice" : "video")
            }
          >
            {recordingType === "video" ? <Mic /> : <Videocam />}
          </IconButton>
        </Tooltip>
        <Tooltip
          title={`Record ${recordingType === "video" ? "Video" : "Voice"}`}
        >
          <IconButton size="small" onClick={() => startRecording(recordingType)}>
            {recordingType === "video" ? <Videocam /> : <Mic />}
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Box sx={inputAreaStyles}>
      {replyToMessage && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, width: "100%" }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            Replying to: {replyToMessage.content.slice(0, 20)}...
          </Typography>
          <IconButton size="small" onClick={() => setReplyToMessage(null)}>
            <Clear />
          </IconButton>
        </Box>
      )}
      <Tooltip title="More Options">
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVert />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem component="label">
          <AttachFile sx={{ mr: 1 }} /> File
          <input
            type="file"
            hidden
            onChange={(e) => handleFileUpload(e, "file")}
          />
        </MenuItem>
        <MenuItem component="label">
          <PhotoCamera sx={{ mr: 1 }} /> Photo
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "image")}
          />
        </MenuItem>
        <MenuItem component="label">
          <Videocam sx={{ mr: 1 }} /> Video
          <input
            type="file"
            hidden
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "video")}
          />
        </MenuItem>
        <MenuItem component="label">
          <MusicNote sx={{ mr: 1 }} /> Audio
          <input
            type="file"
            hidden
            accept="audio/*"
            onChange={(e) => handleFileUpload(e, "voice")}
          />
        </MenuItem>
      </Menu>

      <Tooltip title="Add Emoji">
        <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
          <EmojiEmotions />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={() => setEmojiAnchorEl(null)}
      >
        <EmojiPicker
          onEmojiClick={(emoji) => {
            setMessageInput((prev) => prev + emoji.emoji);
            setEmojiAnchorEl(null);
          }}
        />
      </Menu>

      <TextField
        inputRef={inputRef}
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        sx={{ backgroundColor: "white", flex: 1 }}
        disabled={isRecording || isSending}
        multiline
        maxRows={4}
      />

      {renderRightButton()}
      {isSending && <CircularProgress size={24} sx={{ ml: 1 }} />}

      <RecorderModal
        open={isModalOpen && recordingType === "video"}
        onClose={stopRecording}
        stream={stream}
        recordingTime={recordingTime}
        onStop={stopRecording}
        initialShape={defaultVideoShape}
      />

      <style>
        {`@keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }`}
      </style>
    </Box>
  );
};

ChatInput.propTypes = {
  onSendMediaMessage: PropTypes.func.isRequired,
  recipient: PropTypes.object.isRequired,
  pendingMediaList: PropTypes.array,
  setPendingMediaFile: PropTypes.func.isRequired,
  clearPendingMedia: PropTypes.func.isRequired,
  defaultVideoShape: PropTypes.string,
  replyToMessage: PropTypes.object,
  setReplyToMessage: PropTypes.func,
  isGroupChat: PropTypes.bool,
  token: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
};

export default ChatInput;
