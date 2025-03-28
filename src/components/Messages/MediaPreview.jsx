import React from "react";
import PropTypes from "prop-types";
import { Paper, Typography, IconButton } from "@mui/material";
import { Clear } from "@mui/icons-material";

const previewStyles = {
  p: 1,
  mb: 1,
  border: "1px dashed",
  borderColor: "grey.400",
  borderRadius: 1,
  backgroundColor: "grey.100",
  display: "flex",
  alignItems: "center",
  gap: 1,
  maxWidth: { xs: "100%", md: "50%" },
};

const MediaPreview = ({ pendingMedia, onClear, index }) => {
  const renderPreview = () => {
    switch (pendingMedia.type) {
      case "image":
      case "sticker":
        return <img src={pendingMedia.preview} alt="Preview" style={{ maxWidth: "100px", borderRadius: "5px" }} />;
      case "video":
        return <video src={pendingMedia.preview} controls style={{ maxWidth: "100px", borderRadius: "5px" }} />;
      case "voice":
        return <audio src={pendingMedia.preview} controls />;
      case "file":
        return <Typography variant="body2">{pendingMedia.file.name}</Typography>;
      default:
        return null;
    }
  };

  return (
    <Paper sx={previewStyles}>
      {renderPreview()}
      <IconButton size="small" onClick={() => onClear(index)}>
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
  }).isRequired,
  onClear: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default MediaPreview;