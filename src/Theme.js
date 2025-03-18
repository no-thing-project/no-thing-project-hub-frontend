import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#F5F7F9",
      paper: "#FFF",
      hover: "#E7EBF2",
      button: "#3E435D",
      toggleOff: "#b8c4d8",
      toggleDisabled: "#e7ebf2"
    },
    text: {
      primary: "#3E435D",
      secondary: "#747687"
    },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
    body1: {
      fontSize: "1.2rem",
      lineHeight: 1.4,
      fontWeight: 100,
    },
    body2: {
      fontSize: "1.2rem",
      lineHeight: 1.4,
      fontWeight: 200,
    },
    body3: {
      fontSize: "1.2rem",
      lineHeight: 1.4,
      fontWeight: 200,
    },
    body4: {
      fontSize: "1.2rem",
      lineHeight: 1.4,
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 20,
    borderRadiusSmall: 0.7,
    borderRadiusMedium: 2,
  },
  custom: {
    loginPaperWidth: "100%",
    loginPaperMaxWidth: 350,
    loginButtonHeight: 48,
    loginButtonFontSize: "16px",
  },
});

export default theme;
