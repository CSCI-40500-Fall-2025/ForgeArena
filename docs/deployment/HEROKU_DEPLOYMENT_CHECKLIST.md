# Heroku Deployment Checklist

Use this checklist to ensure a smooth deployment to Heroku.

## Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Heroku account created ([Sign up](https://signup.heroku.com/))
- [ ] Heroku CLI installed ([Download](https://devcenter.heroku.com/articles/heroku-cli))
- [ ] Git repository initialized
- [ ] All changes committed to Git

### 2. Test Locally
- [ ] Run tests: `npm test`
- [ ] Build React app: `cd client && npm run build`
- [ ] Test production build locally:
  ```bash
  NODE_ENV=production node server/index.js
  # Visit http://localhost:5000
  ```
- [ ] Verify all features work in production mode
- [ ] Check console for errors

### 3. Environment Variables Ready
- [ ] List of all required environment variables
- [ ] Firebase credentials (if applicable)
- [ ] Database connection strings (if applicable)
- [ ] API keys and secrets

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```
- [ ] Successfully logged in
- [ ] Verified with: `heroku auth:whoami`

### 2. Create Heroku App
Choose one:

**Option A: Let Heroku generate name**
```bash
heroku create
```

**Option B: Specify your own name**
```bash
heroku create your-app-name
```

- [ ] App created successfully
- [ ] Heroku remote added to Git
- [ ] Verified with: `git remote -v`

### 3. Configure Environment Variables

**Required:**
```bash
heroku config:set NODE_ENV=production
```
- [ ] NODE_ENV set to production

**Firebase (if applicable):**
```bash
heroku config:set FIREBASE_API_KEY=your_key
heroku config:set FIREBASE_AUTH_DOMAIN=your_domain
heroku config:set FIREBASE_PROJECT_ID=your_project_id
heroku config:set FIREBASE_STORAGE_BUCKET=your_bucket
heroku config:set FIREBASE_MESSAGING_SENDER_ID=your_sender_id
heroku config:set FIREBASE_APP_ID=your_app_id
```
- [ ] All Firebase variables set

**Verify:**
```bash
heroku config
```
- [ ] All environment variables correct

### 4. Deploy to Heroku
```bash
git push heroku main
```

**Or if using master branch:**
```bash
git push heroku master
```

- [ ] Build started
- [ ] Dependencies installed
- [ ] React app built successfully
- [ ] Server started
- [ ] No errors in build logs

### 5. Verify Deployment
```bash
heroku open
```

- [ ] App opens in browser
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] API endpoints working
- [ ] Authentication working (if applicable)
- [ ] All features functional

### 6. Check Logs
```bash
heroku logs --tail
```

- [ ] No error messages
- [ ] Server started successfully
- [ ] App responding to requests

## Post-Deployment Checklist

### 1. Monitor Initial Performance
- [ ] Check response times
- [ ] Verify memory usage: `heroku ps`
- [ ] Monitor logs for errors
- [ ] Test under load (if needed)

### 2. Configure Monitoring
- [ ] Set up log aggregation (Papertrail, etc.)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Enable Heroku metrics (if on paid tier)

### 3. Security
- [ ] Verify HTTPS is working
- [ ] Check CORS configuration
- [ ] Verify authentication is secure
- [ ] Review environment variables (no secrets exposed)
- [ ] Set up rate limiting (if not already done)

### 4. Optimization
- [ ] Enable HTTP compression
- [ ] Configure caching headers
- [ ] Optimize asset delivery
- [ ] Consider CDN for static assets

### 5. Continuous Deployment (Optional)
- [ ] Connect to GitHub in Heroku Dashboard
- [ ] Enable automatic deploys from main branch
- [ ] Configure deployment conditions (CI passing, etc.)
- [ ] Test automatic deployment with a small change

### 6. Custom Domain (Optional)
```bash
heroku domains:add www.yourdomain.com
```
- [ ] Domain added to Heroku
- [ ] DNS records updated
- [ ] SSL certificate provisioned
- [ ] Domain accessible

### 7. Database (If Needed)

**PostgreSQL:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```
- [ ] Database provisioned
- [ ] DATABASE_URL available
- [ ] Database schema created
- [ ] Database migrations run

**Redis:**
```bash
heroku addons:create heroku-redis:hobby-dev
```
- [ ] Redis provisioned
- [ ] REDIS_URL available

### 8. Scaling Considerations
- [ ] Evaluate free tier limitations
- [ ] Consider upgrading to Hobby tier for 24/7 uptime
- [ ] Plan for scaling as user base grows
- [ ] Set up autoscaling alerts

### 9. Backup and Recovery
- [ ] Database backups configured (if applicable)
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Data export/import tested

### 10. Documentation
- [ ] Update README with deployment info
- [ ] Document environment variables
- [ ] Record any custom configurations
- [ ] Share deployment URL with team

## Troubleshooting Checklist

If deployment fails, check:

### Build Issues
- [ ] All dependencies in `package.json` (not just `devDependencies`)
- [ ] `heroku-postbuild` script is correct
- [ ] Node/npm versions compatible (`engines` in package.json)
- [ ] No syntax errors in code
- [ ] Build passes locally

### Runtime Issues
- [ ] `Procfile` is correct
- [ ] Server binds to `process.env.PORT`
- [ ] `NODE_ENV=production` is set
- [ ] All environment variables are set
- [ ] No missing modules

### Application Issues
- [ ] Static files path is correct (`client/build`)
- [ ] React Router configured properly
- [ ] API routes don't conflict with static routes
- [ ] Database connections working (if applicable)
- [ ] Authentication working (if applicable)

### Performance Issues
- [ ] Check dyno type (free tier limitations)
- [ ] Monitor memory usage
- [ ] Check for memory leaks
- [ ] Optimize slow queries
- [ ] Consider caching strategies

## Common Commands Reference

```bash
# View app status
heroku ps

# View logs
heroku logs --tail

# Restart app
heroku restart

# Open app
heroku open

# View config
heroku config

# Set config var
heroku config:set KEY=value

# Run command
heroku run bash

# View releases
heroku releases

# Rollback
heroku rollback

# Scale dynos
heroku ps:scale web=1

# Clear build cache
heroku builds:cache:purge
```

## Quick Links

- **App Dashboard**: `https://dashboard.heroku.com/apps/[your-app-name]`
- **Heroku Status**: https://status.heroku.com/
- **Heroku Dev Center**: https://devcenter.heroku.com/
- **Support**: https://help.heroku.com/

## Success Criteria

Your deployment is successful when:

✅ App builds without errors  
✅ App starts and stays running  
✅ Homepage loads correctly  
✅ All API endpoints respond  
✅ Authentication works (if applicable)  
✅ Database connections work (if applicable)  
✅ No errors in logs  
✅ Performance is acceptable  
✅ HTTPS is working  

## Next Steps After Successful Deployment

1. Share the URL with your team
2. Set up continuous deployment
3. Configure monitoring and alerts
4. Plan for scaling
5. Consider upgrading to paid tier
6. Set up custom domain
7. Optimize performance
8. Document any issues and solutions

---

**Deployment Date**: _____________

**App Name**: _____________

**App URL**: _____________

**Deployed By**: _____________

**Notes**: _____________

---

Good luck with your deployment! 🚀

