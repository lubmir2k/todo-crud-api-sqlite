# Todo API Deployment Guide

This guide covers deploying the Todo API to various free hosting platforms and running it with Docker.

## Table of Contents

1. [Docker Deployment (Local)](#docker-deployment-local)
2. [Render (Recommended for Beginners)](#render-deployment)
3. [Railway](#railway-deployment)
4. [Fly.io](#flyio-deployment)
5. [Platform Comparison](#platform-comparison)
6. [Connecting Flutter App](#connecting-flutter-app)

---

## Docker Deployment (Local)

### Prerequisites
- Docker installed on your machine
- Docker Compose (usually comes with Docker Desktop)

### Steps

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check if it's running:**
   ```bash
   curl http://localhost:3000/todos
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Manual Docker Build (Alternative)

```bash
# Build the image
docker build -t todo-api .

# Run the container
docker run -p 3000:3000 todo-api
```

---

## Render Deployment

**Best for:** Beginners, quick deployment, free tier with 750 hours/month

### Prerequisites
- GitHub account
- Render account (free): https://render.com

### Steps

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/todo-api.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `todo-api` (or your preferred name)
     - **Runtime:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Plan:** Free
   - Click "Create Web Service"

3. **Wait for deployment** (usually 2-5 minutes)

4. **Copy your app URL** (e.g., `https://todo-api-xyz.onrender.com`)

### Using render.yaml (Alternative)

If you prefer Infrastructure as Code:

1. The `render.yaml` file is already configured in this repo
2. In Render Dashboard: New → Blueprint
3. Connect repository and it will auto-configure

### Important Notes
- Free tier **spins down after inactivity** (first request may be slow)
- SQLite data is **ephemeral** (resets on redeploy)
- For persistent storage, consider upgrading or using PostgreSQL

---

## Railway Deployment

**Best for:** Developers who want easy CLI deployment, $5 free credit/month

### Prerequisites
- GitHub account
- Railway account (free): https://railway.app
- Railway CLI (optional): `npm install -g @railway/cli`

### Option 1: GitHub Deploy

1. **Push code to GitHub** (see Render section)

2. **Deploy on Railway:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js and deploys
   - Click "Generate Domain" to get public URL

3. **Copy your app URL**

### Option 2: CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Configuration

The `railway.json` file is already configured. Railway will:
- Auto-install dependencies
- Use `npm start`
- Auto-restart on failure

### Important Notes
- $5 credit/month (~500 hours)
- After credit exhausted, app stops
- Supports volume mounting for persistent SQLite

---

## Fly.io Deployment

**Best for:** Better performance, global deployment, generous free tier

### Prerequisites
- Fly.io account (free): https://fly.io
- Credit card required (won't be charged on free tier)
- Fly CLI: https://fly.io/docs/hands-on/install-flyctl/

### Steps

1. **Install Fly CLI:**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Launch app:**
   ```bash
   fly launch
   ```

   Answer the prompts:
   - App name: `your-todo-api`
   - Region: Choose closest to you
   - PostgreSQL: No
   - Redis: No
   - Deploy now: Yes

4. **The `fly.toml` file is already configured**, so it will use that

5. **Get your app URL:**
   ```bash
   fly status
   ```
   URL will be: `https://your-todo-api.fly.dev`

### Managing Your App

```bash
# View logs
fly logs

# Check status
fly status

# Scale (if needed)
fly scale show

# Redeploy
fly deploy
```

### Important Notes
- Free tier: 3 shared-CPU VMs with 256MB RAM each
- Auto-stops when idle (fast wake-up)
- Better global performance than Render

---

## Platform Comparison

| Feature | Render | Railway | Fly.io |
|---------|--------|---------|--------|
| **Free Tier** | 750 hrs/month | $5 credit/month | 3 VMs, 256MB each |
| **Credit Card** | Not required | Not required | Required |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Deploy Speed** | Medium | Fast | Fast |
| **Cold Start** | Slow (~30s) | Medium (~10s) | Fast (~5s) |
| **CLI** | No | Yes | Yes |
| **Auto-deploy** | Yes (from GitHub) | Yes (from GitHub) | Yes |
| **Persistent Storage** | No (on free) | Yes (with volumes) | Yes (with volumes) |
| **Custom Domains** | Yes | Yes | Yes |
| **Best For** | Beginners | Developers | Production apps |

### Recommendation

- **First time deploying?** → Use **Render** (easiest, no credit card)
- **Have $5/month to spare?** → Use **Railway** (best DX)
- **Need performance?** → Use **Fly.io** (requires credit card)

---

## Connecting Flutter App

After deploying to any platform, update your Flutter app:

### 1. Update Config

Edit `/my_todo_app/lib/config.dart`:

```dart
// Change this line to your deployed URL
static const String productionUrl = 'https://your-app.onrender.com';

// Change environment to production
static const Environment currentEnvironment = Environment.production;
```

### 2. Test the Connection

```bash
# Test your deployed API
curl https://your-app.onrender.com/todos

# Should return: []
```

### 3. Rebuild Flutter App

```bash
cd my_todo_app
flutter run -d chrome
```

Your Flutter app should now connect to the deployed API!

---

## Troubleshooting

### API Returns 404

**Problem:** All endpoints return 404

**Solution:**
- Check the API URL is correct (no trailing slash)
- Verify deployment succeeded
- Check logs: `docker-compose logs` or platform logs

### CORS Errors

**Problem:** Browser shows CORS error

**Solution:**
The API is configured to allow all origins in development. If you need to restrict:

```javascript
// index.js
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://your-flutter-app.com'
}));
```

### Cold Starts on Free Tier

**Problem:** First request takes 30+ seconds

**Solution:**
- This is normal on free tiers (Render, Railway)
- Consider upgrading to paid tier
- Or use Fly.io (faster cold starts)
- Keep app "warm" with uptime monitoring (e.g., UptimeRobot)

### Data Loss on Redeploy

**Problem:** Todos disappear after redeployment

**Solution:**
This is expected with in-memory SQLite. Options:
1. Accept it (fine for testing)
2. Use persistent volumes (Railway, Fly.io)
3. Migrate to PostgreSQL (recommended for production)

---

## Next Steps

### For Learning
- Try deploying to all three platforms to compare
- Experiment with environment variables
- Add health check endpoint

### For Production
- Migrate from SQLite to PostgreSQL
- Add authentication
- Implement rate limiting
- Set up CI/CD pipeline
- Add monitoring (Sentry, LogRocket)
- Use environment variables for secrets

---

## Useful Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

## Summary

You now have:
- ✅ Dockerized API for local development
- ✅ Config files for Render, Railway, and Fly.io
- ✅ Flutter app configured for environment switching
- ✅ Complete deployment guides for 3 platforms

**Recommended path:**
1. Test Docker locally first
2. Deploy to Render (easiest)
3. Update Flutter app config
4. Test the full stack
5. Explore other platforms if interested

Good luck with your deployment! 🚀
