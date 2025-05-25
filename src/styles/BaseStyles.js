import { alpha } from "@mui/material";
import theme from "../Theme";

// Constants for reuse
export const BOARD_SIZE = 10000;
export const BASE_Z_INDEX = 10; // Board
export const BASE_SHADOW = "0 4px 16px rgba(0,0,0,0.12)";
export const HOVER_SHADOW = "0 8px 24px rgba(0,0,0,0.18)";
export const MODAL_Z_INDEX = 111; // Edit Tweet Modal, Options Modal, Media Modal
export const MODAL_SHADOW = "0 8px 28px rgba(0,0,0,0.22)";
export const MEDIA_PREVIEW_SIZE = 250;
export const TWEET_Z_INDEX = 99;

// Reusable style objects
export const baseTypographyStyles = {
  color: "text.primary",
  fontWeight: 400,
  lineHeight: 1.6,
};

export const baseHoverEffect = {
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: HOVER_SHADOW,
  },
  "&:focus": {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
};

export const baseCardStyles = {
  bgcolor: "background.paper",
  borderRadius: theme.shape.borderRadiusMedium, // Align with theme.shape.borderRadiusMedium
  boxShadow: BASE_SHADOW,
  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  transition: "all 0.3s ease",
  ...baseHoverEffect,
};

export const baseButtonStyles = {
  borderRadius: theme.shape.borderRadiusLarge, // Matches actionButtonStyles
  textTransform: "none",
  transition: "all 0.2s ease",
  fontWeight: 600,
  "&:hover": {
    transform: "scale(1.02)",
    backgroundColor: (theme) => theme.palette.primary.dark,
  },
  "&:active": {
    transform: "scale(0.98)",
  },
  "&:focus": {
    outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 2,
  },
  "&:disabled": {
    backgroundColor: "action.disabled",
    color: "action.disabledOpacity",
  },
};

export const actionButtonStyles = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: theme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "primary.main",
  color: "primary.contrastText",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    backgroundColor: "primary.dark",
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: "action.disabled",
    color: "action.disabledOpacity",
  },
};

export const cancelButtonStyle = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: theme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "background.default",
  color: "text.primary",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    backgroundColor: "background.hover",
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: "action.disabled",
    color: "action.disabledOpacity",
  },
};

export const deleteButtonStyle = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: theme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "error.main",
  color: "error.contrastText",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    backgroundColor: "error.dark",
    boxShadow: "none",
  },
  "&:disabled": {
    backgroundColor: "action.disabled",
    color: "action.disabledOpacity",
  },
};

export const inputStyles = {
  mt: theme.spacing(1),
  backgroundColor: "background.default",
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "primary.main",
  },
  "& .MuiOutlinedInputRoot": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& .MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
    "&:hover .MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
    "&MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "text.secondary",
    opacity: 1,
  },
};

export const inputStylesWhite = {
  mt: theme.spacing(1),
  backgroundColor: "background.paper",
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "primary.main",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& .MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
    "&:hover .MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
    "&.MuiOutlinedInputNotchedOutline": {
      border: "none",
    },
  },
  "& .MuiInputBase-input": {
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "text.secondary",
    opacity: 1,
  },
};

export const selectStyles = {
  mt: theme.spacing(1),
  backgroundColor: "background.default",
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
  },
  "& .MuiSelect-select": {
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
  "& .MuiSelect-icon": {
    color: "text.primary",
  },
  "& .MuiInputLabel-root": {
    fontSize: { xs: "0.875rem", sm: "1rem" },
  },
};

export const chipStyles = {
  fontSize: { xs: "0.75rem", md: "0.875rem" },
  padding: 1,
  border: "none",
};