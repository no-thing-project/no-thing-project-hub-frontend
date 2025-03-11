import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#F8F8F8", contrastText: "#3E435D" },
    secondary: { main: "#F8F8F8", contrastText: "#ADA7A7" },
    background: { default: "#F8F8F8", paper: "#F8F8F8" },
    text: { primary: "#3E435D", secondary: "#ADA7A7" },
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
