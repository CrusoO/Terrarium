import { type FormEvent, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";

type Mode = "login" | "signup";

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin, onSignup }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/email-already-in-use") return "Email already registered. Sign in instead.";
    if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential")
      return "Invalid email or password.";
    if (code === "auth/weak-password") return "Password must be at least 6 characters.";
    if (code === "auth/invalid-email") return "Invalid email address.";
    if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
    if (err instanceof Error) return err.message;
    return "Something went wrong. Please try again.";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await onLogin(email, password);
      else await onSignup(email, password);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="xs">
        <Box
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            p: 4, borderRadius: 3, border: 1, borderColor: "divider",
            bgcolor: "background.paper", boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48, fontWeight: 800, fontSize: 20, mb: 0.5 }}>T</Avatar>

          <Typography variant="h6" fontWeight={700} textAlign="center">
            {mode === "login" ? "Sign in to Terrarium" : "Create your account"}
          </Typography>

          {error && <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoFocus fullWidth size="small" autoComplete="email" />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required fullWidth size="small"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              inputProps={{ minLength: 6 }}
              helperText={mode === "signup" ? "At least 6 characters" : undefined} />
            <Button type="submit" variant="contained" fullWidth disabled={busy} sx={{ mt: 0.5, py: 1.2, fontWeight: 700 }}>
              {busy ? <CircularProgress size={20} color="inherit" /> : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </Box>

          <Button variant="text" size="small"
            onClick={() => { setMode((m) => (m === "login" ? "signup" : "login")); setError(null); }}
            sx={{ color: "text.secondary", textTransform: "none" }}>
            {mode === "login" ? "No account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
