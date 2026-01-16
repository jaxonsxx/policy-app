# Netlify Deployment Guide for ASA Policy App

This guide will walk you through deploying your frontend to Netlify's free tier.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account (or use Netlify CLI)
2. Your frontend code ready in the repository
3. A Netlify account (free tier works perfectly)

## Setting Up Your Own Repository

If the original repository isn't yours, you can create your own GitHub repository:

### Option A: Fork the Repository (Easiest)

If the repository is on GitHub:
1. Go to the original repository on GitHub
2. Click the **"Fork"** button in the top right
3. Select your GitHub account
4. The repository will now be under your account
5. Proceed to "Method 1" below

### Option B: Create Your Own Repository from Local Code

1. **Create a new repository on GitHub:**
   - Go to [github.com/new](https://github.com/new)
   - Name it (e.g., `asa-policy-app`)
   - Choose **Public** or **Private**
   - **Don't** initialize with README, .gitignore, or license (we have files already)
   - Click **"Create repository"**

2. **Push your local code to the new repository:**
   ```bash
   # Navigate to your project directory
   cd /Users/victorjason-nwachukwu/Desktop/Project--7-ASA-Policy-App-2026
   
   # If not already a git repository, initialize it
   git init
   
   # Add all files
   git add .
   
   # Commit the changes
   git commit -m "Initial commit - Ready for Netlify deployment"
   
   # Add your new GitHub repository as remote
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   
   # Push to GitHub (replace main with master if your default branch is master)
   git branch -M main
   git push -u origin main
   ```

   Replace:
   - `YOUR_USERNAME` with your GitHub username
   - `YOUR_REPO_NAME` with your repository name

3. **Verify on GitHub:**
   - Go to your repository on GitHub
   - Make sure all files are there

## Method 1: Deploy via Netlify Web Interface (Recommended for Beginners)

### Step 1: Prepare Your Repository

If you haven't already, make sure all your changes are committed:
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push
   ```

### Step 2: Connect to Netlify

1. Go to [netlify.com](https://www.netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your repository: `Project--7-ASA-Policy-App-2026`

### Step 3: Configure Build Settings

Netlify should auto-detect the `netlify.toml` file, but verify these settings:

- **Base directory**: Leave empty (or set to project root)
- **Build command**: Leave empty (static site, no build needed)
- **Publish directory**: `frontend`

Alternatively, if auto-detection doesn't work, manually set:
- **Build command**: (leave empty)
- **Publish directory**: `frontend`

### Step 4: Deploy

1. Click **"Deploy site"**
2. Netlify will build and deploy your site
3. You'll get a random URL like: `https://random-name-123456.netlify.app`

### Step 5: Customize Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to add your domain
4. Or use the free Netlify subdomain: `your-site-name.netlify.app`

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will open a browser window for authentication.

### Step 3: Deploy

Navigate to your project root directory:

```bash
cd /path/to/Project--7-ASA-Policy-App-2026
netlify deploy --dir=frontend
```

For production deployment:

```bash
netlify deploy --prod --dir=frontend
```

### Step 4: Link to Site (First Time Only)

If this is your first deployment:

```bash
netlify init
```

Follow the prompts to:
- Create a new site or link to existing
- Set build command (leave empty)
- Set publish directory (`frontend`)

## Method 3: Drag and Drop (Quick Testing)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop your `frontend` folder onto the Netlify dashboard
3. Your site will be live in seconds!

**Note**: Drag-and-drop deployments are temporary. Use Method 1 or 2 for permanent hosting with automatic deployments.

## Configuration Files

The deployment uses these files:

### `netlify.toml`
Located in the project root, this file configures:
- Publish directory (`frontend`)
- Redirect rules (root → `/public/policies.html`)
- Security headers

### Path Fixes

All paths have been updated from `/frontend/...` to `/...` to work correctly with Netlify's deployment structure.

## Post-Deployment Checklist

- [ ] Test the main page loads: `https://your-site.netlify.app`
- [ ] Verify navigation works (Policies, Bylaws, Suggestions)
- [ ] Check that CSS and images load correctly
- [ ] Test admin login page: `https://your-site.netlify.app/admin/login.html`
- [ ] Verify policy detail pages load correctly

## Environment Variables (If Needed)

If your frontend needs to connect to a backend API, you can set environment variables:

1. Go to **Site settings** → **Environment variables**
2. Add variables like:
   - `VITE_API_URL` (if using Vite)
   - `API_URL` (for custom configuration)

Then update your JavaScript to use these variables instead of hardcoded URLs.

## Continuous Deployment

Once connected via Git:
- Every push to your main branch triggers a new deployment
- Pull requests create deploy previews automatically
- You can enable branch deploys for other branches in site settings

## Troubleshooting

### Issue: 404 Errors on Pages

**Solution**: The `netlify.toml` includes redirect rules. If you still get 404s, check:
- The `publish` directory is set to `frontend`
- All HTML files are in the correct locations

### Issue: CSS/Images Not Loading

**Solution**: Verify paths don't start with `/frontend/`. All paths should be relative or start with `/` from the root.

### Issue: Build Fails

**Solution**: 
- Check that `netlify.toml` is in the project root
- Verify the `publish` directory path is correct
- Ensure there are no syntax errors in configuration files

### Issue: Admin Pages Not Working

**Solution**: 
- Admin pages are in `/admin/` folder
- Make sure the `admin` folder is inside `frontend`
- Check that paths in admin HTML files use relative paths (they already do)

## Free Tier Limitations

Netlify's free tier includes:
- ✅ 100 GB bandwidth per month
- ✅ 300 build minutes per month
- ✅ Custom domain support
- ✅ HTTPS/SSL certificates (automatic)
- ✅ Deploy previews for pull requests
- ✅ Form handling (limited)

For most small to medium sites, this is more than enough!

## Next Steps

1. Set up a custom domain (if you have one)
2. Configure analytics (optional)
3. Set up form handling if needed
4. Configure build notifications (email/Slack)

## Support

- [Netlify Documentation](https://docs.netlify.com)
- [Netlify Community Forum](https://answers.netlify.com)
- [Netlify Support](https://www.netlify.com/support)

---

**Note**: Your backend (FastAPI) needs to be deployed separately (e.g., on Render, Railway, or Heroku) if you want to connect the frontend to the API. The current frontend uses localStorage, so it works standalone.

