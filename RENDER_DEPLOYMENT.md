# Render Deployment Guide for Terrarium

## ✅ Why Render?

- **Free Tier**: 750 hours/month (enough for 1 app running 24/7)
- **No Credit Card Required** for free tier
- **Free PostgreSQL**: 90 days, then $7/month (or use external free DB)
- **Free Redis**: 25MB persistent storage
- **Auto-deploy** from GitHub on every push
- **Free SSL** certificates

---

## 🚀 Quick Deployment (5 minutes)

### **Step 1: Push to GitHub**

```bash
cd C:\Users\thakur\Desktop\Terrarium

# Add all deployment files
git add render.yaml RENDER_DEPLOYMENT.md

# Commit
git commit -m "Add Render deployment configuration"

# Push to your feature branch
git push origin feature/phase5-smart-match-and-fixes

# Merge to main when ready
```

### **Step 2: Create Render Account**

1. Go to https://render.com
2. Sign up with GitHub (free account)
3. Connect your GitHub repository

### **Step 3: Deploy from Dashboard**

1. Click **"New +"** → **"Blueprint"**
2. Select your **Terrarium** repository
3. Render will auto-detect `render.yaml`
4. Click **"Apply"**

Render will automatically create:
- ✅ PostgreSQL database (`terrarium-db`)
- ✅ Redis instance (`terrarium-redis`)
- ✅ Web service (`terrarium-api`)

### **Step 4: Set Secret Environment Variables**

After services are created, go to **terrarium-api** → **Environment** and add:

```
GEMINI_API_KEY=your-actual-gemini-key
NVIDIA_API_KEY=your-actual-nvidia-key
AWS_ACCESS_KEY_ID=your-actual-aws-key
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret
PREVIEW_BASE_URL=https://terrarium-api.onrender.com
```

*Get these values from your local `.env` file*

### **Step 5: Run Database Migrations**

Once deployed, open the **Shell** tab in Render dashboard:

```bash
cd /app
alembic upgrade head
```

### **Step 6: Access Your App**

Your app will be live at: `https://terrarium-api.onrender.com`

---

## 📊 Free Tier Limits

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| Web Service | 750 hrs/month | Sleeps after 15min inactivity |
| PostgreSQL | 90 days free trial | Then $7/month or use external DB |
| Redis | 25MB | Persistent storage |
| Build Minutes | Unlimited | |
| Bandwidth | 100GB/month | |

**Auto-sleep:** Free tier web services sleep after 15 minutes of inactivity. First request takes ~30s to wake up.

---

## 🔄 Auto-Deploy Setup

Already configured in `render.yaml`! Every push to `main` branch will:

1. Trigger a new build
2. Run database migrations
3. Deploy updated container
4. Health check before routing traffic

---

## 🆓 Alternative: Free PostgreSQL Options

If you want to avoid the $7/month Postgres cost after 90 days:

### **Option 1: Supabase (Recommended)**
- **Free tier**: 500MB database, 2GB bandwidth
- **Always free** (no trial period)
- **Setup**: https://supabase.com → Create project → Copy connection string
- **Set in Render**: `DATABASE_URL=postgresql://...supabase.co:5432/postgres`

### **Option 2: Neon**
- **Free tier**: 512MB storage, 10GB data transfer
- **Always free**
- **Setup**: https://neon.tech → Create project → Copy connection string

### **Option 3: Railway PostgreSQL**
- **Free tier**: $5 credit/month (covers small DB)
- **Setup**: https://railway.app → New → PostgreSQL → Copy connection string

---

## 🛠️ Production Dockerfile (Already Configured)

The existing `Dockerfile` in the repo is production-ready:

```dockerfile
# Multi-stage build for smaller images
FROM python:3.11-slim as builder
# ... installs dependencies ...

FROM python:3.11-slim
# ... runs migrations and starts services ...
```

**Services Started:**
1. FastAPI API server (port 3001)
2. ARQ worker (background job queue)
3. Alembic migrations (on startup)

---

## 📈 Scaling & Monitoring

### **Scale Up (When needed)**

**Starter Plan ($7/month):**
- No sleep
- 1GB RAM, 1 CPU
- Always-on

**Standard Plan ($25/month):**
- 4GB RAM, 2 CPU
- Multiple workers
- 1000+ concurrent sessions

### **Monitor Your App**

**Render Dashboard:**
- Logs (real-time streaming)
- Metrics (CPU, memory, requests)
- Deploy history

**Health Check:**
```bash
curl https://terrarium-api.onrender.com/health
```

---

## 🔐 Security Checklist

- [x] **HTTPS**: Automatic (Render provides free SSL)
- [x] **Environment Secrets**: Never commit `.env` to git
- [x] **CORS**: Configure `ALLOWED_ORIGINS` in production
- [x] **Rate Limiting**: Add to FastAPI middleware for production
- [ ] **Database Backups**: Enable in Render dashboard (paid plans)
- [ ] **Monitoring**: Add Sentry for error tracking

---

## 🚨 Troubleshooting

### **"Build Failed"**

Check logs in Render dashboard. Common issues:
- Missing dependencies in `requirements.txt`
- Docker build errors
- Port configuration (ensure 3001)

### **"Database Connection Failed"**

Verify `DATABASE_URL` is set correctly:
```bash
# In Render Shell
echo $DATABASE_URL
```

### **"LLM API Timeout"**

Free tier web services have limited CPU. Consider:
- Upgrading to Starter plan ($7/month)
- Using faster LLM models for codegen
- Reducing timeout thresholds

---

## 💡 Cost Optimization

**Fully Free Setup:**
- Render web service (free tier)
- Supabase PostgreSQL (free forever)
- Render Redis (25MB free)
- **Total: $0/month** ✅

**Recommended Production:**
- Render Starter ($7/month)
- Render PostgreSQL ($7/month)
- Render Redis (free)
- **Total: $14/month** 💰

---

## 🎯 Next Steps After Deployment

1. **Test the deployed app**: Open preview URLs
2. **Add custom domain** (optional): Settings → Custom Domains
3. **Set up monitoring**: Add Sentry integration
4. **Enable Phase 6** (Auth): Implement user accounts
5. **Share with users**: Your app is live! 🎉

---

## 🆘 Need Help?

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Terrarium Issues: File a GitHub issue in your repo
