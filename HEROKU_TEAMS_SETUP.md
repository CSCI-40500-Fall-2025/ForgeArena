# Heroku Teams Setup Guide

## Overview

If you're using **Heroku Teams** (Enterprise, Team tier), there are a few additional considerations for deployment.

## Key Differences

| Feature | Personal Account | Heroku Teams |
|---------|------------------|--------------|
| App ownership | Individual | Team |
| GitHub Secrets needed | 3 | 4 (includes `HEROKU_TEAM`) |
| API key access | Personal | Team member |
| Permissions | Full | Role-based |

## Setup for Heroku Teams

### Step 1: Verify Team Membership

Ensure you have proper permissions:

```bash
# List your teams
heroku teams

# View team apps
heroku apps --team your-team-name

# Check your role
heroku members --team your-team-name
```

**Required role**: You need at least **member** role to deploy apps.

### Step 2: Find Your Team Name

```bash
# List teams
heroku teams

# Example output:
# your-team-name  collaborator
```

Or find it in Heroku Dashboard:
1. Go to https://dashboard.heroku.com/
2. Look at the dropdown in the top-left
3. Your team name is listed there

### Step 3: GitHub Secrets for Teams

Add **4 secrets** (not 3):

| Secret | Value | How to Get |
|--------|-------|------------|
| `HEROKU_API_KEY` | Your API key | [Account Settings](https://dashboard.heroku.com/account) |
| `HEROKU_APP_NAME` | App name | `heroku apps --team your-team` |
| `HEROKU_EMAIL` | Your email | Your Heroku login email |
| `HEROKU_TEAM` | Team name | `heroku teams` |

### Step 4: Workflow Configuration

The workflow is already configured for Teams! It includes:

```yaml
team: ${{ secrets.HEROKU_TEAM }}  # Required for Heroku Teams
```

### Step 5: Deploy

```bash
git add .
git commit -m "Deploy to Heroku Teams"
git push origin main
```

## Team Permissions

### Required Permissions

To deploy via GitHub Actions, you need:
- ✅ **View** - See the app
- ✅ **Deploy** - Deploy the app
- ✅ **Operate** - Manage app resources

### Role Requirements

| Role | Can Deploy? | Notes |
|------|-------------|-------|
| **Admin** | ✅ Yes | Full access |
| **Member** | ✅ Yes | Standard access |
| **Viewer** | ❌ No | Read-only |

### Check Your Permissions

```bash
heroku apps:info --app your-app-name
```

Look for the "Owner" line - it should show your team name.

## App Creation for Teams

### Create App in Team

```bash
# Create app in team
heroku apps:create your-app-name --team your-team-name

# Or transfer existing app to team
heroku apps:transfer --app your-app-name --team your-team-name
```

### Verify App Ownership

```bash
# Check app details
heroku apps:info --app your-app-name

# Output should show:
# Owner: your-team-name
```

## API Key for Teams

### Personal API Key (Recommended)

Use your personal API key - it works for team apps if you're a member:

1. Go to https://dashboard.heroku.com/account
2. Scroll to **API Key**
3. Click **Reveal**
4. Copy the key

### Team API Key (Alternative)

Some teams use shared API keys:

1. Ask your team admin for the team API key
2. Or generate one if you're an admin:
   ```bash
   heroku authorizations:create --description "GitHub Actions" --short
   ```

## Troubleshooting

### Error: "App not found"

**Cause**: App doesn't exist or not in the specified team

**Solution**:
```bash
# Verify app exists
heroku apps:info --app your-app-name

# Check it's in your team
heroku apps --team your-team-name
```

### Error: "Insufficient permissions"

**Cause**: Your role doesn't allow deployments

**Solution**:
- Ask team admin to upgrade your role to **Member** or **Admin**
- Or use a team API key with proper permissions

### Error: "Team not found"

**Cause**: `HEROKU_TEAM` secret has wrong team name

**Solution**:
```bash
# Get exact team name
heroku teams

# Update GitHub secret with exact name (case-sensitive)
```

### Deployment Succeeds But Uses Wrong Team

**Cause**: `HEROKU_TEAM` not set or incorrect

**Solution**:
1. Verify secret: Go to GitHub → Settings → Secrets
2. Ensure `HEROKU_TEAM` exists and matches exactly
3. Team names are case-sensitive!

## Team Environment Variables

### Set Team-Wide Config

```bash
# Set config for specific app
heroku config:set KEY=value --app your-app-name

# View all config
heroku config --app your-app-name
```

### Required Variables

```bash
# For ForgeArena
heroku config:set NODE_ENV=production --app your-app-name
heroku config:set SUMO_LOGIC_URL=your-url --app your-app-name
```

## Cost Considerations

### Team Billing

- Apps in teams are billed to the team account
- Not to individual members
- Check with your team admin for budget

### Dyno Usage

```bash
# View dyno usage
heroku ps --app your-app-name

# View team usage
heroku billing:usage --team your-team-name
```

## Best Practices for Teams

### 1. Use Personal API Keys

✅ **Do**: Use personal API keys for deployments
- Easier to track who deployed
- Can be revoked individually
- Tied to your permissions

❌ **Don't**: Share API keys between team members

### 2. Document Your Setup

Add to your team's documentation:
- Which GitHub secrets are configured
- Who has deployment access
- Emergency rollback procedures

### 3. Set Up Notifications

Configure team notifications for deployments:
- Slack channel for deployment alerts
- Email notifications for failures
- Status page updates

### 4. Branch Protection

For team collaboration:
1. Require pull request reviews
2. Require status checks to pass
3. Restrict who can push to `main`

```yaml
# .github/CODEOWNERS
* @your-team-name/reviewers
```

### 5. Environment-Specific Apps

Consider separate apps for each environment:

```bash
# Staging app
heroku apps:create myapp-staging --team your-team

# Production app  
heroku apps:create myapp-production --team your-team
```

## Multiple Team Members Deploying

### Coordinate Deployments

1. **Use pull requests**: Don't push directly to `main`
2. **Merge queue**: Prevent deployment conflicts
3. **Deployment locks**: For critical releases

### Deployment History

```bash
# View who deployed what
heroku releases --app your-app-name

# See detailed release info
heroku releases:info v123 --app your-app-name
```

### Rollback Permissions

All team members with deploy permissions can rollback:

```bash
heroku rollback --app your-app-name
```

## Team Collaboration Features

### Pipelines

Set up a pipeline for your team:

```bash
# Create pipeline
heroku pipelines:create your-pipeline --team your-team-name

# Add apps to pipeline
heroku pipelines:add your-pipeline --app myapp-staging --stage staging
heroku pipelines:add your-pipeline --app myapp-prod --stage production

# Promote from staging to production
heroku pipelines:promote --app myapp-staging
```

### Review Apps

Enable review apps for pull requests:

1. Go to Heroku Dashboard
2. Select your pipeline
3. Enable **Review Apps**
4. Configure automatic creation

## Security for Teams

### API Key Rotation

Rotate keys regularly:

```bash
# Generate new API key
heroku authorizations:create --description "GitHub Actions $(date +%Y-%m)"

# Update GitHub secret with new key
# Revoke old authorization
```

### Access Audit

Regular audit of team access:

```bash
# List team members
heroku members --team your-team-name

# List app collaborators
heroku access --app your-app-name

# Remove access if needed
heroku access:remove user@example.com --app your-app-name
```

### Least Privilege

Grant minimum required permissions:
- Most developers: **Member** role
- CI/CD: **Deploy** permission only
- Admins: **Admin** role (few people)

## Migration from Personal to Team

### Transfer App to Team

```bash
# Transfer app
heroku apps:transfer --app your-app-name --team your-team-name

# Update GitHub secret
# Add HEROKU_TEAM secret with team name

# Redeploy
git push origin main
```

### Verify Transfer

```bash
# Check app owner
heroku apps:info --app your-app-name
# Should show: Owner: your-team-name
```

## Summary Checklist for Teams

- [ ] Verify team membership and role
- [ ] Find exact team name: `heroku teams`
- [ ] Verify app is in team: `heroku apps --team your-team`
- [ ] Set 4 GitHub secrets (including `HEROKU_TEAM`)
- [ ] Test deployment
- [ ] Document team deployment process
- [ ] Set up team notifications

## Quick Commands Reference

```bash
# Team info
heroku teams
heroku members --team your-team

# App info
heroku apps --team your-team
heroku apps:info --app your-app

# Deploy
git push origin main  # Triggers GitHub Actions

# Monitor
heroku logs --tail --app your-app
heroku releases --app your-app

# Rollback
heroku rollback --app your-app
```

## Need Help?

- **Team Admin**: Contact your team administrator
- **Heroku Support**: Available for team plans
- **Documentation**: See `GITHUB_ACTIONS_QUICK_SETUP.md`

---

**For Heroku Teams**: Remember to add the `HEROKU_TEAM` secret! 

