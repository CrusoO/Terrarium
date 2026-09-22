# 🚀 Render Deployment - Quick Start

## **3 Simple Steps to Deploy Terrarium FREE**

### **Step 1: Push Code to GitHub** (2 minutes)

```bash
cd C:\Users\thakur\Desktop\Terrarium

# Add deployment files
git add render.yaml Dockerfile docker-compose.yml RENDER_DEPLOYMENT.md RENDER_QUICKSTART.md
git commit -m "Add Render deployment configuration"

# Push to your branch
git push origin feature/phase5-smart-match-and-fixes
```

---

### **Step 2: Create Render Account** (1 minute)

1. Go to **https://render.com**
2. Click **"Get Started"**
3. **Sign up with GitHub** (no credit card needed!)
4. Authorize Render to access your repositories

---

### **Step 3: Deploy with Blueprint** (2 minutes)

1. In Render dashboard, click **"New +"** → **"Blueprint"**
2. Select your **Terrarium** repository
3. Render detects `render.yaml` automatically
4. Click **"Apply Blueprint"**

**Render will automatically create:**
- ✅ PostgreSQL database (`terrarium-db`)
- ✅ Redis instance (`terrarium-redis`)
- ✅ Web service (`terrarium-api`)

**Wait ~5 minutes for initial build...**

---

### **Step 4: Configure API Keys** (2 minutes)

After deployment completes:

1. Go to **"terrarium-api"** service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add these secrets one by one:

```
GEMINI_API_KEY = [your key from .env file]
NVIDIA_API_KEY = [your key from .env file]
AWS_ACCESS_KEY_ID = [your key from .env file]
AWS_SECRET_ACCESS_KEY = [your key from .env file]
PREVIEW_BASE_URL = https://terrarium-api.onrender.com
```

5. Click **"Save Changes"** (will trigger redeploy)

---

### **Step 5: Run Migrations** (1 minute)

1. Go to **"terrarium-api"** service
2. Click **"Shell"** tab at the top
3. Run these commands:

```bash
cd /app
alembic upgrade head
```

---

### **🎉 Done! Your App is Live!**

**Your Terrarium URL:** `https://terrarium-api.onrender.com`

**Test it:**
```bash
curl https://terrarium-api.onrender.com/health
```

---

## ⚠️ Important Notes

### **Free Tier Sleep Mode**
- Free services **sleep after 15 minutes** of inactivity
- First request takes **~30 seconds** to wake up
- Use a cron job to keep it awake: https://cron-job.org

### **PostgreSQL Free Trial**
- Free for **90 days**
- After that: **$7/month** OR use Supabase (free forever)
- Supabase setup: https://supabase.com → Create project → Copy connection string

### **Upgrade When Ready**
- **Starter Plan ($7/month)**: No sleep, 1GB RAM, always-on
- **Standard Plan ($25/month)**: 4GB RAM, 2 CPU, production-ready

---

## 🔗 Quick Links

| Link | Purpose |
|------|---------|
| [Render Dashboard](https://dashboard.render.com) | Manage services |
| [View Logs](https://dashboard.render.com/logs) | Debug issues |
| [Full Guide](./RENDER_DEPLOYMENT.md) | Detailed documentation |
| [Supabase](https://supabase.com) | Free PostgreSQL alternative |

---

## 🆘 Troubleshooting

**Build Failed?**
- Check logs in Render dashboard
- Ensure Dockerfile and render.yaml are in repo root

**Connection Refused?**
- Wait 5 minutes for initial build
- Check service is "Live" in dashboard

**Database Error?**
- Run migrations in Shell: `alembic upgrade head`
- Verify DATABASE_URL is set correctly

**LLM API Error?**
- Check API keys are set in Environment tab
- Verify keys are valid (test locally first)

---

## 📊 What You Get (FREE)

✅ **24/7 uptime** (sleeps after 15min idle)  
✅ **Free SSL/HTTPS** certificate  
✅ **PostgreSQL database** (90 days free)  
✅ **Redis cache** (25MB persistent)  
✅ **Auto-deploy** on every git push  
✅ **750 hours/month** compute (enough for 1 service 24/7)  
✅ **100GB bandwidth/month**  

**Total Cost: $0 for 90 days, then $7/month if you keep Render PostgreSQL**

---

## 🎯 Next Steps

1. **Test your deployed app** - Create a few applications
2. **Share the URL** - Let others try it!
3. **Monitor usage** - Check Render metrics
4. **Add custom domain** (optional) - Settings → Custom Domains
5. **Implement Phase 6** - User authentication and multi-tenancy

**Enjoy your live Terrarium! 🌱✨**
