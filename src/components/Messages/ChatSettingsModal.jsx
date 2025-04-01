import React, { useState } from "react";
import PropTypes from "prop-types";
import { Modal, Box, Typography, FormControl, Select, MenuItem, Button } from "@mui/material";
import { useChatSettings } from "../../context/ChatSettingsContext";

const MODAL_STYLES = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  borderRadius: 2,
  width: { xs: "90%", md: "400px" },
};

const VIDEO_SHAPES = {
  square: "Square",
  circle: "Circle",
  heart: "Heart",
  diamond: "Diamond",
};

const BACKGROUND_OPTIONS = {
  default: "Default (White)",
  lightGray: "Light Gray",
  dark: "Dark",
  nature: "Nature",
};

const ChatSettingsModal = ({ open, onClose }) => {
  const { settings, setSettings } = useChatSettings();
  const [videoShape, setVideoShape] = useState(settings.videoShape);
  const [chatBackground, setChatBackground] = useState(settings.chatBackground);

  const handleSave = () => {
    setSettings({ videoShape, chatBackground });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={MODAL_STYLES}>
        <Typography variant="h6" gutterBottom>
          Chat Settings
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body1">Video Shape</Typography>
          <Select value={videoShape} onChange={(e) => setVideoShape(e.target.value)}>
            {Object.entries(VIDEO_SHAPES).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body1">Chat Background</Typography>
          <Select value={chatBackground} onChange={(e) => setChatBackground(e.target.value)}>
            {Object.entries(BACKGROUND_OPTIONS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Modal>
  );
};

ChatSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ChatSettingsModal;
