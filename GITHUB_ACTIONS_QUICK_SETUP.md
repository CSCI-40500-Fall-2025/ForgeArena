# GitHub Actions - Heroku Deployment Quick Setup

## 🚀 5-Minute Setup for Automated Deployment

### What You Get
- ✅ Automatic deployment on every push to `main`
- ✅ Tests run first (deployment only if tests pass)
- ✅ Health check after deployment
- ✅ Automatic rollback if health check fails

**📌 Using Heroku Teams?** See `HEROKU_TEAMS_SETUP.md` for team-specific instructions.

---

## Step 1: Get Heroku API Key (1 minute)

1. Go to https://dashboard.heroku.com/account
2. Scroll to **API Key** section
3. Click **Reveal**
4. **Copy the key** 📋

## Step 2: Get Your Info (30 seconds)

You need:
- **Heroku App Name**: e.g., `my-forgearena-app`
- **Heroku Email**: Your Heroku login email
- **Heroku Team**: Your team name (if using Heroku Teams)

Find app name:
```bash
heroku apps
```

Find team name (if applicable):
```bash
heroku teams
```

## Step 3: Add GitHub Secrets (2 minutes)

1. Go to your GitHub repo → **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

### Secret 1: HEROKU_API_KEY
- Name: `HEROKU_API_KEY`
- Value: *Your API key from Step 1*

### Secret 2: HEROKU_APP_NAME
- Name: `HEROKU_APP_NAME`
- Value: *Your Heroku app name*

### Secret 3: HEROKU_EMAIL
- Name: `HEROKU_EMAIL`
- Value: *Your Heroku email*

### Secret 4: HEROKU_TEAM (for Heroku Teams)
- Name: `HEROKU_TEAM`
- Value: *Your Heroku Team name*

**Note**: If you're NOT using Heroku Teams, skip Secret 4.

## Step 4: Push to Deploy (1 minute)

```bash
git add .
git commit -m "Enable GitHub Actions deployment"
git push origin main
```

## Step 5: Watch It Deploy! (30 seconds)

1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch it test and deploy! 🎉

---

## ✅ Done!

Now every push to `main` will:
1. Run tests
2. Deploy to Heroku (if tests pass)
3. Run health check
4. Create deployment entry in GitHub

## View Deployments

- **GitHub**: Click **Deployments** in your repo
- **Heroku**: `heroku releases --app your-app-name`

## Manual Trigger

1. Go to **Actions** tab
2. Click **Continuous Deployment**
3. Click **Run workflow**

## Troubleshooting

**Workflow not running?**
- Check you pushed to `main` or `master` branch
- Verify all secrets are set correctly

**Deployment fails?**
- Click on the failed workflow in Actions tab
- Read the error message
- Common issues:
  - Wrong API key or app name
  - Missing `HEROKU_TEAM` secret (if using Teams)
  - App not in the specified team

**Need help?**
See `GITHUB_ACTIONS_HEROKU_SETUP.md` for detailed guide.

---

**Ready to deploy automatically! 🚀**

