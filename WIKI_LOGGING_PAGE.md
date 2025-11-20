# Logging - ForgeArena Wiki Page

## Project Logging Strategy

ForgeArena implements a comprehensive, multi-level logging strategy designed to provide full observability in production while maintaining detailed diagnostics in CI/testing environments.

### Strategy Overview

Our logging strategy follows these key principles:

1. **Environment-Aware Logging**: Different log levels for different environments
   - **CI/Testing**: Debug level (most verbose) for test diagnostics
   - **Development**: Debug level for local debugging
   - **Production**: Warn level to console, Debug level to monitoring service

2. **Structured Logging**: All logs include rich metadata
   - User context (userId, username)
   - Action categorization (WORKOUT, QUEST, LEVEL_UP, etc.)
   - Performance metrics (duration, response times)
   - Business metrics (XP earned, levels gained)

3. **Real-Time Monitoring**: Production logs stream to Sumo Logic for:
   - Real-time alerting on errors
   - Performance monitoring
   - User behavior analytics
   - Trend analysis

4. **CI Log Separation**: CI logs are excluded from production monitoring to:
   - Keep monitoring console clean
   - Reduce noise from test runs
   - Focus on real production issues
   - Lower monitoring costs

### Log Levels and Usage

| Level | Priority | Count | Use Case | Example |
|-------|----------|-------|----------|---------|
| **error** | 0 (highest) | 6 | Critical failures, exceptions | Database errors, unhandled exceptions |
| **warn** | 1 | 5 | Warning conditions, potential issues | Invalid requests, quest already completed |
| **info** | 2 | 9 | Important business events | User login, quest completion, level up |
| **http** | 3 | 1 | HTTP request/response logging | All API calls with response times |
| **debug** | 4 (lowest) | 14 | Detailed diagnostic information | Data fetching, parameter validation |

**Total**: 35+ log statements across all application endpoints

### Logging Destinations

#### Development Environment
- Console output (colorized, debug level)
- Local files:
  - `logs/combined.log` (all logs)
  - `logs/error.log` (errors only)
  - `logs/user-activity.log` (info and above)

#### CI Environment
- Console output (debug level for test diagnostics)
- Log files for archiving
- **Not sent to Sumo Logic** (intentionally excluded)

#### Production Environment (Heroku)
- Console output (warn level - reduces noise)
- **Sumo Logic** (debug level - full monitoring)
- Ephemeral files (may be lost on dyno restart)

---

## Logging Framework: Winston

### Overview

**Framework**: [Winston v3.18.3](https://github.com/winstonjs/winston)  
**Language**: Node.js / JavaScript  
**License**: MIT

### Why Winston?

Winston was chosen for ForgeArena because it provides:

1. **Multiple Log Levels**: Supports 5+ granularity levels (error, warn, info, http, debug)
2. **Multiple Transports**: Can send logs to console, files, and cloud services simultaneously
3. **Structured Logging**: Native JSON support with metadata
4. **Production-Ready**: Battle-tested in enterprise applications
5. **Extensible**: Easy to add custom transports (like Sumo Logic)
6. **Performance**: Asynchronous, non-blocking logging
7. **Popular**: Large community, well-maintained

### Winston Configuration

**Location**: `server/utils/logger.js`

**Key Features**:
- Custom log levels with color coding
- Environment-aware level selection
- Multiple transports (console, files, Sumo Logic)
- Rich metadata support
- Automatic error stack traces
- Request duration tracking
- User context in logs

### Winston Transports Used

1. **Console Transport**: All environments (colorized in dev)
2. **File Transports**: 
   - Combined logs
   - Error-only logs
   - User activity logs
3. **Sumo Logic Transport**: Production only (excluded from CI)

### Sample Winston Log Format

```
2025-11-20 15:30:45 [INFO] [User:123] [WORKOUT]: Workout completed {"exercise":"squat","reps":20,"xpEarned":40,"duration":"45ms"}
```

**Format Components**:
- Timestamp: ISO 8601 format
- Level: ERROR, WARN, INFO, HTTP, DEBUG
- User Context: [User:ID]
- Action Category: [WORKOUT], [QUEST], etc.
- Message: Human-readable description
- Metadata: JSON object with details

---

## Logging Console: Sumo Logic

### Overview

**Service**: [Sumo Logic](https://www.sumologic.com/)  
**Tier**: Free Tier (500 MB/day)  
**Type**: Cloud-based log management and analytics platform

### Why Sumo Logic?

Sumo Logic was selected for ForgeArena because:

1. **Free Tier Available**: 500 MB/day is sufficient for our needs
2. **Real-Time Ingestion**: Logs appear within 1-5 seconds
3. **Cloud-Hosted**: No self-hosting infrastructure required
4. **Powerful Search**: Advanced query language with filtering
5. **Dashboards**: Visual analytics and trend analysis
6. **Alerts**: Configurable alerting on error rates, downtimes
7. **Easy Integration**: Simple HTTP endpoint for log ingestion

### Sumo Logic Configuration

**Integration**: `winston-sumologic-transport` v5.4.4

**Settings**:
- **URL**: HTTP Source endpoint (environment variable)
- **Source Category**: `forgearena/production`
- **Source Name**: `ForgeArena-Server`
- **Interval**: 1000ms (1 second batching)
- **Level**: debug (all logs sent to monitoring)

### Features Used

1. **Log Search**: Query logs with advanced filters
2. **Time Range Selection**: View logs from specific time periods
3. **Field Extraction**: Automatic parsing of JSON metadata
4. **Filtering**: By level, action, user, error type
5. **Aggregation**: Count errors, average response times
6. **Export**: Download logs for offline analysis

### Sample Sumo Logic Queries

**View all logs**:
```
_sourceCategory=forgearena/production
```

**Filter by level**:
```
_sourceCategory=forgearena/production | where level="error"
```

**Filter by action**:
```
_sourceCategory=forgearena/production | where action="WORKOUT"
```

**Performance monitoring**:
```
_sourceCategory=forgearena/production 
| where level="http"
| avg(duration) by timeslice
```

**Error rate over time**:
```
_sourceCategory=forgearena/production 
| where level="error"
| timeslice 5m
| count by _timeslice
```

---

## CI Logs at Lowest Granularity (Debug Level)

### Permalink to Recent CI Run

**GitHub Actions Workflow**: [Continuous Deployment]

**Permalink to CI Run with Debug Logs**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions/runs/[RUN_ID]
```

**Note**: Replace `[RUN_ID]` with actual run ID from your GitHub Actions

### How to Access CI Logs

1. Go to: https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions
2. Click on any **Continuous Deployment** workflow run
3. Click on the **Run Tests** job
4. Expand the **Run shared tests** or **Run client tests** step
5. CI environment automatically logs at **DEBUG** level (lowest/most verbose)

### CI Log Configuration

The CI environment is configured to log at debug level in `server/utils/logger.js`:

```javascript
const level = () => {
  const isCI = process.env.CI === 'true';
  
  if (isCI) {
    console.log('🔍 CI Environment Detected - Logging at DEBUG level');
    return 'debug';  // Lowest level for CI
  }
  return env === 'production' ? 'warn' : 'debug';
};
```

**Key Point**: `CI=true` environment variable triggers debug-level logging for test diagnostics.

---

## Code Permalinks: Log Statements by Granularity

### 1. ERROR Level (Priority 0 - Highest)

**Location**: `server/index.js` line 107

**Permalink**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L107
```

**Code**:
```javascript
logger.error('Workout processing failed', {
  userId: mockUser.id,
  exercise: req.body.exercise,
  reps: req.body.reps,
  error: error.message,
  stack: error.stack,
  action: 'WORKOUT',
});
```

**Purpose**: Logs critical workout processing failures with full error context and stack trace.

---

### 2. WARN Level (Priority 1)

**Location**: `server/index.js` line 148

**Permalink**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L148
```

**Code**:
```javascript
logger.warn('Quest already completed', {
  userId: mockUser.id,
  questId,
  questName: quest.name,
  action: 'QUEST',
});
```

**Purpose**: Warns when a user attempts to complete a quest that's already been completed.

---

### 3. INFO Level (Priority 2)

**Location**: `server/index.js` line 171

**Permalink**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L171
```

**Code**:
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

**Purpose**: Logs important business event when user gains a level, includes before/after level data.

---

### 4. DEBUG Level (Priority 4 - Lowest)

**Location**: `server/index.js` line 86

**Permalink**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L86
```

**Code**:
```javascript
logger.debug('Processing workout submission', {
  userId: mockUser.id,
  exercise,
  reps,
  action: 'WORKOUT',
});
```

**Purpose**: Detailed diagnostic logging for workout submission processing, useful for debugging.

---

### 5. HTTP Level (Priority 3) - Bonus

**Location**: `server/index.js` line 27

**Permalink**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L27
```

**Code**:
```javascript
logger[level](`${req.method} ${req.path} ${res.statusCode}`, {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: `${duration}ms`,
  ip: req.ip,
  userAgent: req.get('user-agent'),
});
```

**Purpose**: Logs all HTTP requests/responses with timing information for performance monitoring.

---

## Logging Console Access

### Sumo Logic Dashboard

**URL**: https://service.sumologic.com/

**Access Instructions**:
1. Login with credentials (provided separately in Brightspace)
2. Click **Log Search** in the left sidebar
3. Use query: `_sourceCategory=forgearena/production`
4. Set time range to desired period (e.g., "Last 1 Hour")
5. Click **Start** to view logs

### Quick Access Queries

**All ForgeArena Logs**:
```
_sourceCategory=forgearena/production
```

**Recent Errors**:
```
_sourceCategory=forgearena/production 
| where level="error"
| sort by _messageTime desc
```

**User Activity**:
```
_sourceCategory=forgearena/production 
| where action in ("WORKOUT", "QUEST", "LEVEL_UP")
```

**API Performance**:
```
_sourceCategory=forgearena/production 
| where level="http"
| avg(duration), max(duration), min(duration) by path
```

### Features Available in Console

1. **Real-Time Search**: Live log streaming
2. **Time Range Picker**: Custom date/time ranges
3. **Field Browser**: Explore available log fields
4. **Query Builder**: Visual query construction
5. **Dashboard Creation**: Custom visualizations
6. **Alert Configuration**: Set up notifications
7. **Export**: Download logs as CSV/JSON

### Credentials

**Note**: Login credentials for Sumo Logic have been provided separately via Brightspace for security.

**Security Notice**: 
- The Sumo Logic account uses a unique password not used elsewhere
- Access is limited to read-only log viewing
- No sensitive data (passwords, tokens) are logged
- All logs are encrypted in transit (HTTPS)

---

## Documentation Files

Complete logging documentation available in repository:

1. **`LOGGING_MONITORING_SETUP.md`** - Complete setup guide
2. **`LOGGING_ANALYSIS.md`** - Technical implementation analysis
3. **`LOGGING_IMPLEMENTATION_COMPLETE.md`** - Implementation summary
4. **`SUMO_LOGIC_QUICK_SETUP.md`** - Quick setup guide
5. **`server/utils/logger.js`** - Winston configuration

---

## Summary Statistics

- **Logging Framework**: Winston v3.18.3
- **Log Monitoring**: Sumo Logic (Free Tier)
- **Total Log Statements**: 35+
- **Granularity Levels**: 5 (error, warn, info, http, debug)
- **CI Log Level**: debug (most verbose)
- **Production Console Level**: warn
- **Production Monitoring Level**: debug (full logs to Sumo Logic)
- **Real-Time Ingestion**: < 5 seconds latency
- **CI Logs in Monitoring**: No (intentionally excluded)

---

## Compliance Summary

✅ **Logging Framework**: Winston (not print statements)  
✅ **Granularity Levels**: 5 levels (exceeds requirement of 4)  
✅ **Multiple Statements**: 35+ statements across all levels  
✅ **CI Logging**: Debug level (lowest granularity)  
✅ **Production Logging**: Higher level (warn to console)  
✅ **Monitoring System**: Sumo Logic with HTTP Source  
✅ **Real-Time Ingestion**: Yes (1-second intervals)  
✅ **CI Logs Excluded**: Yes (not sent to Sumo Logic)  
✅ **Beyond Unit Tests**: Logs throughout application endpoints  

---

**Last Updated**: November 20, 2025  
**Project**: ForgeArena - Gamified Fitness Platform  
**Repository**: https://github.com/CSCI-40500-Fall-2025/ForgeArena

