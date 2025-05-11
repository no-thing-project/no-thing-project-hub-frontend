import React, { useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Paper,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { PhotoCamera, Videocam, MusicNote, Mic, VideoCall, Delete } from "@mui/icons-material";
import { actionButtonStyles, cancelButtonStyle, inputStyles } from "../../../styles/BaseStyles";

const TweetPopup = ({ x, y, onSubmit, onClose }) => {
  const [draft, setDraft] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [files, setFiles] = useState([]);
  const [recording, setRecording] = useState(null);
  const [recordingType, setRecordingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const newFiles = Array.from(e.target.files).slice(0, 5 - files.length); // Limit to 5 files
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files]);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const startRecording = useCallback(async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        type === "voice" ? { audio: true } : { audio: true, video: true }
      );
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: type === "voice" ? "audio/webm" : "video/webm",
        });
        const file = new File([blob], `${type}_${Date.now()}.webm`, {
          type: blob.type,
        });
        setFiles((prev) => [...prev, file]);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(stream);
      setRecordingType(type);
    } catch (err) {
      console.error("Recording failed:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(null);
    setRecordingType(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!draft.trim() && files.length === 0) return;
    setLoading(true);
    try {
      const content = {
        type: files.length > 0 ? getContentType(files[0].type) : "text",
        value: draft.trim(),
        metadata: {
          files: files.map((file) => ({
            url: URL.createObjectURL(file),
            fileKey: `temp-${file.name}`,
            contentType: file.type,
            size: file.size,
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
      await onSubmit(content, x, y, scheduledAt || null, files);
      setDraft("");
      setFiles([]);
      setScheduledAt("");
      onClose();
    } catch (err) {
      console.error("Tweet submission failed:", err);
    } finally {
      setLoading(false);
    }
  }, [draft, files, x, y, scheduledAt, onSubmit, onClose]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const getContentType = (mimeType) => {
    if (mimeType.startsWith("image")) return "image";
    if (mimeType.startsWith("video")) return "video";
    if (mimeType.startsWith("audio")) return "audio";
    return "file";
  };

  return (
    <Paper
      className="tweet-popup"
      elevation={5}
      sx={{
        position: "absolute",
        top: y,
        left: x,
        p: 2,
        minWidth: { xs: "280px", sm: "300px" },
        maxWidth: { xs: "90vw", sm: "400px" },
        backgroundColor: "background.paper",
        borderRadius: 2,
        zIndex: 1200,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <TextField
          placeholder="What's on your mind?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
          fullWidth
          multiline
          maxRows={4}
          margin="dense"
          variant="outlined"
          sx={{
            ...inputStyles,
            "& .MuiInputBase-root": {
              borderRadius: "20px",
              padding: "8px 16px",
            },
          }}
          aria-label="Tweet message input"
        />
        {files.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {files.map((file, index) => (
              <Box key={index} sx={{ position: "relative", width: 80, height: 80 }}>
                {file.type.startsWith("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                  />
                ) : file.type.startsWith("video") ? (
                  <video
                    src={URL.createObjectURL(file)}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
                    controls
                  />
                ) : file.type.startsWith("audio") ? (
                  <Box sx={{ p: 1, bgcolor: "grey.200", borderRadius: 4, textAlign: "center" }}>
                    <MusicNote />
                    <Typography variant="caption">Audio</Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1, bgcolor: "grey.200", borderRadius: 4, textAlign: "center" }}>
                    <Typography variant="caption">File</Typography>
                  </Box>
                )}
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  sx={{ position: "absolute", top: 0, right: 0, bgcolor: "error.main", color: "white" }}
                  aria-label={`Remove file ${index + 1}`}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
            ref={fileInputRef}
            aria-hidden="true"
          />
          <IconButton
            onClick={() => fileInputRef.current.click()}
            sx={{ color: "text.secondary" }}
            aria-label="Upload media"
          >
            <PhotoCamera />
          </IconButton>
          <IconButton
            onClick={() => startRecording("voice")}
            disabled={recording}
            sx={{ color: recordingType === "voice" ? "primary.main" : "text.secondary" }}
            aria-label="Record voice message"
          >
            <Mic />
          </IconButton>
          <IconButton
            onClick={() => startRecording("video_message")}
            disabled={recording}
            sx={{ color: recordingType === "video_message" ? "primary.main" : "text.secondary" }}
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
          onChange={(e) => setScheduledAt(e.target.value)}
          fullWidth
          margin="dense"
          InputLabelProps={{ shrink: true }}
          sx={inputStyles}
          aria-label="Schedule tweet"
        />
        <Box sx={{ display: "flex", justifyContent: "space-evenly", mt: 2 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={actionButtonStyles}
            disabled={loading || (!draft.trim() && files.length === 0)}
            aria-label="Submit tweet"
          >
            {loading ? <CircularProgress size={24} /> : "Add Post"}
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

export default TweetPopup;