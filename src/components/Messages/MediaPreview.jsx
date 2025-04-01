import React from "react";
import PropTypes from "prop-types";
import { Paper, Typography, IconButton } from "@mui/material";
import { Clear } from "@mui/icons-material";

const VIDEO_SHAPES = {
  square: "none",
  circle: "circle(50%)",
  heart: "path('M12 21.35l-1.45-1.32C5.4 15.36 ...')", // truncated for brevity
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
};

const PREVIEW_STYLES = {
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
  const shape = pendingMedia.shape || "square";

  const renderPreview = () => {
    switch (pendingMedia.type) {
      case "image":
      case "sticker":
        return (
          <img
            src={pendingMedia.preview}
            alt="Preview"
            style={{
              maxWidth: "100px",
              borderRadius: shape === "square" ? "5px" : "0",
              clipPath: VIDEO_SHAPES[shape],
              backgroundColor: "black",
            }}
            onError={(e) => (e.target.src = "/fallback-image.jpg")}
          />
        );
      case "video":
        return (
          <video
            src={pendingMedia.preview}
            controls
            style={{
              maxWidth: "100px",
              borderRadius: shape === "square" ? "5px" : "0",
              clipPath: VIDEO_SHAPES[shape],
              backgroundColor: "black",
            }}
            onError={() => {}}
          />
        );
      case "voice":
        return <audio src={pendingMedia.preview} controls />;
      case "file":
        return (
          <Typography
            variant="body2"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {pendingMedia.file.name}
          </Typography>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={PREVIEW_STYLES}>
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
    shape: PropTypes.string,
  }).isRequired,
  onClear: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default MediaPreview;
