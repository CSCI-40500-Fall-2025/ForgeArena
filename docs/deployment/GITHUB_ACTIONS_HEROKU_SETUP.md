# GitHub Actions - Heroku Deployment Setup

## Overview

This guide explains how to set up automated continuous deployment (CD) from GitHub to Heroku using GitHub Actions.

## What This Does

Every time you push to the `main` or `master` branch:

1. ✅ **Runs all tests** (shared + client)
2. ✅ **Deploys to Heroku** (only if tests pass)
3. ✅ **Performs health check** (verifies app is running)
4. ✅ **Rolls back if health check fails**
5. ✅ **Creates GitHub deployment entry**

## Prerequisites

- Heroku account with an app created
- GitHub repository
- GitHub Actions enabled (enabled by default)

**For Heroku Teams**: See `HEROKU_TEAMS_SETUP.md` for team-specific setup instructions.

## Setup Instructions

### Step 1: Get Heroku API Key

1. Go to [Heroku Account Settings](https://dashboard.heroku.com/account)
2. Scroll down to **API Key** section
3. Click **Reveal** to see your API key
4. **Copy the API key** (you'll need it in Step 3)

### Step 2: Get Heroku App Information

You'll need:
- **App Name**: Your Heroku app name (e.g., `my-forgearena-app`)
- **Email**: The email address you use to login to Heroku
- **Team Name**: Your Heroku Team name (if using Heroku Teams)

Find your app name:
```bash
heroku apps
# Or from your app URL: https://YOUR-APP-NAME.herokuapp.com
```

Find your team name (if using Heroku Teams):
```bash
heroku teams
# Or check in Heroku Dashboard under your team
```

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these secrets:

#### Secret 1: HEROKU_API_KEY
- **Name**: `HEROKU_API_KEY`
- **Value**: Your Heroku API key from Step 1
- Click **Add secret**

#### Secret 2: HEROKU_APP_NAME
- **Name**: `HEROKU_APP_NAME`
- **Value**: Your Heroku app name (e.g., `my-forgearena-app`)
- Click **Add secret**

#### Secret 3: HEROKU_EMAIL
- **Name**: `HEROKU_EMAIL`
- **Value**: Your Heroku account email
- Click **Add secret**

#### Secret 4: HEROKU_TEAM (Required for Heroku Teams)
- **Name**: `HEROKU_TEAM`
- **Value**: Your Heroku Team name
- Click **Add secret**

**Note**: If you're not using Heroku Teams, you can skip Secret 4. The workflow will work without it for personal accounts.

### Step 4: Verify Secrets

You should now have these secrets configured:
- ✅ `HEROKU_API_KEY`
- ✅ `HEROKU_APP_NAME`
- ✅ `HEROKU_EMAIL`
- ✅ `HEROKU_TEAM` (if using Heroku Teams)

### Step 5: Push to Trigger Deployment

```bash
git add .
git commit -m "Set up GitHub Actions for Heroku deployment"
git push origin main
```

### Step 6: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see your workflow running
4. Click on the workflow run to see details

## Workflow Behavior

### When Deployment Happens

✅ **Deploys when:**
- Code is pushed to `main` or `master` branch
- All tests pass
- GitHub Actions secrets are configured

❌ **Does NOT deploy when:**
- Tests fail
- Push is to a different branch
- Secrets are missing or incorrect

### Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Click on **Continuous Deployment** workflow
3. Click **Run workflow** button
4. Select the branch
5. Click **Run workflow**

## Health Check

The workflow includes a health check:

- **Endpoint**: `/api/user`
- **Purpose**: Verifies app is responding after deployment
- **Rollback**: If health check fails, deployment is rolled back

If you need to change the health check endpoint, edit `.github/workflows/deploy.yml`:

```yaml
healthcheck: "https://${{ secrets.HEROKU_APP_NAME }}.herokuapp.com/api/user"
```

## Viewing Deployment Status

### In GitHub

1. Go to your repository
2. Click **Deployments** (in the right sidebar on the main page)
3. View deployment history with status and URLs

### In Heroku

```bash
heroku releases --app your-app-name
```

### In GitHub Actions

1. Go to **Actions** tab
2. Click on any workflow run
3. View logs for each step

## Troubleshooting

### Deployment Fails

**Check the logs:**
1. Go to **Actions** tab in GitHub
2. Click on the failed workflow
3. Click on the **Deploy to Heroku** step
4. Review error messages

**Common issues:**

#### Invalid API Key
```
Error: Invalid credentials
```
**Solution**: Verify `HEROKU_API_KEY` secret is correct

#### App Not Found
```
Error: Couldn't find that app
```
**Solution**: Verify `HEROKU_APP_NAME` secret matches your Heroku app name exactly

#### Health Check Failed
```
Error: Health check failed
```
**Solution**: 
- Check if `/api/user` endpoint exists and works
- Check Heroku logs: `heroku logs --tail --app your-app-name`
- Verify app starts correctly

### Tests Pass But Deployment Doesn't Run

**Check:**
1. Is the push to `main` or `master` branch?
2. Are all three secrets configured correctly?
3. Is GitHub Actions enabled for your repository?

### Deployment Succeeds But App Doesn't Work

**Check Heroku logs:**
```bash
heroku logs --tail --app your-app-name
```

**Common causes:**
- Missing environment variables (e.g., `SUMO_LOGIC_URL`, `NODE_ENV`)
- Build failed but deployment succeeded
- Port binding issues

## Environment Variables

### Required Heroku Config Vars

Make sure these are set in Heroku:

```bash
# Required
heroku config:set NODE_ENV=production --app your-app-name

# For logging (optional but recommended)
heroku config:set SUMO_LOGIC_URL=your-sumo-logic-url --app your-app-name

# For Firebase (if using)
heroku config:set FIREBASE_API_KEY=your-key --app your-app-name
heroku config:set FIREBASE_PROJECT_ID=your-project-id --app your-app-name
# ... other Firebase vars
```

### Viewing Config Vars

```bash
heroku config --app your-app-name
```

## Workflow File Location

The workflow configuration is located at:
```
.github/workflows/deploy.yml
```

## Customizing the Workflow

### Change Branch

To deploy from a different branch, edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main          # Change this
      - production    # Or add more branches
```

### Skip Tests

**Not recommended**, but if you need to deploy without tests:

```yaml
deploy:
  name: Deploy to Heroku
  # Remove this line:
  needs: test
```

### Change Node Version

Edit the `node-version` in the workflow:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to '18' or '16' if needed
```

### Add More Tests

Add more test steps before deployment:

```yaml
- name: Run API tests
  run: npm run test:api

- name: Run E2E tests
  run: npm run test:e2e
```

## Rollback

If a deployment has issues, you can rollback:

### Via Heroku CLI

```bash
# View recent releases
heroku releases --app your-app-name

# Rollback to previous version
heroku rollback --app your-app-name

# Or rollback to specific version
heroku rollback v102 --app your-app-name
```

### Via Heroku Dashboard

1. Go to [Heroku Dashboard](https://dashboard.heroku.com/)
2. Select your app
3. Go to **Activity** tab
4. Click **Roll back to here** on a previous release

### Via GitHub

The workflow automatically rolls back if the health check fails after deployment.

## Notifications

### Get Notified of Deployment Status

#### Email Notifications

GitHub sends email notifications for workflow failures by default.

#### Slack Notifications (Optional)

Add a Slack notification step to the workflow:

```yaml
- name: Notify Slack
  if: success()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_MESSAGE: 'Deployed to Heroku successfully! 🚀'
```

#### Discord Notifications (Optional)

```yaml
- name: Notify Discord
  if: success()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    description: 'Deployed to Heroku!'
```

## CI Logs vs Production Logs

### CI Environment

The workflow sets `CI=true` environment variable:

```yaml
env:
  CI: true
```

This ensures:
- ✅ Tests log at **debug** level (for diagnostics)
- ✅ CI logs go to console only
- ❌ CI logs are **NOT** sent to Sumo Logic

### Production Environment

After deployment, Heroku runs with:
- `NODE_ENV=production`
- `CI` is not set
- Logs sent to Sumo Logic for monitoring

## Performance

### Deployment Time

Typical deployment takes:
- **Tests**: 2-3 minutes
- **Heroku Build**: 3-5 minutes
- **Health Check**: 10-30 seconds
- **Total**: ~5-8 minutes

### Optimize Build Time

1. **Cache dependencies**: Already enabled in workflow
2. **Use npm ci**: Already used for faster installs
3. **Minimize dependencies**: Keep `package.json` lean

## Security Best Practices

### Secrets

✅ **Do:**
- Store all sensitive data in GitHub Secrets
- Use separate secrets for different environments
- Rotate API keys regularly

❌ **Don't:**
- Commit API keys or secrets to the repository
- Share secrets in plain text
- Use production secrets in development

### API Key Permissions

The Heroku API key has full access to your account. Treat it like a password.

### Branch Protection

Consider enabling branch protection:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable:
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

This ensures tests always pass before merging.

## Comparison: Manual vs Automated Deployment

### Manual Deployment
```bash
git push heroku main
```
- Manual trigger required
- No automatic testing
- No deployment history in GitHub
- Faster (no test step)

### Automated Deployment (GitHub Actions)
```bash
git push origin main
```
- ✅ Automatic deployment
- ✅ Tests run first
- ✅ Deployment history tracked
- ✅ Health check included
- ✅ Automatic rollback on failure
- ⏱️ Slightly slower (test step)

## Monitoring Deployments

### GitHub Actions Badge

Add a badge to your README:

```markdown
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)
```

### Check Deployment Status

```bash
# Via GitHub CLI
gh run list --workflow=deploy.yml

# Via Heroku CLI
heroku releases --app your-app-name

# View specific release
heroku releases:info v123 --app your-app-name
```

## Advanced Configuration

### Deploy to Multiple Apps

Deploy to staging and production:

```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  # ... deploy to staging app

deploy-production:
  if: github.ref == 'refs/heads/main'
  # ... deploy to production app
```

### Environment-Specific Config

Set different config vars for each environment:

```yaml
- name: Set Staging Config
  if: github.ref == 'refs/heads/develop'
  run: |
    heroku config:set NODE_ENV=staging --app staging-app
    heroku config:set API_URL=https://staging-api.com --app staging-app
```

## Summary Checklist

- [ ] Heroku account created
- [ ] Heroku app created
- [ ] Heroku API key obtained
- [ ] GitHub secrets configured (3 secrets)
- [ ] Workflow file created (`.github/workflows/deploy.yml`)
- [ ] Pushed to main branch
- [ ] Workflow runs successfully
- [ ] App deployed and working
- [ ] Health check passes
- [ ] Deployment appears in GitHub deployments

## Next Steps

1. ✅ Set up the three GitHub secrets
2. ✅ Push to main branch to trigger first deployment
3. ✅ Monitor the workflow in GitHub Actions
4. ✅ Verify deployment in Heroku
5. ✅ Set up Sumo Logic for log monitoring (see `SUMO_LOGIC_QUICK_SETUP.md`)

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Heroku Deployment Action**: https://github.com/AkhileshNS/heroku-deploy
- **Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

---

**Last Updated**: November 20, 2025  
**Status**: ✅ Ready to Use  
**Deployment**: Automated via GitHub Actions

