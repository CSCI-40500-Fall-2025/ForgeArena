# Sumo Logic Quick Setup Guide

## 🚀 5-Minute Setup

### Step 1: Create Account (2 minutes)
1. Go to https://www.sumologic.com/sign-up/
2. Sign up for **Free** account
3. Choose region closest to your Heroku app
4. Complete setup

### Step 2: Create HTTP Source (2 minutes)
1. **Manage Data** → **Collection**
2. **Add Collector** → **Hosted Collector**
   - Name: `ForgeArena`
   - Click **Save**
3. **Add Source** → **HTTP Logs & Metrics**
   - Name: `ForgeArena-Server`
   - Source Category: `forgearena/production`
   - Click **Save**
4. **Copy the HTTP Source URL** (looks like):
   ```
   https://collectors.sumologic.com/receiver/v1/http/XXXXXXXXXX
   ```

### Step 3: Configure Heroku (1 minute)
```bash
heroku config:set SUMO_LOGIC_URL=https://collectors.sumologic.com/receiver/v1/http/XXXXXXXXXX
```
Replace XXXXXXXXXX with your actual URL from Step 2!

### Step 4: Deploy
```bash
git add .
git commit -m "Add Sumo Logic monitoring"
git push heroku main
```

### Step 5: Verify (30 seconds)
1. Check Heroku logs:
   ```bash
   heroku logs --tail
   ```
   Look for: `✅ Sumo Logic transport initialized`

2. Open your app and use it:
   ```bash
   heroku open
   ```

3. Go to Sumo Logic → **Log Search**
4. Query:
   ```
   _sourceCategory=forgearena/production
   ```
5. **You should see logs appearing in real-time!** 🎉

## ✅ Done!

Your logs are now streaming to Sumo Logic in real-time.

## Quick Queries

### All Logs
```
_sourceCategory=forgearena/production
```

### Errors Only
```
_sourceCategory=forgearena/production | where level="error"
```

### User Actions
```
_sourceCategory=forgearena/production | where action!=""
```

### Workouts
```
_sourceCategory=forgearena/production | where action="WORKOUT"
```

## Troubleshooting

**No logs appearing?**
```bash
# 1. Check if URL is set
heroku config:get SUMO_LOGIC_URL

# 2. Check logs for errors
heroku logs --tail | grep Sumo

# 3. Restart app
heroku restart
```

**Still not working?**
- Verify the HTTP Source URL is complete (very long)
- Make sure NODE_ENV is set to production
- Check that your Heroku app is receiving traffic

## Full Documentation

See `LOGGING_MONITORING_SETUP.md` for complete guide.

---

**Ready to monitor your logs! 📊**

