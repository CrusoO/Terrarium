# Fly.io Secrets Setup

After you create the app (`flyctl launch`), you need to set these secrets:

## Required Secrets

```bash
# Database (automatically created by Fly PostgreSQL)
# DATABASE_URL will be set automatically when you attach the database

# Redis (automatically created by Fly Redis)
# REDIS_URL will be set automatically when you attach Redis

# LLM API Keys
flyctl secrets set GEMINI_API_KEY="your-gemini-key-here"
flyctl secrets set NVIDIA_API_KEY="your-nvidia-key-here"
flyctl secrets set AWS_ACCESS_KEY_ID="your-aws-access-key"
flyctl secrets set AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
flyctl secrets set AWS_REGION="us-east-1"

# Application Settings
flyctl secrets set TERRARIUM_MODE="live"
flyctl secrets set PREVIEW_BASE_URL="https://terrarium.fly.dev"
flyctl secrets set SESSION_TIMEOUT_SECONDS="3600"
flyctl secrets set IDLE_TIMEOUT_SECONDS="3600"
```

## Current API Keys from .env

You should use these keys (or update them):

- **GEMINI_API_KEY**: From your .env file
- **NVIDIA_API_KEY**: From your .env file
- **AWS_ACCESS_KEY_ID**: From your .env file (for Bedrock)
- **AWS_SECRET_ACCESS_KEY**: From your .env file (for Bedrock)

---

## Full Deployment Command Sequence

Once logged in, run these commands in order:

```bash
# 1. Create the Fly app
cd C:\Users\thakur\Desktop\Terrarium
flyctl launch --no-deploy

# 2. Create PostgreSQL database (free tier: 256MB)
flyctl postgres create --name terrarium-db --initial-cluster-size 1

# 3. Attach database to app
flyctl postgres attach terrarium-db

# 4. Create Redis (free tier: 256MB)
flyctl redis create --name terrarium-redis

# 5. Set all secrets (see above)

# 6. Deploy!
flyctl deploy

# 7. Open the app
flyctl open
```

---

## Cost Estimate

**Free Tier Usage:**
- 1 shared CPU + 256MB RAM (app)
- PostgreSQL: 256MB (free)
- Redis: 256MB (free)
- **Total: $0/month** for up to 3 shared-cpu-1x VMs

**Recommended Production:**
- 2 CPU + 4GB RAM: ~$30/month
- PostgreSQL 1GB: ~$5/month
- **Total: ~$35/month**

---

## Monitoring After Deployment

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Scale up/down
flyctl scale count 2  # Run 2 instances
flyctl scale vm shared-cpu-1x --memory 512  # Increase memory

# SSH into the container
flyctl ssh console
```
