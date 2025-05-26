import { alpha } from "@mui/material";
import theme from "../Theme";

// Override theme breakpoints to include sm at 770px
const customTheme = {
  ...theme,
  breakpoints: {
    ...theme.breakpoints,
    values: {
      xs: 0,
      sm: 770,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
};

export const BOARD_SIZE = 10000;
export const BASE_Z_INDEX = 10;
export const BASE_SHADOW = "0 4px 16px rgba(0,0,0,0.12)";
export const HOVER_SHADOW = "0 8px 24px rgba(0,0,0,0.18)";
export const MODAL_Z_INDEX = 111;
export const MODAL_SHADOW = "0 8px 28px rgba(0,0,0,0.22)";
export const MEDIA_PREVIEW_SIZE = 250;
export const TWEET_Z_INDEX = 99;

export const baseTypographyStyles = {
  color: "text.primary",
  fontWeight: 400,
  lineHeight: 1.6,
};

export const baseHoverEffect = {
  "&:hover": { transform: "translateY(-2px)", boxShadow: HOVER_SHADOW },
  "&:focus": { outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.5)}`, outlineOffset: 2 },
};

export const baseCardStyles = {
  bgcolor: "background.paper",
  borderRadius: customTheme.shape.borderRadiusMedium,
  boxShadow: BASE_SHADOW,
  border: (theme) => `1px solid ${alpha(theme.palette.grey[200], 0.6)}`,
  transition: "all 0.3s ease",
  ...baseHoverEffect,
  width: { xs: "100%", sm: "auto" }, // Ensure card takes full width of its container on mobile
  boxSizing: "border-box", // Include padding and border in the element's total width and height
};

export const baseButtonStyles = {
  borderRadius: customTheme.shape.borderRadiusLarge,
  textTransform: "none",
  transition: "all 0.2s ease",
  fontWeight: 600,
  "&:hover": { transform: "scale(1.02)", backgroundColor: (theme) => theme.palette.primary.dark },
  "&:active": { transform: "scale(0.98)" },
  "&:focus": { outline: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.5)}`, outlineOffset: 2 },
  "&:disabled": { backgroundColor: "action.disabled", color: "action.disabledOpacity" },
};

export const actionButtonStyles = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: customTheme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "primary.main",
  color: "primary.contrastText",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
  "&:disabled": { backgroundColor: "action.disabled", color: "action.disabledOpacity" },
};

export const cancelButtonStyle = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: customTheme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "background.default",
  color: "text.primary",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": { backgroundColor: "background.hover", boxShadow: "none" },
  "&:disabled": { backgroundColor: "action.disabled", color: "action.disabledOpacity" },
};

export const deleteButtonStyle = {
  height: { xs: "40px", sm: "50px" },
  minWidth: { xs: "120px", sm: "150px" },
  borderRadius: customTheme.shape.borderRadiusLarge,
  padding: { xs: "0 15px", sm: "0 25px" },
  backgroundColor: "error.main",
  color: "error.contrastText",
  boxShadow: "none",
  fontSize: { xs: "0.875rem", sm: "1rem" },
  fontWeight: 600,
  transition: "all 0.3s ease-in-out",
  "&:hover": { backgroundColor: "error.dark", boxShadow: "none" },
  "&:disabled": { backgroundColor: "action.disabled", color: "action.disabledOpacity" },
};

export const inputStyles = {
  mt: customTheme.spacing(1),
  backgroundColor: "background.default",
  borderRadius: customTheme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": { color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" } },
  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
  "& .MuiOutlinedInput-root": {
    borderRadius: customTheme.shape.borderRadiusSmall,
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
  },
  "& .MuiInputBase-input": { fontSize: { xs: "0.875rem", sm: "1rem" } },
  "& .MuiInputBase-input::placeholder": { color: "text.secondary", opacity: 1 },
};

export const inputStylesWhite = {
  mt: customTheme.spacing(1),
  backgroundColor: "background.paper",
  borderRadius: customTheme.shape.borderRadiusSmall,
  "& .MuiInputLabel-root": { color: "text.secondary", fontSize: { xs: "0.875rem", sm: "1rem" } },
  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
  "& .MuiOutlinedInput-root": {
    borderRadius: customTheme.shape.borderRadiusSmall,
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&:hover .MuiOutlinedInput-notchedOutline": { border: "none" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { border: "none" },
  },
  "& .MuiInputBase-input": { fontSize: { xs: "0.875rem", sm: "1rem" } },
  "& .MuiInputBase-input::placeholder": { color: "text.secondary", opacity: 1 },
};

export const selectStyles = {
  mt: customTheme.spacing(1),
  backgroundColor: "background.default",
  borderRadius: customTheme.shape.borderRadiusSmall,
  "& .MuiOutlinedInput-root": {
    borderRadius: customTheme.shape.borderRadiusSmall,
    "& fieldset": { border: "none" },
    "&:hover fieldset": { border: "none" },
    "&.Mui-focused fieldset": { border: "none" },
  },
  "& .MuiSelect-select": { fontSize: { xs: "0.875rem", sm: "1rem" } },
  "& .MuiSelect-icon": { color: "text.primary" },
  "& .MuiInputLabel-root": { fontSize: { xs: "0.875rem", sm: "1rem" } },
};

export const chipStyles = {
  fontSize: { xs: "0.75rem", md: "0.875rem" },
  padding: { xs: "0.3rem 0.5rem", md: "0.5rem 1rem" },
  border: "none",
};

export const headerStyles = {
  card: {
    borderRadius: { xs: 1, sm: 1.5 },
    mb: 3,
    backgroundColor: "background.paper",
    boxShadow: "none",
    width: { xs: "100%", sm: "auto" }, // Ensure header card takes full width on mobile
    boxSizing: "border-box", // Include padding and border
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    mt: 1,
    mb: 1,
    mx: { xs: 2, sm: 3 },
    gap: { xs: 2, sm: 3 },
    textAlign: { xs: "center", sm: "left" },
  },
  leftSection: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  rightSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  title: { fontWeight: 400, color: "text.primary" },
  level: { color: "text.secondary" },
  buttonGroup: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: { xs: 1, sm: 2 },
    width: { xs: "100%", sm: "auto" },
  },
  splitButtonGroup: {
    display: "flex",
    flexDirection: { xs: "row", sm: "column" },
    alignItems: "center",
    justifyContent: "center",
    width: { xs: "100%", sm: "auto" },
    gap: { xs: 1, sm: 2 },
    flexWrap: { xs: "wrap", sm: "nowrap" },
  },
  chipContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: { xs: "nowrap", sm: "wrap" },
    gap: { xs: 0.5, sm: 1 },
    mt: 1,
    width: { xs: "100%", sm: "auto" },
    justifyContent: { xs: "center", sm: "start" },
    overflowX: { xs: "auto", sm: "visible" },
    "&::-webkit-scrollbar": { display: "none" },
    msOverflowStyle: "none",
    scrollbarWidth: "none",
    // sm: {
    //   display: "flex",
    //   flexWrap: "wrap",
    // },
  },
  chip: {
    fontSize: { xs: "0.65rem", sm: "0.75rem" },
    padding: { xs: "0.2rem", sm: "0.3rem 0.6rem" },
    height: { xs: "32px", sm: "28px" },
    transition: customTheme.transitions.create(["width", "padding"], {
      duration: customTheme.transitions.duration.short,
      easing: customTheme.transitions.easing.easeInOut,
    }),
    cursor: "pointer",
    "& .MuiChip-label": { padding: { xs: 0, sm: "0 6px" }, display: { xs: "none", sm: "inline" } },
    "& .MuiChip-icon": { margin: { xs: "0", sm: "0 0 0 -4px" }, fontSize: { xs: "1rem", sm: "0.875rem" } },
  },
  chipExpanded: {
    width: { xs: "auto", sm: "auto" },
    // widthMax: {xs: "auto", sm: "3s"}
    padding: { xs: "0.2rem 0.6rem", sm: "0.5rem 1rem" },
    "& .MuiChip-label": {
      display: "inline",
    },
  },
  chipCollapsed: {
    width: { xs: "32px", sm: "auto" },
    padding: { xs: "0.2rem", sm: "0.3rem 0.6rem" },
    "& .MuiChip-label": { display: { xs: "none", sm: "inline" } },
  },
};

export const fieldStyles = {
  container: { mb: 2 },
  label: { fontWeight: 400, mb: 0.5 },
  input: {
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    backgroundColor: "background.default",
    borderRadius: customTheme.shape.borderRadiusSmall,
  },
  value: { color: "text.secondary" },
};

export const sectionStyles = {
  card: {
    borderRadius: { xs: 1, sm: 1.5 },
    backgroundColor: "background.paper",
    boxShadow: "none",
    mb: 3,
    width: { xs: "100%", sm: "auto" }, // Ensure section card takes full width on mobile
    boxSizing: "border-box", // Include padding and border
  },
  content: { mx: { xs: 2, sm: 3 }, my: 3 },
  title: { fontWeight: 500, mb: 5 },
};

export const toggleStyles = {
  formControl: { gap: 2, "& .MuiFormControlLabel-label": { minWidth: "120px", fontWeight: 400 } },
  switch: {
    width: 42,
    height: 24,
    padding: 0,
    "&:active .MuiSwitch-thumb": { width: 15 },
    "& .MuiSwitch-switchBase": {
      padding: 0.25,
      "&.Mui-checked": { transform: "translateX(18px)", color: "#fff", "& + .MuiSwitch-track": { backgroundColor: "primary.main", opacity: 1 } },
      "&.Mui-disabled": { color: "grey.400", "& + .MuiSwitch-track": { backgroundColor: "action.disabledBackground", opacity: 1 } },
    },
    "& .MuiSwitch-thumb": {
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      width: 20,
      height: 20,
      borderRadius: 10,
      transition: customTheme.transitions.create(["width"], { duration: 200 }),
      backgroundColor: "background.default",
    },
    "& .MuiSwitch-track": {
      borderRadius: 12,
      backgroundColor: "grey.400",
      opacity: 1,
      transition: customTheme.transitions.create(["background-color"], { duration: 200 }),
      "&.Mui-disabled": { backgroundColor: "action.disabledBackground", opacity: 0.7 },
    },
  },
};

export const containerStyles = {
  width: { xs: "100%", sm: "auto" },
  maxWidth: { xs: "100%", sm: "1500px" },
  margin: { xs: 0, sm: "0 auto" },
  padding: { xs: 0, sm: 2 }, // Remove padding on mobile (xs), keep for sm and up
  boxSizing: "border-box", // Added for proper width calculation with padding
};

export const gridStyles = {
  container: {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(auto-fill, minmax(300px, 1fr))",
    },
  },
};

export const skeletonStyles = {
  container: {
    borderRadius: customTheme.shape.borderRadiusMedium,
    bgcolor: "grey.200",
  },
  header: {
    height: { xs: 80, sm: 100 },
    mb: 2,
  },
  filter: {
    height: { xs: 40, sm: 50 },
    mb: 2,
  },
  card: {
    height: { xs: 180, sm: 200 },
  },
};

export const dialogStyles = {
  paper: {
    borderRadius: customTheme.shape.borderRadiusMedium,
    boxShadow: MODAL_SHADOW,
    bgcolor: "background.paper",
    width: { xs: "90%", sm: "500px" },
    maxWidth: "100%",
    p: { xs: 2, sm: 3 },
  },
  title: {
    ...baseTypographyStyles,
    fontSize: { xs: "1.25rem", sm: "1.5rem" },
    fontWeight: 500,
    mb: 2,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 1,
    mt: 2,
  },
};

export const filterStyles = {
  container: {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: { xs: 1, sm: 2 },
    mb: 3,
    alignItems: { xs: "stretch", sm: "center" },
  },
  search: {
    flex: 1,
    maxWidth: { xs: "100%", sm: "400px" },
  },
  select: {
    minWidth: { xs: "100%", sm: "150px" },
  },
  resetButton: {
    height: { xs: "40px", sm: "50px" },
    minWidth: { xs: "100%", sm: "120px" },
  },
};