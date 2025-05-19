import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, IconButton } from '@mui/material';
import { Clear } from '@mui/icons-material';

const previewStyles = {
  p: 1,
  mb: 1,
  border: '1px dashed',
  borderColor: 'grey.400',
  borderRadius: 1,
  backgroundColor: 'grey.100',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  maxWidth: { xs: '100%', md: '50%' },
};

const videoShapes = {
  square: 'none',
  circle: 'circle(50%)',
  heart: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
};

const MediaPreview = ({ pendingMedia, onClear, index }) => {
  const renderPreview = () => {
    const shape = pendingMedia.shape || 'square';
    switch (pendingMedia.type) {
      case 'image':
        return (
          <img
            src={pendingMedia.preview}
            alt="Preview"
            style={{
              maxWidth: '100px',
              borderRadius: shape === 'square' ? '5px' : '0',
              clipPath: videoShapes[shape],
              backgroundColor: 'black',
            }}
          />
        );
      case 'video':
        return (
          <video
            src={pendingMedia.preview}
            controls
            style={{
              maxWidth: '100px',
              borderRadius: shape === 'square' ? '5px' : '0',
              clipPath: videoShapes[shape],
              backgroundColor: 'black',
            }}
            onError={() => console.error('Error loading video preview')}
          />
        );
      case 'voice':
        return <audio src={pendingMedia.preview} controls />;
      case 'file':
        return (
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pendingMedia.file.name}
          </Typography>
        );
      default:
        return <Typography variant="body2">Unsupported media type</Typography>;
    }
  };

  return (
    <Paper sx={previewStyles}>
      {renderPreview()}
      <IconButton size="small" onClick={() => onClear(index)} aria-label="Remove media">
        <Clear />
      </IconButton>
    </Paper>
  );
};

MediaPreview.propTypes = {
  pendingMedia: PropTypes.shape({
    file: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
    preview: PropTypes.string.isRequired,
    shape: PropTypes.string,
  }).isRequired,
  onClear: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default React.memo(MediaPreview);