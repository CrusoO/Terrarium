import { useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { getAuthHeaders } from "../../api/auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3001";

export function WhatsAppConnect() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/settings/whatsapp/link-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      if (!response.ok) {
        throw new Error("Could not generate link code");
      }
      const body = (await response.json()) as { code: string; expiresAt: string };
      setCode(body.code);
      setExpiresAt(body.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle1">Connect WhatsApp</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate a 6-digit code, send it from your WhatsApp number to the relay, then request changes from your phone.
        </Typography>
        <Button variant="contained" onClick={() => void generate()} disabled={loading}>
          {loading ? "Generating…" : "Generate code"}
        </Button>
        {code ? (
          <Alert severity="info">
            Your code: <strong>{code}</strong>
            {expiresAt ? ` (expires ${new Date(expiresAt).toLocaleTimeString()})` : null}
          </Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>
    </Paper>
  );
}
