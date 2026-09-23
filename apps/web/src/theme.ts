import { createTheme } from "@mui/material/styles";

export const terrariumTheme = createTheme({
  palette: {
    primary: {
      main: "#6e1429", // Original maroon
      dark: "#4c0d1c",
      light: "#f4e8ec",
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
      default: "#f6f5f3",
      paper: "#ffffff",
    },
    text: {
      primary: "#17181c",
      secondary: "#667085",
    },
    divider: "#e7e5e1",
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    h1: { fontWeight: 600, fontSize: "2rem", letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, fontSize: "1.5rem", letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, fontSize: "1.25rem" },
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
