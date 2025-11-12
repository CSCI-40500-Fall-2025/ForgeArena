# Continuous Deployment Setup Guide

This document explains how the Continuous Deployment (CD) pipeline is configured for ForgeArena.

## Overview

The CD pipeline automatically builds and deploys the application to Vercel whenever code is pushed to the `main` branch, **but only if all tests pass**.

## Architecture

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - Triggers on push to `main` branch
   - Runs test suite first
   - Deploys to Vercel only if tests pass
   - Creates GitHub Deployment entries

2. **Vercel Platform**
   - Hosts the production deployment
   - Automatically builds and serves the React app
   - Handles serverless API functions in `/api`

## Setup Instructions

### 1. Vercel Project Setup

If you haven't already connected this repository to Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `CSCI-40500-Fall-2025/ForgeArena`
4. Vercel will auto-detect the settings from `vercel.json`

### 2. Configure GitHub Secrets

For the GitHub Actions workflow to deploy to Vercel, you need to add these secrets to your GitHub repository:

1. Go to: `https://github.com/CSCI-40500-Fall-2025/ForgeArena/settings/secrets/actions`
2. Click "New repository secret"
3. Add the following secrets:

#### Required Secrets:

- **`VERCEL_TOKEN`**: 
  - Get from: [Vercel Account Settings > Tokens](https://vercel.com/account/tokens)
  - Create a new token with full access
  - Name: `VERCEL_TOKEN`

- **`VERCEL_ORG_ID`**:
  - Get from: Vercel Dashboard > Your Team/Account Settings
  - Or run: `vercel whoami` and check your `.vercel/project.json`
  - Name: `VERCEL_ORG_ID`

- **`VERCEL_PROJECT_ID`**:
  - Get from: Vercel Dashboard > Your Project > Settings > General
  - Or check `.vercel/project.json` after linking
  - Name: `VERCEL_PROJECT_ID`

### 3. Alternative: Get IDs via Vercel CLI

If you have Vercel CLI installed locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
cd /path/to/ForgeArena
vercel link

# This creates .vercel/project.json with your IDs
cat .vercel/project.json
```

### 4. Verify Deployment

After setting up secrets:

1. Make a commit to the `main` branch
2. Go to: `https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions`
3. Watch the workflow run:
   - First, tests will execute
   - If tests pass, deployment will proceed
   - If tests fail, deployment will be skipped

4. Check deployments:
   - Go to: `https://github.com/CSCI-40500-Fall-2025/ForgeArena/deployments`
   - You should see a new deployment entry

5. Access live app:
   - Your Vercel deployment URL (e.g., `https://forge-arena.vercel.app`)

## How It Works

### Workflow Steps

1. **Test Job** (`test`):
   - Checks out code
   - Sets up Node.js
   - Installs all dependencies (root, client, server)
   - Runs shared tests (`npm run test:shared`)
   - Runs client tests (`npm run test:client`)
   - **If any test fails, the workflow stops here**

2. **Deploy Job** (`deploy`):
   - Only runs if `test` job succeeds
   - Only runs on `main` or `master` branch
   - Installs Vercel CLI
   - Pulls Vercel environment variables
   - Builds the project
   - Deploys to Vercel production
   - Creates a GitHub Deployment entry

### Deployment Conditions

✅ **Deployment happens when:**
- Code is pushed to `main` branch
- All tests pass
- GitHub secrets are configured

❌ **Deployment is skipped when:**
- Tests fail
- Push is to a branch other than `main`
- GitHub secrets are missing

## Manual Deployment

You can also deploy manually using Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Workflow fails with "VERCEL_TOKEN not found"
- Ensure you've added the `VERCEL_TOKEN` secret in GitHub repository settings

### Deployment doesn't appear in GitHub Deployments
- Check that the workflow completed successfully
- Verify the GitHub Actions workflow has permission to create deployments

### Tests pass but deployment doesn't run
- Check that you're pushing to `main` branch
- Verify all required Vercel secrets are set
- Check workflow logs for specific errors

### Vercel deployment fails
- Check Vercel dashboard for build logs
- Verify `vercel.json` configuration is correct
- Ensure all environment variables are set in Vercel dashboard

## Environment Variables

If your app requires environment variables (e.g., Firebase config), add them in:
1. **Vercel Dashboard**: Project Settings > Environment Variables
2. **GitHub Secrets**: For use in CI/CD workflows (if needed)

## Monitoring

- **GitHub Actions**: View workflow runs and logs
- **Vercel Dashboard**: View deployment history and logs
- **GitHub Deployments**: Track deployment status and URLs

## Notes

- The CD pipeline uses Vercel's production environment
- Each deployment creates a new preview URL
- The main production URL is updated on each successful deployment
- Failed deployments don't affect the current production version

