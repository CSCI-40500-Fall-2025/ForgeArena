# Heroku Deployment Guide for ForgeArena

This guide walks you through deploying ForgeArena to Heroku, a cloud platform that supports Node.js applications.

## Overview

ForgeArena is configured to deploy as a single Heroku app that:
1. Builds the React frontend during deployment
2. Serves the built frontend from the Express backend
3. Provides all API endpoints from the same server

## Prerequisites

1. **Heroku Account**: Sign up at [https://signup.heroku.com/](https://signup.heroku.com/)
2. **Heroku CLI**: Install from [https://devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your project is in a Git repository

## Quick Start Deployment

### Step 1: Install Heroku CLI

**Windows:**
```bash
# Download and run the installer from:
# https://devcenter.heroku.com/articles/heroku-cli#download-and-install
```

**macOS:**
```bash
brew tap heroku/brew && brew install heroku
```

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Login to Heroku

```bash
heroku login
```

This will open a browser window for authentication.

### Step 3: Create a Heroku App

```bash
# Create a new Heroku app (replace 'your-app-name' with a unique name)
heroku create your-app-name

# Or let Heroku generate a random name
heroku create
```

This command will:
- Create a new app on Heroku
- Add a `heroku` remote to your Git repository

### Step 4: Configure Environment Variables

Set any required environment variables for your app:

```bash
# Set Node environment to production
heroku config:set NODE_ENV=production

# Add Firebase credentials (if using Firebase)
heroku config:set FIREBASE_API_KEY=your_api_key
heroku config:set FIREBASE_AUTH_DOMAIN=your_auth_domain
heroku config:set FIREBASE_PROJECT_ID=your_project_id
heroku config:set FIREBASE_STORAGE_BUCKET=your_storage_bucket
heroku config:set FIREBASE_MESSAGING_SENDER_ID=your_sender_id
heroku config:set FIREBASE_APP_ID=your_app_id

# View all config vars
heroku config
```

### Step 5: Deploy to Heroku

```bash
# Commit any pending changes
git add .
git commit -m "Prepare for Heroku deployment"

# Deploy to Heroku
git push heroku main

# If your default branch is 'master', use:
# git push heroku master
```

### Step 6: Open Your App

```bash
# Open the deployed app in your browser
heroku open
```

## What Happens During Deployment

When you push to Heroku, the following happens automatically:

1. **Dependency Installation**: Heroku installs dependencies from `package.json`
2. **Build Script**: Heroku runs `heroku-postbuild` script which:
   - Installs all dependencies (root, server, client)
   - Builds the React app (`npm run build`)
3. **Start Server**: Heroku runs the command in `Procfile`: `node server/index.js`
4. **Port Binding**: The app automatically binds to Heroku's `PORT` environment variable

## Project Configuration Files

### 1. Procfile

Located at the root of the project:

```
web: node server/index.js
```

This tells Heroku how to start your web server.

### 2. package.json (Root)

Key scripts for Heroku:

```json
{
  "scripts": {
    "start": "node server/index.js",
    "heroku-postbuild": "npm run install-deps && npm run build"
  },
  "engines": {
    "node": "16.x",
    "npm": "8.x"
  }
}
```

- `start`: Command Heroku uses to start your app
- `heroku-postbuild`: Runs automatically during deployment to build your app

### 3. server/index.js

The server is configured to:
- Serve static files from `client/build` in production
- Handle React Router by serving `index.html` for all non-API routes
- Bind to `process.env.PORT` (required by Heroku)

## Managing Your Heroku App

### View Logs

```bash
# View recent logs
heroku logs

# Stream logs in real-time
heroku logs --tail

# View logs for specific dyno
heroku logs --source app
```

### Restart the App

```bash
heroku restart
```

### Scale Dynos

```bash
# View current dyno formation
heroku ps

# Scale web dynos
heroku ps:scale web=1
```

### Run Commands on Heroku

```bash
# Open a bash shell on Heroku
heroku run bash

# Run a specific command
heroku run node --version
```

### Access Heroku Dashboard

View and manage your app at: [https://dashboard.heroku.com/apps/your-app-name](https://dashboard.heroku.com/apps)

## Environment Variables

### Setting Environment Variables

```bash
# Set a single variable
heroku config:set KEY=value

# Set multiple variables
heroku config:set KEY1=value1 KEY2=value2

# Remove a variable
heroku config:unset KEY
```

### View Environment Variables

```bash
# View all config vars
heroku config

# View a specific var
heroku config:get KEY
```

### Common Variables for ForgeArena

```bash
# Node environment
NODE_ENV=production

# Firebase Configuration (if applicable)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Continuous Deployment with GitHub

You can set up automatic deployments from GitHub:

### Option 1: Heroku Dashboard (Recommended)

1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Select your app
3. Go to **Deploy** tab
4. Under **Deployment method**, select **GitHub**
5. Connect your GitHub account
6. Search for your repository and connect it
7. Enable **Automatic Deploys** from the `main` branch
8. (Optional) Enable **Wait for CI to pass before deploy**

### Option 2: Heroku Git (Manual)

Continue using `git push heroku main` for manual deployments.

## Troubleshooting

### App Crashes on Startup

1. Check logs: `heroku logs --tail`
2. Verify PORT binding:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```
3. Ensure `start` script is correct in `package.json`

### Build Fails

1. Check build logs: `heroku logs --tail`
2. Verify dependencies are in `dependencies` not `devDependencies`
3. Test build locally:
   ```bash
   npm run heroku-postbuild
   NODE_ENV=production npm start
   ```

### Module Not Found Errors

1. Ensure all dependencies are listed in `package.json`
2. Clear build cache:
   ```bash
   heroku plugins:install heroku-builds
   heroku builds:cache:purge
   ```
3. Redeploy

### Static Files Not Loading

1. Verify build directory exists: `client/build`
2. Check server configuration for serving static files
3. Ensure `NODE_ENV=production` is set

### Database Connection Issues

If using a database:
1. Add a Heroku add-on (e.g., PostgreSQL):
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
2. Use the `DATABASE_URL` environment variable provided by Heroku

## Performance Tips

### 1. Use Production Build

Always ensure `NODE_ENV=production` is set:
```bash
heroku config:set NODE_ENV=production
```

### 2. Enable HTTP Compression

Add compression middleware in your Express app:
```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Use CDN for Static Assets

For better performance, consider using a CDN for your static assets.

### 4. Monitor Performance

Use Heroku metrics:
```bash
heroku logs --tail
```

Or add the free Heroku Metrics dashboard in your app settings.

## Cost Considerations

### Free Tier

Heroku offers a free tier with limitations:
- App sleeps after 30 minutes of inactivity
- 550-1000 free dyno hours per month
- No custom domains on free tier
- Apps limited to 512 MB RAM

### Paid Tiers

Consider upgrading for:
- 24/7 uptime
- More RAM and computing power
- Custom domains with SSL
- Better performance

View pricing: [https://www.heroku.com/pricing](https://www.heroku.com/pricing)

## Migration from Vercel

If you're migrating from Vercel:

1. **Remove Vercel-specific files** (optional):
   ```bash
   rm vercel.json
   rm -rf .vercel
   ```

2. **Update deployment documentation**:
   - Update README.md with Heroku deployment instructions
   - Archive or remove Vercel-specific documentation

3. **Environment Variables**:
   - Export variables from Vercel dashboard
   - Import them to Heroku using `heroku config:set`

4. **DNS/Domain**:
   - Update DNS records to point to Heroku app
   - Add custom domain in Heroku dashboard

## Custom Domains

### Adding a Custom Domain

```bash
# Add a custom domain
heroku domains:add www.yourdomain.com

# View all domains
heroku domains

# Heroku will provide DNS targets - update your DNS provider
```

### SSL Certificates

Heroku automatically provides SSL certificates for custom domains on paid dynos.

## Database Setup (Optional)

If you need a database:

### PostgreSQL

```bash
# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Access database credentials
heroku config:get DATABASE_URL

# Connect to database
heroku pg:psql
```

### Redis

```bash
# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Get Redis URL
heroku config:get REDIS_URL
```

## Monitoring and Logging

### Application Logs

```bash
# View logs
heroku logs --tail

# Filter logs
heroku logs --source app
heroku logs --dyno web
```

### Add Logging Add-on

```bash
# Add Papertrail (free tier available)
heroku addons:create papertrail:chokladfabrik
```

## Backup and Rollback

### View Releases

```bash
heroku releases
```

### Rollback to Previous Release

```bash
heroku rollback
```

### Rollback to Specific Release

```bash
heroku rollback v102
```

## Security Best Practices

1. **Use Environment Variables**: Never commit secrets to Git
2. **Enable SSL**: Use HTTPS for all traffic (automatic on Heroku)
3. **Secure Headers**: Add security headers to Express:
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Keep Dependencies Updated**: Regularly update packages

## Additional Resources

- **Heroku Dev Center**: [https://devcenter.heroku.com/](https://devcenter.heroku.com/)
- **Node.js on Heroku**: [https://devcenter.heroku.com/articles/getting-started-with-nodejs](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- **Heroku CLI Commands**: [https://devcenter.heroku.com/articles/heroku-cli-commands](https://devcenter.heroku.com/articles/heroku-cli-commands)
- **Deploying React Apps**: [https://devcenter.heroku.com/articles/deploying-react-with-zero-configuration](https://devcenter.heroku.com/articles/deploying-react-with-zero-configuration)

## Support

If you encounter issues:
1. Check Heroku logs: `heroku logs --tail`
2. Review [Heroku Status](https://status.heroku.com/)
3. Visit [Heroku Help Center](https://help.heroku.com/)
4. Check project's GitHub issues

## Summary

Your ForgeArena app is now configured for Heroku deployment! The key files are:
- `Procfile`: Defines how to start your app
- `package.json`: Contains build and start scripts
- `server/index.js`: Serves both API and React frontend

To deploy:
1. `heroku create your-app-name`
2. `heroku config:set NODE_ENV=production`
3. `git push heroku main`
4. `heroku open`

Happy deploying! 🚀

