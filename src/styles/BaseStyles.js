import { Opacity } from "@mui/icons-material";
import theme from "../Theme";

export const actionButtonStyles = {
  height: "50px",
  minWidth: "150px",
  borderRadius: 20,
  padding: "0 25px",
  backgroundColor: "background.button",
  boxShadow: "none",
  transition: "all 0.3s ease-in-out",
  ":hover": {
    transition: "all 0.3s ease-in-out",
    color: "text.primary",
    backgroundColor: "background.hover",
    boxShadow: "none",
  },
};

export const cancelButtonStyle = {
  height: "50px",
  minWidth: "150px",
  borderRadius: 20,
  padding: "0 25px",
  backgroundColor: "background.default",
  color: "text.primary",
  boxShadow: "none",
  transition: "all 0.3s ease-in-out",
  ":hover": {
    transition: "all 0.3s ease-in-out",
    color: "text.primary",
    backgroundColor: "background.hover",
    boxShadow: "none",
  },
};

export const deleteButtonStyle = {
  height: "50px",
  minWidth: "150px",
  borderRadius: 20,
  padding: "0 25px",
  backgroundColor: "background.default",
  color: "error.main",
  boxShadow: "none",
  transition: "all 0.3s ease-in-out",
  ":hover": {
    transition: "all 0.3s ease-in-out",
    color: "background.paper",
    backgroundColor: "error.dark",
    boxShadow: "none",
  },
};

export const inputStyles = {
  mt: theme.spacing(1),
  backgroundColor: "background.default",
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": {
    color: "text.secondary",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "text.primary",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: theme.palette.text.secondary,
  },
};

export const inputStylesWhite = {
  mt: theme.spacing(1),
  backgroundColor: "background.paper",
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": {
    color: "text.secondary",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "text.primary",
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: theme.palette.text.secondary,
  },
};

export const selectStyles = {
  mt: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadiusSmall,
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    // Замість notchedOutline – стилізуємо fieldset
    "& fieldset": {
      border: "none !important",
    },
    "&:hover fieldset": {
      border: "none !important",
    },
    "&.Mui-focused fieldset": {
      border: "none !important",
    },
  },
  "& .MuiSelect-icon": {
    color: theme.palette.text.primary,
  },
};
