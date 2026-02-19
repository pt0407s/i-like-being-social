# 🚀 Deployment Guide

## Quick Deploy to Render.com (Free)

### Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Make sure `.env` is in `.gitignore` (it already is)

### Step 2: Deploy Backend

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `i-like-being-social-api` (or any name)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** Leave blank
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Instance Type:** `Free`

5. Add Environment Variables:
   - `JWT_SECRET` = `your-random-secret-key-here-make-it-long-and-random`
   - `CLIENT_URL` = `https://your-app-name.onrender.com` (you'll get this after deploying frontend)

6. Click **"Create Web Service"**
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL (e.g., `https://i-like-being-social-api.onrender.com`)

### Step 3: Deploy Frontend

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure:
   - **Name:** `i-like-being-social` (or any name)
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com/api`
   - (Use the URL from Step 2)

5. Click **"Create Static Site"**
6. Wait for deployment
7. Copy your frontend URL

### Step 4: Update Backend Environment

1. Go back to your backend service in Render
2. Update the `CLIENT_URL` environment variable with your frontend URL
3. Save changes (it will redeploy automatically)

### Step 5: Test!

1. Visit your frontend URL
2. Create an account
3. Create a server
4. Invite friends!

## Alternative: Railway.app

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect the Node.js app
6. Add environment variables in the dashboard:
   - `JWT_SECRET`
   - `CLIENT_URL`
   - `VITE_API_URL`
7. Deploy!

## Alternative: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Create `fly.toml` in project root:

```toml
app = "i-like-being-social"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

4. Deploy: `fly deploy`
5. Set secrets: `fly secrets set JWT_SECRET=your-secret`

## If Site Gets Blocked

### Quick Redeploy Strategy

1. **Fork the repo** with a new name (e.g., `study-chat`, `homework-helper`)
2. **Deploy to a different service:**
   - If on Render → Try Railway or Fly.io
   - If on Railway → Try Render or Vercel
3. **Use a different domain:**
   - Render gives you `*.onrender.com`
   - Railway gives you `*.railway.app`
   - Fly.io gives you `*.fly.dev`
4. **Share new URL** via text/email (not school network)

### Database Migration

To keep your data when redeploying:

1. **Download database from old deployment:**
   - SSH into old server or use file manager
   - Download `server/database/chat.db`

2. **Upload to new deployment:**
   - Upload `chat.db` to new server
   - Place in `server/database/` directory

3. **Or start fresh:**
   - Users just re-register
   - Recreate servers
   - Re-add friends

## Free Hosting Limits

| Platform | Free Tier Limits |
|----------|-----------------|
| Render   | 750 hours/month, sleeps after 15min inactivity |
| Railway  | $5 credit/month, ~500 hours |
| Fly.io   | 3 VMs, 160GB bandwidth |
| Vercel   | Unlimited (frontend only) |

**Note:** Free tiers may "sleep" after inactivity. First request takes 30-60 seconds to wake up.

## Production Tips

For serious use (not just school):

1. **Use PostgreSQL instead of SQLite:**
   - Install `pg` package
   - Update database code
   - Use Render's free PostgreSQL

2. **Add Redis for sessions:**
   - Better performance
   - Shared state across instances

3. **Enable HTTPS:**
   - Most platforms do this automatically
   - Required for secure WebSockets

4. **Add monitoring:**
   - Sentry for error tracking
   - LogRocket for session replay

5. **Implement rate limiting:**
   - Prevent spam
   - Protect against DDoS

6. **Add email verification:**
   - Use SendGrid or Mailgun
   - Verify user emails

## Cost Estimates

**Completely Free:**
- Render Free Tier
- Railway Free Tier ($5 credit)
- Fly.io Free Tier

**Paid (if you outgrow free):**
- Render: $7/month per service
- Railway: Pay-as-you-go (~$5-20/month)
- Fly.io: ~$5-15/month

## Support

If deployment fails:
1. Check build logs in platform dashboard
2. Verify environment variables
3. Test locally first with `npm run dev`
4. Check that all dependencies are in `package.json`
5. Ensure Node.js version compatibility

## Security Checklist

Before deploying:
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Add `.env` to `.gitignore`
- [ ] Never commit API keys or secrets
- [ ] Use HTTPS (enabled by default on most platforms)
- [ ] Set proper CORS origins in `server/index.js`
- [ ] Consider adding rate limiting
- [ ] Review and test authentication flow

Good luck! 🚀
