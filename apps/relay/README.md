# Terrarium Relay

Always-on FastAPI service for WhatsApp change requests. It stores requests and sends replies; it never runs agents, the sandbox, Docker, or LLM calls.

## Twilio WhatsApp sandbox

1. Create a Twilio account and enable the WhatsApp sandbox.
2. Set environment variables (see repo `.env.example`):
   - `TWILIO_AUTH_TOKEN`
   - `WHATSAPP_PROVIDER=twilio`
   - `WORKER_TOKENS` (comma-separated bearer tokens for the laptop worker)
3. Point the sandbox webhook to `https://<relay-host>/channels/whatsapp/webhook`.
4. In Terrarium web settings, generate a link code and send it from your WhatsApp number.

## Run locally

```powershell
cd apps/relay
uv run uvicorn terrarium_relay.main:app --host 0.0.0.0 --port 3010
```

Use `RELAY_SKIP_SIGNATURE=1` only in local tests.

## Deploy

Free-tier friendly: run the included Dockerfile on any container host with `DATABASE_URL` (Postgres) or default SQLite for development.
