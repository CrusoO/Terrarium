import { createTheme } from "@mui/material/styles";

export const terrariumTheme = createTheme({
  palette: {
    primary: {
      main: "#6e1429",
      dark: "#4c0d1c",
      light: "#f4e8ec",
      contrastText: "#ffffff",
    },
    success: { main: "#2e7d32" },
    background: {
      default: "#faf8f7",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e1e1e",
      secondary: "#6b6567",
    },
    divider: "#e6dddf",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, "Segoe UI", sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});
