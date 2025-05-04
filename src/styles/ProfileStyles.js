export const headerStyles = {
  card: {
    borderRadius: { xs: 1, sm: 1.5 },
    mb: 3,
    backgroundColor: "background.paper",
    boxShadow: "none",
  },
  content: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mt: 1,
    mb: 1,
    mx: { xs: 2, sm: 3 },
  },
  title: {
    fontWeight: 400,
    color: "text.primary",
  },
  level: {
    color: "text.secondary",
  },
  buttonGroup: {
    display: "flex",
    gap: { xs: 1, sm: 2 },
  },
};

export const fieldStyles = {
  container: { mb: 2 },
  label: { fontWeight: 400, mb: 0.5 },
  input: {
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
    backgroundColor: "background.default",
    borderRadius: 0.8,
  },
  value: { color: "text.secondary" },
};

export const sectionStyles = {
  card: {
    borderRadius: { xs: 1, sm: 1.5 },
    backgroundColor: "background.paper",
    boxShadow: "none",
    mb: 3,
  },
  content: { mx: { xs: 2, sm: 3 }, my: 3 },
  title: { fontWeight: 500, mb: 5 },
};

export const toggleStyles = {
  formControl: {
    gap: 2,
    "& .MuiFormControlLabel-label": { minWidth: "120px", fontWeight: 400 },
  },
  switch: {
    width: 42,
    height: 24,
    padding: 0,
    "&:active .MuiSwitch-thumb": { width: 15 },
    "& .MuiSwitch-switchBase": {
      padding: 0.25,
      "&.Mui-checked": {
        transform: "translateX(18px)",
        color: "#fff",
        "& + .MuiSwitch-track": { backgroundColor: "background.button", opacity: 1 },
      },
      "&.Mui-disabled": {
        color: "#9e9e9e",
        "& + .MuiSwitch-track": { backgroundColor: "background.toggleDisabled", opacity: 1 },
      },
    },
    "& .MuiSwitch-thumb": {
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
      width: 20,
      height: 20,
      borderRadius: 10,
      transition: "all 0.2s ease",
      backgroundColor: "background.default",
      "&.Mui-disabled": { backgroundColor: "background.default", boxShadow: "none" },
    },
    "& .MuiSwitch-track": {
      borderRadius: 12,
      backgroundColor: "background.toggleOff",
      opacity: 1,
      transition: "all 0.2s ease",
      "&.Mui-disabled": { backgroundColor: "background.toggleDisabled", opacity: 0.7 },
    },
  },
};

export const containerStyles = {
  maxWidth: 1500,
  margin: "0 auto",
  p: 0,
};