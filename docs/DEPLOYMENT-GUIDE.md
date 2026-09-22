# Terrarium Deployment Guide

## 🏗️ Architecture Analysis

### Technology Stack
```
Frontend:  React + Vite + TypeScript (Port 5173 → 80/443)
Backend:   FastAPI + Python (Port 3001)
Worker:    ARQ + Redis (Background jobs)
Database:  PostgreSQL 16
Cache:     Redis 7
Sandbox:   Docker-in-Docker (Dynamic containers)
Proxy:     Traefik (Preview URLs)
```

### Resource Requirements
```
Minimum:
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB SSD
- Docker support (nested containers)

Recommended:
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB SSD
- Docker with overlay2 storage
```

### Critical Dependencies
- ✅ Docker (for sandbox isolation)
- ✅ PostgreSQL (persistent data)
- ✅ Redis (job queue)
- ✅ Python 3.12+
- ✅ Node.js 20+ (build-time only)
- ⚠️ LLM API keys (Bedrock, Gemini)

---

## 🆓 Free Deployment Options

### **Option 1: Railway.app** ⭐ **RECOMMENDED**

**Why Railway:**
- ✅ Docker-native deployment
- ✅ PostgreSQL + Redis included
- ✅ Free $5/month credits (renewable)
- ✅ Automatic HTTPS
- ✅ Git-based deployments
- ✅ Multi-service support

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add services
railway add postgresql
railway add redis

# Deploy
railway up
```

**Configuration:**
```yaml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile.production"

[deploy]
startCommand = "docker-compose up"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
```

**Estimated Cost:** Free tier covers ~100 hours/month of uptime

---

### **Option 2: Render.com** ⭐

**Why Render:**
- ✅ Native Docker support
- ✅ Free PostgreSQL (90 days)
- ✅ Free Redis (30 days)
- ✅ Auto-scaling
- ✅ Built-in CDN

**Setup:**
```yaml
# render.yaml
services:
  - type: web
    name: terrarium-api
    env: docker
    dockerfilePath: ./apps/api/Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: terrarium-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: terrarium-redis
          type: redis
          property: connectionString

  - type: worker
    name: terrarium-worker
    env: docker
    dockerfilePath: ./apps/api/Dockerfile
    startCommand: arq terrarium_api.worker.WorkerSettings

  - type: web
    name: terrarium-web
    env: static
    buildCommand: cd apps/web && pnpm install && pnpm build
    staticPublishPath: apps/web/dist

databases:
  - name: terrarium-db
    databaseName: terrarium
    plan: free

  - name: terrarium-redis
    plan: free
```

**Limitations:** Docker sandboxes may not work (no nested Docker)

---

### **Option 3: Fly.io** ⭐⭐ **BEST FOR DOCKER**

**Why Fly.io:**
- ✅ **Full Docker support** (nested containers work!)
- ✅ Free allowance: 3 shared-cpu VMs + 3GB storage
- ✅ Global CDN
- ✅ PostgreSQL included
- ✅ Real production-grade infrastructure

**Setup:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Add PostgreSQL
flyctl postgres create

# Add Redis
flyctl redis create

# Deploy
flyctl deploy
```

**fly.toml:**
```toml
app = "terrarium"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile.production"

[env]
  PORT = "3001"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[mounts]
  source = "terrarium_data"
  destination = "/data"
```

**Estimated Cost:** Free for hobby projects

---

### **Option 4: Google Cloud Run** (Limited)

**Why Cloud Run:**
- ✅ Generous free tier (2M requests/month)
- ✅ Auto-scaling to zero
- ✅ Integrated with Google AI (Gemini)

**Limitations:**
- ❌ No Docker-in-Docker (sandbox won't work)
- ⚠️ Need alternative sandbox strategy

**Setup:**
```bash
gcloud run deploy terrarium-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### **Option 5: AWS Free Tier** (Complex)

**Services:**
- EC2 t2.micro (750 hours/month free for 12 months)
- RDS PostgreSQL t3.micro (750 hours/month)
- ElastiCache Redis t2.micro (not free)

**Setup:**
```bash
# EC2 instance with Docker
ssh ec2-user@your-instance

# Install Docker
sudo yum install docker -y
sudo systemctl start docker

# Clone repo
git clone https://github.com/your-org/terrarium.git
cd terrarium

# Deploy
docker compose -f infra/docker-compose.yml up -d
```

**Estimated Cost:** Free first year, then $30-50/month

---

### **Option 6: Self-Hosted (VPS)** 💰

**Providers:**

| Provider | Price | Specs |
|----------|-------|-------|
| **DigitalOcean** | $12/month | 2 CPU, 4GB RAM |
| **Linode (Akamai)** | $12/month | 2 CPU, 4GB RAM |
| **Hetzner** | €4.5/month | 2 CPU, 4GB RAM (EU only) |
| **Oracle Cloud** | **FREE forever** | 4 CPU, 24GB RAM (ARM) |

**Oracle Cloud Free Tier** is the best deal:
```
- 4 ARM CPUs
- 24GB RAM
- 200GB storage
- 10TB bandwidth/month
- Forever free (not trial)
```

**Setup:**
```bash
# Create compute instance
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y

# Deploy
cd /opt
git clone <your-repo>
cd terrarium
docker compose up -d

# Setup Caddy for HTTPS
sudo apt install caddy
```

**Caddyfile:**
```
terrarium.yourdomain.com {
    reverse_proxy localhost:3001
}

terrarium.yourdomain.com/app/* {
    reverse_proxy localhost:5173
}
```

---

## 📦 Production Build Strategy

### **Step 1: Create Production Dockerfile**

**Dockerfile.production:**
```dockerfile
# Stage 1: Build web UI
FROM node:20-alpine AS web-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web ./apps/web
COPY packages/contracts ./packages/contracts
RUN npm install -g pnpm
RUN pnpm install
RUN cd apps/web && pnpm build

# Stage 2: Python API
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Copy Python code
COPY apps/api ./apps/api
COPY packages/py-contracts ./packages/py-contracts
COPY packages/agents ./packages/agents
COPY packages/sandbox ./packages/sandbox
COPY pyproject.toml uv.lock ./

# Install Python dependencies
RUN pip install uv
RUN uv sync --frozen --no-dev

# Copy built web UI
COPY --from=web-builder /app/apps/web/dist ./apps/web/dist

# Expose ports
EXPOSE 3001

CMD ["uvicorn", "terrarium_api.app:app", "--host", "0.0.0.0", "--port", "3001"]
```

### **Step 2: Environment Variables**

**Required for production:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/terrarium

# Redis
REDIS_URL=redis://host:6379/0

# LLM APIs
GOOGLE_API_KEY=your-gemini-key
AWS_ACCESS_KEY_ID=your-bedrock-key
AWS_SECRET_ACCESS_KEY=your-bedrock-secret
AWS_DEFAULT_REGION=us-east-1

# App config
NODE_ENV=production
TERRARIUM_MODE=live
IDLE_TIMEOUT_SECONDS=3600

# Security
SECRET_KEY=generate-random-64-char-key
ALLOWED_ORIGINS=https://yourdomain.com
```

### **Step 3: Database Migrations**

```bash
# Run migrations on deploy
docker exec terrarium-api sh -c "cd apps/api && alembic upgrade head"
```

---

## 🎯 Recommended Deployment Path

### **For MVP/Testing (Free):**
```
1. Railway.app (easiest)
   OR
2. Fly.io (if you need full Docker sandbox)
```

### **For Production (Paid):**
```
1. Fly.io ($10-30/month) - Best Docker support
   OR
2. DigitalOcean App Platform ($12-40/month) - Managed
   OR
3. AWS/GCP ($50-200/month) - Enterprise scale
```

### **For Open Source Community:**
```
1. Oracle Cloud Free Tier (forever free)
   + Domain from Namecheap ($1/year)
   + Cloudflare (free CDN + SSL)
```

---

## 🚀 Quick Start: Deploy to Fly.io

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Launch (follow prompts)
flyctl launch

# 4. Add PostgreSQL
flyctl postgres create --name terrarium-db

# 5. Add Redis
flyctl redis create --name terrarium-redis

# 6. Set secrets
flyctl secrets set \
  GOOGLE_API_KEY=your-key \
  AWS_ACCESS_KEY_ID=your-key \
  AWS_SECRET_ACCESS_KEY=your-secret

# 7. Deploy
flyctl deploy

# 8. Run migrations
flyctl ssh console
cd apps/api && alembic upgrade head

# 9. Open app
flyctl open
```

**Your app will be live at:** `https://terrarium-xyz.fly.dev`

---

## 📊 Cost Comparison

| Platform | Free Tier | Paid Tier | Docker Support | Best For |
|----------|-----------|-----------|----------------|----------|
| **Fly.io** | 3 VMs + 3GB | $10-30/mo | ✅ Full | Production |
| **Railway** | $5 credits | $20-50/mo | ✅ Good | MVP |
| **Render** | Limited | $15-40/mo | ⚠️ Limited | Simple apps |
| **Oracle Cloud** | ✅ Forever | Free | ✅ Full | Open source |
| **Heroku** | Discontinued | $7-50/mo | ❌ No | Not suitable |
| **Vercel/Netlify** | Free | $20/mo | ❌ No | Frontend only |

---

## 🔒 Security Checklist for Production

- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_ORIGINS`
- [ ] Enable rate limiting (10 req/min per IP)
- [ ] Set up database backups
- [ ] Use environment variables (never commit secrets)
- [ ] Enable Docker resource limits
- [ ] Configure log rotation
- [ ] Set up monitoring (Sentry/DataDog)
- [ ] Enable CORS properly
- [ ] Add authentication (Phase 6)

---

## 🎓 Next Steps

1. **Choose platform** based on your needs
2. **Set up CI/CD** (GitHub Actions)
3. **Configure monitoring**
4. **Add custom domain**
5. **Enable analytics**

**Want me to help you deploy to a specific platform?** Let me know which one you prefer!
