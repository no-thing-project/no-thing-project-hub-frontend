import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  TextField,
  Tabs,
  Tab,
  Box,
  Typography,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ChatSettingsModal = ({
  open,
  onClose,
  onSave,
  initialSettings,
  isGroupChat,
  groupName,
  groupAvatar,
  participants,
  onUpdateGroup,
  onAddParticipant,
  onRemoveParticipant,
  onChangeRole,
  currentUserId,
  friends,
}) => {
  const theme = useTheme();
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState({
    videoShape: initialSettings.videoShape || 'square',
    chatBackground: initialSettings.chatBackground || 'default',
    fontSize: initialSettings.fontSize || 'medium',
    fontStyle: initialSettings.fontStyle || 'normal',
  });
  const [groupSettings, setGroupSettings] = useState({
    name: groupName || '',
    avatar: groupAvatar || null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSettings({
      videoShape: initialSettings.videoShape || 'square',
      chatBackground: initialSettings.chatBackground || 'default',
      fontSize: initialSettings.fontSize || 'medium',
      fontStyle: initialSettings.fontStyle || 'normal',
    });
    setGroupSettings({
      name: groupName || '',
      avatar: groupAvatar || null,
    });
  }, [initialSettings, groupName, groupAvatar]);

  const handleChange = useCallback((key) => (event) => {
    setSettings((prev) => ({ ...prev, [key]: event.target.value }));
    setError(null);
  }, []);

  const handleGroupChange = useCallback((key) => (event) => {
    setGroupSettings((prev) => ({ ...prev, [key]: event.target.value }));
    setError(null);
  }, []);

  const handleAvatarUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupSettings((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (isGroupChat) {
        await onUpdateGroup(groupSettings);
      }
      await onSave(settings);
      onClose();
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, groupSettings, isGroupChat, onSave, onUpdateGroup, onClose]);

  const handleAddParticipant = useCallback(
    async (friendId) => {
      try {
        await onAddParticipant(friendId);
      } catch (err) {
        setError('Failed to add participant.');
      }
    },
    [onAddParticipant]
  );

  const handleRemoveParticipant = useCallback(
    async (participantId) => {
      try {
        await onRemoveParticipant(participantId);
      } catch (err) {
        setError('Failed to remove participant.');
      }
    },
    [onRemoveParticipant]
  );

  const handleRoleChange = useCallback(
    async (participantId, role) => {
      try {
        await onChangeRole(participantId, role);
      } catch (err) {
        setError('Failed to change role.');
      }
    },
    [onChangeRole]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="chat-settings-title"
      sx={{ '& .MuiDialog-paper': { boxSizing: 'border-box', minHeight: 400 } }}
    >
      <DialogTitle id="chat-settings-title">Chat Settings</DialogTitle>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
        <Tab label="General" value="general" />
        {isGroupChat && <Tab label="Participants" value="participants" />}
        <Tab label="Appearance" value="appearance" />
      </Tabs>
      <DialogContent sx={{ p: 2, minHeight: 200 }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {tab === 'general' && isGroupChat && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Avatar src={groupSettings.avatar} sx={{ width: 60, height: 60 }} />
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload group avatar"
                sx={{ flexShrink: 0 }}
              >
                Change Avatar
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleAvatarUpload}
                aria-hidden="true"
              />
            </Box>
            <TextField
              fullWidth
              label="Group Name"
              value={groupSettings.name}
              onChange={handleGroupChange('name')}
              sx={{ mb: 2 }}
              disabled={isSaving}
              aria-label="Group name"
              inputProps={{ maxLength: 50 }}
            />
          </>
        )}
        {tab === 'participants' && isGroupChat && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Participants
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Add Participant</InputLabel>
              <Select
                value=""
                onChange={(e) => handleAddParticipant(e.target.value)}
                disabled={isSaving}
                aria-label="Add participant"
              >
                {friends
                  .filter((f) => !participants.some((p) => p.anonymous_id === f.anonymous_id))
                  .map((friend) => (
                    <MenuItem key={friend.anonymous_id} value={friend.anonymous_id}>
                      {friend.username}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <List sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {participants.map((participant) => (
                <ListItem key={participant.anonymous_id} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={participant.username || `User (${participant.anonymous_id})`}
                    secondary={participant.role}
                    primaryTypographyProps={{ noWrap: true }}
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small">
                      <Select
                        value={participant.role || 'member'}
                        onChange={(e) => handleRoleChange(participant.anonymous_id, e.target.value)}
                        disabled={isSaving || participant.anonymous_id === currentUserId}
                        aria-label={`Change role for ${participant.username}`}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="member">Member</MenuItem>
                      </Select>
                    </FormControl>
                    {participant.anonymous_id !== currentUserId && (
                      <IconButton
                        onClick={() => handleRemoveParticipant(participant.anonymous_id)}
                        disabled={isSaving}
                        aria-label={`Remove ${participant.username}`}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </>
        )}
        {tab === 'appearance' && (
          <>
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
            <FormControl fullWidth sx={{ mb: 2 }} aria-label="Chat background selector">
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
            <FormControl fullWidth sx={{ mb: 2 }} aria-label="Font size selector">
              <InputLabel id="font-size-label">Font Size</InputLabel>
              <Select
                labelId="font-size-label"
                value={settings.fontSize}
                label="Font Size"
                onChange={handleChange('fontSize')}
                disabled={isSaving}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth aria-label="Font style selector">
              <InputLabel id="font-style-label">Font Style</InputLabel>
              <Select
                labelId="font-style-label"
                value={settings.fontStyle}
                label="Font Style"
                onChange={handleChange('fontStyle')}
                disabled={isSaving}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="italic">Italic</MenuItem>
                <MenuItem value="bold">Bold</MenuItem>
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
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
    fontSize: PropTypes.oneOf(['small', 'medium', 'large']),
    fontStyle: PropTypes.oneOf(['normal', 'italic', 'bold']),
  }).isRequired,
  isGroupChat: PropTypes.bool.isRequired,
  groupName: PropTypes.string,
  groupAvatar: PropTypes.string,
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
      role: PropTypes.oneOf(['admin', 'member']),
    })
  ),
  onUpdateGroup: PropTypes.func,
  onAddParticipant: PropTypes.func,
  onRemoveParticipant: PropTypes.func,
  onChangeRole: PropTypes.func,
  currentUserId: PropTypes.string.isRequired,
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      anonymous_id: PropTypes.string.isRequired,
      username: PropTypes.string,
    })
  ).isRequired,
};

export default React.memo(ChatSettingsModal);