# Heroku Deployment - Quick Start

## Prerequisites
- Heroku account: https://signup.heroku.com/
- Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli

## Deploy in 5 Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create Heroku App
```bash
heroku create your-app-name
# Or let Heroku generate a name:
# heroku create
```

### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production

# Add any Firebase or other environment variables:
# heroku config:set FIREBASE_API_KEY=your_key
# heroku config:set FIREBASE_PROJECT_ID=your_project_id
```

### 4. Deploy
```bash
git push heroku main
# If using master branch: git push heroku master
```

### 5. Open Your App
```bash
heroku open
```

## View Logs
```bash
heroku logs --tail
```

## Restart App
```bash
heroku restart
```

## Update Deployment
```bash
git add .
git commit -m "Your changes"
git push heroku main
```

## Common Commands
```bash
# View app status
heroku ps

# View environment variables
heroku config

# Run bash on Heroku
heroku run bash

# View releases
heroku releases

# Rollback to previous version
heroku rollback
```

## Troubleshooting

**App won't start?**
- Check logs: `heroku logs --tail`
- Verify environment: `heroku config`

**Build fails?**
- Clear cache: `heroku builds:cache:purge` (requires heroku-builds plugin)
- Check dependencies in package.json

**Need help?**
- Full guide: See `HEROKU_DEPLOYMENT_GUIDE.md`
- Heroku docs: https://devcenter.heroku.com/

## What Was Changed for Heroku

1. ✅ Added `Procfile` - tells Heroku how to start the app
2. ✅ Updated `package.json` - added Heroku build scripts
3. ✅ Modified `server/index.js` - serves React build in production
4. ✅ Added Node/NPM version specifications

Your app is ready to deploy! 🚀

