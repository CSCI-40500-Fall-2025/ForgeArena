# NEW CI/CD Pipeline Overview

## `.github/workflows/deploy.yml`

```
┌────────────────────────────────────────────────────────────────────┐
│                    TRIGGER: Push/PR to main/master                  │
│              + Manual workflow_dispatch available                   │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │            TEST JOB (Parallel: Node 16.x & 20.x)        │
        │─────────────────────────────────────────────────────────│
        │     Install dependencies (root, server, client)         │
        │     Run shared game logic tests                         │
        │     Run server API tests (NEW! 80+ cases)               │
        │     Run client React tests                              │
        │     Upload coverage to Codecov (Node 16.x only)         │
        └─────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                ▼                                   ▼
  ┌──────────────────────────┐      ┌──────────────────────────┐
  │     LINT & SECURITY      │      │     BUILD                │
  │──────────────────────────│      │──────────────────────────│
  │   npm audit (root)       │      │   npm ci (client)        │
  │   npm audit (server)     │      │   npm run build          │
  │   npm audit (client)     │      │   Upload artifacts       │
  │   Check console.log      │      │     (retained 7 days)    │
  └──────────────────────────┘      └──────────────────────────┘
                │                                   │
                └─────────────────┬─────────────────┘
                                  │
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │         DEPLOY (only on main/master push)              │
        │─────────────────────────────────────────────────────────│
        │     Checkout & Install Heroku CLI                       │
        │     Deploy to Heroku (git push)                         │
        │     Health check (5 retry attempts)                     │
        │     Create GitHub deployment record                     │
        │     Generate deployment summary                         │
        └─────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                           DEPLOYMENT COMPLETE!
```

## Test Execution Details

### Test Job Matrix
```
┌──────────────┬──────────────┐
│  Node 16.x   │  Node 20.x   │
├──────────────┼──────────────┤
│ Shared Tests │ Shared Tests │
│ Server Tests │ Server Tests │
│ Client Tests │ Client Tests │
└──────────────┴──────────────┘
        │              │
        └──────┬───────┘
               │
        Both must pass 
```

### Server API Tests (NEW!)
```
server/__tests__/
├── api.test.js (40+ tests)
│   ├── Health endpoint
│   ├── User profile
│   ├── Workout processing
│   ├── Achievements
│   ├── Quests
│   ├── Inventory
│   └── Raids & Gyms
│
├── routes.test.js (25+ tests)
│   ├── Achievement routes
│   ├── Quest routes
│   ├── Duel routes
│   ├── Activity routes
│   └── Leaderboard routes
│
└── services.test.js (20+ tests)
    ├── Achievement service
    ├── Quest service
    ├── Duel service
    ├── Raid service
    ├── Activity service
    └── Item service
```

##  Quality Gates

### For Pull Requests
```
PR → [Tests Pass?] → [Build OK?] → [Security OK?] →  Ready to Merge
        Fail           Fail         Warning
```

### For Deployment
```
Push to main → [All Tests Pass?] → [Build OK?] →  Deploy → [Health Check?] →  Live
                     Stop             Stop                     Rollback
```

##  Coverage Tracking

```
After Each Test Run:
├── Generate coverage reports
├── Upload to Codecov (Node 16.x)
└── Available in:
    ├── GitHub Actions artifacts
    ├── Codecov dashboard
    └── Local: server/coverage/index.html
```

##  Security Flow

```
Security Job:
├── npm audit (root dependencies)
├── npm audit (server dependencies)
├── npm audit (client dependencies)
└── console.log check
    │
    ├─ Critical/High vulnerabilities →  Warning
    └─ console.log found →  Warning
    
(Warnings don't block deployment but are logged)
```

##  Deployment Process

```
main branch push
    │
    ├─ Tests pass 
    ├─ Build succeeds 
    │
    ▼
Install Heroku CLI
    │
    ▼
git push heroku main --force
    │
    ▼
Wait 30 seconds
    │
    ▼
Health check (5 attempts, 10s each)
    │
    ├─ Success → Create GitHub deployment 
    │            Generate summary
    │            App is LIVE! 
    │
    └─ Fail → Deployment marked failed 
              Manual intervention needed
```

## Coverage & Quality Metrics

```
Codecov Integration:
┌──────────────────────────────┐
│  Coverage Uploaded           │
│  ├── Shared: game logic      │
│  ├── Server: API routes      │
│  ├── Server: Services        │
│  └── Client: React components│
│                              │
│  Trends & Badges Available  │
└──────────────────────────────┘
```


### OLD PIPELINE
```
Old Pipeline:
• Shared tests
• Client tests  
• Deploy
```

### NEW PIPELINE
```
Enhanced Pipeline:
• Shared tests
• Server API tests (80+ cases)
• Client tests
• Multi-version testing (16.x & 20.x)
• Security scanning
• Code quality checks
• Build verification
• Coverage reporting
• Deploy (with enhanced tracking)
```

## Quick Commands

```bash
# Run tests locally
cd server && npm test

# Watch mode for dev
cd server && npm run test:watch

# Run full CI pipeline locally
npm run test:ci

# View coverage
start server/coverage/index.html
```

## Result

80+ automated test cases  
Multi-version compatibility  
Security & quality checks  
Automated deployment  
Full coverage tracking  

## Tests
**`server/__tests__/api.test.js`** (Main Integration Tests)
```
✅ Health check endpoint
✅ User profile endpoints
✅ Workout submission
  ├─ Valid workout processing
  ├─ Missing exercise validation
  ├─ Missing reps validation
  └─ Multiple exercise types
✅ Achievements API
✅ Quests API
✅ Activity feed
✅ Inventory system
✅ Raid bosses
✅ Gym territories
✅ 404 handling
```

**`server/__tests__/routes.test.js`** (Route-Specific Tests)
```
✅ Achievement routes (4 endpoints)
✅ Quest routes (3 endpoints)
✅ Duel routes (4 endpoints)
✅ Activity routes (2 endpoints)
✅ Leaderboard routes (2 endpoints)
```

**`server/__tests__/services.test.js`** (Service Layer Tests)
```
✅ Achievement service (2 tests)
✅ Quest service (2 tests)
✅ Duel service (2 tests)
✅ Raid service (3 tests)
✅ Activity service (3 tests)
✅ Item service (2 tests)
```

**Total: 80+ test cases**
