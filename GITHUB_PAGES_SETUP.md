# 🚀 GitHub Pages Deployment Guide

Your backend is already deployed at: **https://i-like-being-social.onrender.com**

Now let's deploy the frontend to GitHub Pages!

## Step 1: Update Backend Environment Variables

Go to your Render dashboard for the backend and update the environment variable:

**`CLIENT_URL`** = `https://YOUR_GITHUB_USERNAME.github.io`

For example: `https://pt0407s.github.io`

This allows CORS requests from GitHub Pages.

## Step 2: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/i-like-being-social`
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source:** Select **GitHub Actions**
4. That's it! GitHub Actions will handle the rest.

## Step 3: Push Your Code

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git push origin main
```

## Step 4: Wait for Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Watch the "Deploy Frontend to GitHub Pages" workflow run
3. It takes about 2-3 minutes
4. Once complete, your site will be live at:
   **`https://YOUR_GITHUB_USERNAME.github.io/i-like-being-social/`**

## Step 5: Test Your App

1. Visit `https://YOUR_GITHUB_USERNAME.github.io/i-like-being-social/`
2. Create an account
3. Create a server
4. Test messaging, friends, DMs, etc.

## Troubleshooting

### "Cannot connect to server"
- Check that your backend is running on Render
- Verify the `CLIENT_URL` environment variable on Render includes your GitHub Pages URL
- Check browser console for CORS errors

### "404 Not Found" on GitHub Pages
- Make sure GitHub Pages is enabled in repository settings
- Verify the workflow completed successfully in Actions tab
- Check that `base: '/i-like-being-social/'` is in `vite.config.js`

### Backend "sleeps" after 15 minutes
- Render free tier sleeps after inactivity
- First request takes 30-60 seconds to wake up
- This is normal for free tier

## Important Notes

✅ **Frontend:** GitHub Pages (free, always on)  
✅ **Backend:** Render.com (free, sleeps after 15min inactivity)  
✅ **Database:** SQLite file on Render backend  

## If Site Gets Blocked

1. **Fork the repository** with a new name
2. **Deploy to different GitHub account** or use a different service
3. **Update backend URL** in `src/lib/api.js` and `src/lib/socket.js`
4. **Redeploy**

## Manual Build (Optional)

If you want to build locally and deploy manually:

```bash
npm run build
```

Then upload the `dist` folder to any static hosting service.

## Next Steps

- Share your GitHub Pages URL with friends
- Create servers and invite people
- Customize the app (colors, features, etc.)
- Consider upgrading Render to paid tier if you need 24/7 uptime

Enjoy your Discord clone! 🎉
