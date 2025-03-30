import React, { useState } from "react";
import PropTypes from "prop-types";
import { Modal, Box, Typography, FormControl, Select, MenuItem, Button } from "@mui/material";
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
  width: { xs: "90%", md: "400px" },
};

const videoShapes = {
  square: "Square",
  circle: "Circle",
  heart: "Heart",
  diamond: "Diamond",
};

const backgroundOptions = {
  default: "Default (White)",
  lightGray: "Light Gray",
  dark: "Dark",
  nature: "Nature",
};

const ChatSettingsModal = ({ open, onClose, onSave, initialSettings }) => {
  const [videoShape, setVideoShape] = useState(initialSettings.videoShape || "square");
  const [chatBackground, setChatBackground] = useState(initialSettings.chatBackground || "default");

  const handleSave = () => {
    onSave({ videoShape, chatBackground });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyles}>
        <Typography variant="h6" gutterBottom>
          Chat Settings
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body1">Video Shape</Typography>
          <Select value={videoShape} onChange={(e) => setVideoShape(e.target.value)}>
            {Object.entries(videoShapes).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="body1">Chat Background</Typography>
          <Select value={chatBackground} onChange={(e) => setChatBackground(e.target.value)}>
            {Object.entries(backgroundOptions).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSave} sx={actionButtonStyles}>
          Save
        </Button>
      </Box>
    </Modal>
  );
};

ChatSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialSettings: PropTypes.shape({
    videoShape: PropTypes.string,
    chatBackground: PropTypes.string,
  }),
};

ChatSettingsModal.defaultProps = {
  initialSettings: { videoShape: "square", chatBackground: "default" },
};

export default ChatSettingsModal;