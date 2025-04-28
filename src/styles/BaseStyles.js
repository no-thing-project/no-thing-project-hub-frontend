import theme from "../Theme";

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
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadiusSmall,
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
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