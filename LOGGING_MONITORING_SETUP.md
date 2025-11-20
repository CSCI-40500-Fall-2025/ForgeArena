# Logging and Monitoring Setup Guide

## Overview

ForgeArena uses **Winston** as its logging framework with **Sumo Logic** for real-time log monitoring and analysis. This setup provides comprehensive logging across 5 granularity levels and real-time ingestion to a cloud-based monitoring console.

## Logging Framework: Winston

### Log Levels (5 Granularities)

Our logging system uses 5 different log levels, from most severe to least:

| Level | Priority | Usage | Example |
|-------|----------|-------|---------|
| **error** | 0 | System errors, exceptions, critical failures | Database connection failures, unhandled errors |
| **warn** | 1 | Warning conditions, potential issues | Invalid requests, deprecated features |
| **info** | 2 | Important business events | User login, quest completion, level up |
| **http** | 3 | HTTP request/response logging | API calls, response times |
| **debug** | 4 | Detailed diagnostic information | Data fetching, parameter validation |

### Current Log Statement Count

✅ **Requirements Met**: The project has **35+ log statements** across **5 granularities**:

- **error**: 6 statements (system errors, exceptions)
- **warn**: 5 statements (warnings, validation errors)
- **info**: 9 statements (business events, user actions)
- **http**: 1 statement (HTTP middleware logging)
- **debug**: 14 statements (detailed diagnostics)

### Environment-Based Logging Levels

#### CI Environment
```javascript
// When CI=true, logs at DEBUG level (most verbose)
// Helps diagnose test failures
if (process.env.CI === 'true') {
  logLevel = 'debug'; // All logs visible
}
```

#### Development Environment
```javascript
// Logs at DEBUG level for local development
if (process.env.NODE_ENV === 'development') {
  logLevel = 'debug';
}
```

#### Production Environment
```javascript
// Logs at WARN level to reduce noise
if (process.env.NODE_ENV === 'production') {
  logLevel = 'warn';
}
```

## Log Monitoring: Sumo Logic

### Why Sumo Logic?

- ✅ **Free Tier Available**: 500 MB/day free ingestion
- ✅ **Real-Time Ingestion**: Logs appear immediately
- ✅ **Cloud-Based**: No self-hosting required
- ✅ **Powerful Search**: Query logs with advanced filters
- ✅ **Dashboards**: Visualize log data
- ✅ **Alerts**: Get notified of issues

### Setup Instructions

#### Step 1: Create Sumo Logic Account

1. Go to [https://www.sumologic.com/sign-up/](https://www.sumologic.com/sign-up/)
2. Sign up for a **Free** account
3. Choose your region (closest to your Heroku app)
4. Complete the setup wizard

#### Step 2: Create HTTP Source

1. In Sumo Logic, go to **Manage Data** → **Collection**
2. Click **Add Collector** → **Hosted Collector**
   - Name: `ForgeArena`
   - Description: `ForgeArena production logs`
   - Click **Save**

3. Click **Add Source** → **HTTP Logs & Metrics**
   - Name: `ForgeArena-Server`
   - Source Category: `forgearena/production`
   - Click **Save**

4. **Copy the HTTP Source URL** - it looks like:
   ```
   https://collectors.sumologic.com/receiver/v1/http/[YOUR-UNIQUE-TOKEN]
   ```
   
   **Keep this URL safe!** You'll need it for the next step.

#### Step 3: Configure Environment Variable

##### For Local Testing:
Create a `.env` file in the `server` directory:
```bash
NODE_ENV=production
SUMO_LOGIC_URL=https://collectors.sumologic.com/receiver/v1/http/[YOUR-TOKEN]
```

##### For Heroku Production:
```bash
heroku config:set SUMO_LOGIC_URL=https://collectors.sumologic.com/receiver/v1/http/[YOUR-TOKEN]
```

**Important**: Make sure to use your actual HTTP Source URL from Step 2!

#### Step 4: Deploy and Verify

1. **Deploy to Heroku**:
   ```bash
   git add .
   git commit -m "Add Sumo Logic monitoring"
   git push heroku main
   ```

2. **Check Heroku logs** to verify Sumo Logic initialized:
   ```bash
   heroku logs --tail
   ```
   
   You should see:
   ```
   ✅ Sumo Logic transport initialized for real-time log monitoring
   ```

3. **Generate some logs** by using your app:
   - Visit your Heroku app URL
   - Log a workout
   - Complete a quest
   - Check the leaderboard

4. **View logs in Sumo Logic**:
   - Go to Sumo Logic dashboard
   - Click **Log Search** in the left menu
   - Use this query to see all logs:
     ```
     _sourceCategory=forgearena/production
     ```
   - You should see logs appearing in real-time!

### Step 5: Exclude CI Logs

✅ **Already configured!** The logger automatically excludes CI logs from Sumo Logic:

```javascript
// Only sends to Sumo Logic in production (not in CI)
if (process.env.NODE_ENV === 'production' && process.env.CI !== 'true') {
  // Sumo Logic transport enabled
}
```

This means:
- ✅ CI tests log to console only (for debugging test failures)
- ✅ Production logs go to Sumo Logic (for monitoring)
- ✅ Local development logs to console and files

## Log Destinations

### Development Environment
- ✅ **Console** (colorized, debug level)
- ✅ **File**: `logs/combined.log` (all logs)
- ✅ **File**: `logs/error.log` (errors only)
- ✅ **File**: `logs/user-activity.log` (user actions)

### CI Environment
- ✅ **Console** (debug level for test diagnostics)
- ✅ **Files** (for archiving)
- ❌ **Sumo Logic** (excluded - CI logs don't go to monitoring)

### Production Environment (Heroku)
- ✅ **Console** (warn level)
- ✅ **Sumo Logic** (debug level - all logs for monitoring)
- ✅ **Files** (ephemeral - may be lost on dyno restart)

## Using Sumo Logic

### Basic Queries

#### View All Logs
```
_sourceCategory=forgearena/production
```

#### Filter by Log Level
```
_sourceCategory=forgearena/production | where level="error"
_sourceCategory=forgearena/production | where level="warn"
_sourceCategory=forgearena/production | where level="info"
```

#### Filter by Action
```
_sourceCategory=forgearena/production | where action="WORKOUT"
_sourceCategory=forgearena/production | where action="QUEST"
_sourceCategory=forgearena/production | where action="LEVEL_UP"
```

#### Search by User
```
_sourceCategory=forgearena/production | where userId="123"
```

#### Recent Errors
```
_sourceCategory=forgearena/production 
| where level="error" 
| sort by timestamp desc
```

#### Request Performance
```
_sourceCategory=forgearena/production 
| where level="http"
| timeslice 1m
| avg(duration) by timeslice
```

### Creating Dashboards

1. In Sumo Logic, go to **Dashboards**
2. Click **+ New Dashboard**
3. Add panels with queries like:
   - Error rate over time
   - Request volume
   - User activity
   - Level up events

### Setting Up Alerts

1. Go to **Alerts** → **New Monitor**
2. Create alerts for:
   - **High Error Rate**: More than 10 errors in 5 minutes
   - **Server Down**: No logs received in 10 minutes
   - **Slow Requests**: HTTP requests taking > 1000ms

## Log Format

### Standard Log Format
```
2025-11-20 15:30:45 [INFO] [User:123] [WORKOUT]: Workout completed {"exercise":"squat","reps":20,"xpEarned":40}
```

### Components
- **Timestamp**: `2025-11-20 15:30:45`
- **Level**: `[INFO]`
- **User Context**: `[User:123]` (if available)
- **Action**: `[WORKOUT]` (if available)
- **Message**: Main log message
- **Metadata**: JSON object with additional data

## Example Log Statements

### Error Level
```javascript
logger.error('Workout processing failed', {
  userId: mockUser.id,
  exercise: req.body.exercise,
  error: error.message,
  stack: error.stack,
  action: 'WORKOUT',
});
```

### Warn Level
```javascript
logger.warn('Quest already completed', {
  userId: mockUser.id,
  questId,
  questName: quest.name,
  action: 'QUEST',
});
```

### Info Level
```javascript
logger.info('🎉 User leveled up!', {
  userId: mockUser.id,
  questId,
  oldLevel,
  newLevel,
  totalXp: mockUser.avatar.xp,
  action: 'LEVEL_UP',
});
```

### HTTP Level
```javascript
logger.http(`${req.method} ${req.path} ${res.statusCode}`, {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: `${duration}ms`,
});
```

### Debug Level
```javascript
logger.debug('Processing workout submission', {
  userId: mockUser.id,
  exercise,
  reps,
  action: 'WORKOUT',
});
```

## Testing the Setup

### 1. Local Test with Production Mode

```bash
# In server directory
cd server

# Set environment variables
export NODE_ENV=production
export SUMO_LOGIC_URL=your-sumo-logic-url

# Start server
npm start

# In another terminal, test API
curl http://localhost:5000/api/user

# Check Sumo Logic dashboard - you should see logs!
```

### 2. Heroku Test

```bash
# Deploy
git push heroku main

# Check logs
heroku logs --tail

# Use your app (open in browser)
heroku open

# Check Sumo Logic dashboard for real-time logs
```

### 3. Verify All Log Levels

Test each endpoint to generate different log levels:

- **Debug**: Any GET request (fetching data)
- **HTTP**: All HTTP requests
- **Info**: Complete a quest, log a workout
- **Warn**: Try to complete the same quest twice
- **Error**: Send invalid data to an endpoint

## Troubleshooting

### Logs Not Appearing in Sumo Logic

1. **Check Environment Variable**:
   ```bash
   heroku config:get SUMO_LOGIC_URL
   ```
   Should show your HTTP Source URL

2. **Check Heroku Logs**:
   ```bash
   heroku logs --tail | grep "Sumo Logic"
   ```
   Should show: `✅ Sumo Logic transport initialized`

3. **Verify HTTP Source URL**:
   - Copy the URL from Sumo Logic
   - Make sure it starts with `https://collectors.sumologic.com/`
   - Ensure the token is complete (very long string)

4. **Test with curl**:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"message":"Test from curl","level":"info"}' \
     YOUR_SUMO_LOGIC_URL
   ```
   Should return 200 OK

### Logs Delayed

- Check `syncInterval` in logger.js (set to 1000ms = 1 second)
- Network delays are possible but should be < 5 seconds
- Refresh Sumo Logic dashboard

### CI Logs in Sumo Logic

✅ **This should NOT happen** - CI logs are excluded by design:
```javascript
if (process.env.NODE_ENV === 'production' && process.env.CI !== 'true')
```

If CI logs appear:
- Check that `CI=true` is set in your CI environment
- Verify the condition in `server/utils/logger.js`

## Security Considerations

### Protecting Your Sumo Logic URL

⚠️ **Never commit your Sumo Logic URL to Git!**

- ✅ Use environment variables only
- ✅ Store in Heroku config vars
- ✅ Add to `.env` but ensure `.env` is in `.gitignore`

### Log Sanitization

Consider sanitizing sensitive data before logging:

```javascript
// DON'T log passwords or tokens
logger.info('User login', { 
  userId: user.id,
  // password: user.password  ❌ NEVER
});

// Sanitize email
logger.info('User registered', {
  email: email.replace(/(.{2}).*(@.*)/, '$1***$2')  // ab***@example.com
});
```

## Performance Considerations

### Log Levels in Production

- Production uses **warn** level by default (reduces volume)
- Sumo Logic receives **debug** level (full monitoring)
- This balances console output vs. monitoring needs

### Batching

Sumo Logic transport batches logs:
- **syncInterval**: 1000ms (sends every second)
- **maxBatchSize**: 100 logs per batch
- **maxBatchCount**: 10 batches queued max

### Free Tier Limits

Sumo Logic Free Tier:
- **500 MB/day** ingestion
- **7 days** retention
- **Up to 3 users**

Monitor your usage in Sumo Logic dashboard.

## Cost Optimization

### Reduce Log Volume

If approaching free tier limits:

1. **Increase log level** in production:
   ```javascript
   return env === 'production' ? 'info' : 'debug';  // Skip debug logs
   ```

2. **Filter logs** before sending to Sumo Logic:
   ```javascript
   new SumoLogic({
     level: 'info',  // Only send info and above
   })
   ```

3. **Use log sampling** for high-volume endpoints

## Additional Monitoring Options

The logger also supports (already configured):

### Logtail (BetterStack)
```bash
heroku config:set LOGTAIL_SOURCE_TOKEN=your-token
```

### AWS CloudWatch
```bash
heroku config:set CLOUDWATCH_LOG_GROUP=forgearena
heroku config:set AWS_REGION=us-east-1
```

## Summary Checklist

- ✅ Winston logging framework with 5 levels
- ✅ 35+ log statements across all granularities
- ✅ CI logs at debug level (not sent to Sumo Logic)
- ✅ Production logs at warn level (console)
- ✅ Sumo Logic receives debug level (full monitoring)
- ✅ Real-time log ingestion (<5 seconds)
- ✅ CI logs excluded from monitoring console
- ✅ Environment-based configuration
- ✅ Secure credential management

## Next Steps

1. ✅ Create Sumo Logic account
2. ✅ Create HTTP Source and get URL
3. ✅ Set `SUMO_LOGIC_URL` in Heroku
4. ✅ Deploy to Heroku
5. ✅ Verify logs appear in Sumo Logic
6. ✅ Create dashboards for monitoring
7. ✅ Set up alerts for critical issues

## Support Resources

- **Winston Documentation**: https://github.com/winstonjs/winston
- **Sumo Logic Documentation**: https://help.sumologic.com/
- **Winston-Sumo Logic Transport**: https://github.com/cainus/winston-sumologic-transport
- **Sumo Logic Free Tier**: https://www.sumologic.com/pricing/

---

**Last Updated**: November 20, 2025  
**Log Framework**: Winston v3.18.3  
**Monitoring Platform**: Sumo Logic (Free Tier)  
**Status**: ✅ Ready for Production

