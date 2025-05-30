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
import { motion, AnimatePresence } from 'framer-motion';

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
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
  }, []);

  const handleGroupChange = useCallback((key) => (event) => {
    setGroupSettings((prev) => ({ ...prev, [key]: event.target.value }));
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
    if (isGroupChat && !groupSettings.name.trim()) {
      setError('Group name is required.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      if (isGroupChat) {
        await onUpdateGroup(groupSettings);
      }
      await onSave(settings);
      onClose();
    } catch (err) {
      setError('Failed to save settings.');
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [settings, groupSettings, isGroupChat, onSave, onUpdateGroup, onClose]);

  const handleAddParticipant = useCallback(
    async (friendId) => {
      setIsSaving(true);
      try {
        await onAddParticipant(friendId);
      } catch (err) {
        setError('Failed to add participant.');
      } finally {
        setIsSaving(false);
      }
    },
    [onAddParticipant]
  );

  const handleRemoveParticipant = useCallback(
    async (participantId) => {
      setIsSaving(true);
      try {
        await onRemoveParticipant(participantId);
      } catch (err) {
        setError('Failed to remove participant.');
      } finally {
        setIsSaving(false);
      }
    },
    [onRemoveParticipant]
  );

  const handleRoleChange = useCallback(
    async (participantId, role) => {
      setIsSaving(true);
      try {
        await onChangeRole(participantId, role);
      } catch (err) {
        setError('Failed to change role.');
      } finally {
        setIsSaving(false);
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
      sx={{ '& .MuiDialog-paper': { minHeight: 400 } }}
    >
      <DialogTitle>Chat Settings</DialogTitle>
      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
        <Tab label="General" value="general" />
        {isGroupChat && <Tab label="Participants" value="participants" />}
        <Tab label="Appearance" value="appearance" />
      </Tabs>
      <DialogContent sx={{ p: 2 }}>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}
        {tab === 'general' && isGroupChat && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Avatar src={groupSettings.avatar} sx={{ width: 60, height: 60 }} />
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ flexShrink: 0 }}
                disabled={isSaving}
              >
                Change Avatar
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </Box>
            <TextField
              fullWidth
              label="Group Name"
              value={groupSettings.name}
              onChange={handleGroupChange('name')}
              sx={{ mb: 2 }}
              disabled={isSaving}
              inputProps={{ maxLength: 50 }}
              error={!groupSettings.name.trim()}
              helperText={!groupSettings.name.trim() ? 'Group name is required' : ''}
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
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small">
                      <Select
                        value={participant.role || 'member'}
                        onChange={(e) => handleRoleChange(participant.anonymous_id, e.target.value)}
                        disabled={isSaving || participant.anonymous_id === currentUserId}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="member">Member</MenuItem>
                      </Select>
                    </FormControl>
                    {participant.anonymous_id !== currentUserId && (
                      <IconButton
                        onClick={() => handleRemoveParticipant(participant.anonymous_id)}
                        disabled={isSaving}
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Video Shape</InputLabel>
              <Select
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chat Background</InputLabel>
              <Select
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Font Size</InputLabel>
              <Select
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
            <FormControl fullWidth>
              <InputLabel>Font Style</InputLabel>
              <Select
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
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || (isGroupChat && !groupSettings.name.trim())}
          startIcon={isSaving ? <CircularProgress size="16" /> : null}
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