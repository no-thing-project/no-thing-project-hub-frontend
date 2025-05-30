import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { inputStyles, actionButtonStyles, cancelButtonStyle } from '../../styles/BaseStyles';
import { validateField, validateForm } from '../../utils/validations';
import { debounce } from 'lodash';
import { useNotification } from '../../context/NotificationContext';
import { useSocial } from '../../hooks/useSocial';
import PropTypes from 'prop-types';

const MAX_USERNAME_LENGTH = 50;
const MIN_QUERY_LENGTH = 3;

// Simple in-memory cache for search results
const searchCache = new Map();

const FriendFormDialog = ({ open, title, username, setUsername, onSave, onCancel, disabled, token }) => {
  const { showNotification } = useNotification();
  const { searchUsersByUsername, loading: searchLoading } = useSocial(token);
  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);

  const validationRules = useMemo(
    () => ({
      username: {
        value: username,
        rules: { required: true, minLength: MIN_QUERY_LENGTH, maxLength: MAX_USERNAME_LENGTH },
      },
    }),
    [username]
  );

  const debouncedSearchUsers = useMemo(
    () =>
      debounce(async (query) => {
        if (!query || query.length < MIN_QUERY_LENGTH) {
          setUserSuggestions([]);
          return;
        }

        if (searchCache.has(query)) {
          setUserSuggestions(searchCache.get(query));
          return;
        }

        try {
          const users = await searchUsersByUsername(query, { limit: 10 });
          const suggestions = users.map((user) => ({
            username: user.username || user.anonymous_id || 'Unknown',
            anonymous_id: user.anonymous_id,
          }));
          setUserSuggestions(suggestions);
          searchCache.set(query, suggestions);
          if (!suggestions.length) {
            showNotification('No users found for this query', 'info');
          }
        } catch (err) {
          console.error('Search users error:', err);
          showNotification(err.message || 'Failed to fetch user suggestions', 'error');
          setUserSuggestions([]);
        }
      }, 300),
    [searchUsersByUsername, showNotification]
  );

  const handleUsernameChange = useCallback(
    (event, newValue) => {
      const value = newValue || '';
      setUsername(value);

      const fieldErrors = validateField('username', value, validationRules.username.rules);
      setErrors((prev) => ({
        ...prev,
        username: fieldErrors[0] || null,
      }));

      if (value.length >= MIN_QUERY_LENGTH) {
        debouncedSearchUsers(value);
      } else {
        setUserSuggestions([]);
      }
    },
    [debouncedSearchUsers, validationRules, setUsername]
  );

  const handleSave = useCallback(async () => {
    const formErrors = validateForm(validationRules);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const selectedUser = userSuggestions.find((user) => user.username === username);
    if (!selectedUser) {
      showNotification('Please select a valid user from the suggestions', 'error');
      setErrors((prev) => ({
        ...prev,
        username: 'Invalid user selected',
      }));
      return;
    }

    try {
      await onSave(selectedUser.anonymous_id);
      setUsername('');
      setUserSuggestions([]);
      setErrors({});
    } catch (err) {
      console.error('Send friend request error:', err);
      showNotification(err.message || 'Failed to send friend request', 'error');
    }
  }, [username, userSuggestions, validationRules, onSave, showNotification, setUsername]);

  useEffect(() => {
    if (!open) {
      setUsername('');
      setUserSuggestions([]);
      setErrors({});
      debouncedSearchUsers.cancel();
      searchCache.clear();
    }
    return () => {
      debouncedSearchUsers.cancel();
    };
  }, [open, debouncedSearchUsers, setUsername]);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { p: { xs: 1, md: 2 } } }}
      aria-labelledby="friend-form-dialog-title"
    >
      <DialogTitle
        id="friend-form-dialog-title"
        sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, textAlign: 'center' }}
      >
        {title || 'Add a New Friend'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            freeSolo={false}
            options={userSuggestions}
            getOptionLabel={(option) => option.username || ''}
            inputValue={username}
            onInputChange={handleUsernameChange}
            loading={searchLoading}
            disabled={disabled}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label="Username"
                type="text"
                variant="outlined"
                sx={{ ...inputStyles, mt: 0 }}
                required
                error={!!errors.username}
                helperText={errors.username || 'Search for a user to send a friend request'}
                inputProps={{
                  ...params.inputProps,
                  maxLength: MAX_USERNAME_LENGTH,
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            aria-label="Search for a user to send a friend request"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 1, md: 2 }, justifyContent: 'center', gap: 1 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            ...actionButtonStyles,
            minWidth: { xs: '100%', sm: 120 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
          disabled={disabled || !!errors.username || searchLoading}
          aria-label="Send friend request"
        >
          Send Request
        </Button>
        <Button
          variant="contained"
          onClick={onCancel}
          sx={{
            ...cancelButtonStyle,
            minWidth: { xs: '100%', sm: 120 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
          disabled={disabled}
          aria-label="Cancel friend request dialog"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FriendFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  username: PropTypes.string.isRequired,
  setUsername: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  token: PropTypes.string.isRequired,
};

FriendFormDialog.defaultProps = {
  disabled: false,
};

export default React.memo(FriendFormDialog);