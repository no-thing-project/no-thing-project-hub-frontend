import { createTheme } from "@mui/material";

export const theme = createTheme({
  primaryRed: "#FF5C5C",
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
      secondary: "#747687",
      light: "#A8AABC"
    },
    primary: {
      main: "#3050B0",
      light: "#7A73D1",
      dark: "#E7EBF2",
      contrastText: "#FFF"
    },
    secondary: {
      main: "#3E435D",
      light: "#C4D9FF",
      dark: "#A6CFD5",
      contrastText: "#FFF"
    }
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
    caption: {
      fontSize: "1rem",
      lineHeight: 1.4,
      fontWeight: 200,
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
