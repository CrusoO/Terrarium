import { createTheme } from "@mui/material/styles";

export const terrariumTheme = createTheme({
  palette: {
    primary: {
      main: "#7A1F3D",
      dark: "#641932",
      light: "#F3E4E9",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#5f6368",
      light: "#f1f3f4",
      dark: "#3c4043",
    },
    success: { main: "#2e7d32", dark: "#1b5e20", light: "#e6f4ea" },
    warning: { main: "#f9ab00", light: "#fef7e0" },
    error: { main: "#d93025", light: "#fce8e6" },
    background: {
      default: "#F6F3F0",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1D1A1B",
      secondary: "#5E585A",
    },
    divider: "#E6E0DC",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.04em" },
    h2: { fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em" },
    h3: { fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.02em" },
    h4: { fontWeight: 600, fontSize: "1.1rem" },
    h5: { fontWeight: 600, fontSize: "1rem" },
    h6: { fontWeight: 600, fontSize: "0.95rem" },
    subtitle1: { fontWeight: 500, fontSize: "1rem", lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.5 },
    body1: { fontSize: "0.95rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    caption: { fontSize: "0.75rem", lineHeight: 1.4 },
    button: { textTransform: "none", fontWeight: 500, letterSpacing: "0.01em" },
    overline: { textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.08em", fontSize: "0.7rem" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { 
          fontWeight: 500, 
          fontSize: "0.8rem",
          height: 24,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0 8px 24px rgba(23, 24, 28, 0.06)",
        },
      },
    },
  },
});
