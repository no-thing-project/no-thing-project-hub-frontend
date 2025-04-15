import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';

/**
 * ChatSettingsModal component for customizing chat settings
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const ChatSettingsModal = ({ open, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState({
    videoShape: initialSettings.videoShape || 'square',
    chatBackground: initialSettings.chatBackground || 'default',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Update settings when initialSettings change
  useEffect(() => {
    setSettings({
      videoShape: initialSettings.videoShape || 'square',
      chatBackground: initialSettings.chatBackground || 'default',
    });
  }, [initialSettings]);

  // Handle setting changes
  const handleChange = useCallback((key) => (event) => {
    setSettings((prev) => ({ ...prev, [key]: event.target.value }));
    setError(null);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!settings.videoShape || !settings.chatBackground) {
      setError('Please select valid settings.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(settings);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, onSave]);

  // Reset error when modal closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setIsSaving(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="chat-settings-title"
      aria-describedby="chat-settings-content"
    >
      <DialogTitle id="chat-settings-title">Chat Settings</DialogTitle>
      <DialogContent id="chat-settings-content">
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <FormControl fullWidth sx={{ mb: 2 }} aria-label="Video shape selector">
          <InputLabel id="video-shape-label">Video Shape</InputLabel>
          <Select
            labelId="video-shape-label"
            value={settings.videoShape}
            label="Video Shape"
            onChange={handleChange('videoShape')}
            disabled={isSaving}
          >
            <MenuItem value="square">Square</MenuItem>
            <MenuItem value="circle">Circle</MenuItem>
            <MenuItem value="rectangle">Rectangle</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth aria-label="Chat background selector">
          <InputLabel id="chat-background-label">Chat Background</InputLabel>
          <Select
            labelId="chat-background-label"
            value={settings.chatBackground}
            label="Chat Background"
            onChange={handleChange('chatBackground')}
            disabled={isSaving}
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="lightGray">Light Gray</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="nature">Nature</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isSaving}
          aria-label="Cancel settings changes"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} /> : null}
          aria-label="Save settings"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ChatSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialSettings: PropTypes.shape({
    videoShape: PropTypes.oneOf(['square', 'circle', 'rectangle']),
    chatBackground: PropTypes.oneOf(['default', 'lightGray', 'dark', 'nature']),
  }).isRequired,
};

export default React.memo(ChatSettingsModal);