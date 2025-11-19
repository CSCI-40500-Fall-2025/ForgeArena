<!-- Copilot / AI agent guidance for the ForgeArena repository -->

**Purpose**: Help AI coding agents jump-start work in this repo — architecture, key flows, scripts, logging conventions, and examples.

**Big Picture**:
- **Client**: React + TypeScript app in `client/`. Entry: `client/src/index.tsx`. Firebase auth and client config live under `client/src/firebaseClient.ts` and `client/src/firebaseConfig.ts`.
- **Server**: Express app in `server/` (entry `server/index.js`). Uses CommonJS and exports `app` for tests.
- **Serverless API**: `api/` folder contains Vercel-style serverless functions that reuse `shared/` code (e.g., `api/user.js` uses `shared/firebase.js`).
- **Shared logic**: `shared/` has `gameLogic.js`, `mockData.js`, `firebase.js`. These are reused by both `server/` and `api/` handlers.

**How to run / common commands**
- Install everything from repo root (recommended):
```
npm run install-deps
```
- Run both client and server locally (concurrently):
```
npm run dev
```
- Server-only (development with auto-reload):
```
cd server && npm run dev
```
- Client-only:
```
cd client && npm start
```
- Run tests:
```
npm run test:shared   # runs shared Jest tests (CI-friendly)
cd client && npm test -- --watchAll=false
```

**Project-specific conventions & patterns**
- Logging: the canonical logger is `server/utils/logger.js` (uses `winston`). Use `logger.debug/info/warn/error` with structured metadata. Common metadata keys: `userId`, `action`, and contextual fields (e.g., `questId`, `xpGained`).
- Logger helper methods available: `logger.logUserAction`, `logger.logQuestEvent`, `logger.logAvatarUpdate`, `logger.logLeaderboardUpdate` — prefer them for domain events.
- CI behaviour: `server/utils/logger.js` checks `process.env.CI === 'true'` and forces `debug` level in CI (so tests and CI runs will show full logs). Avoid changing CI logging unless intentionally altering test diagnostics.
- Persistence fallback: `shared/firebase.js` will initialize Firestore only if `process.env.FIREBASE_PROJECT_ID` is present; otherwise it falls back to `shared/mockData.js`. When editing data-access code, handle both live DB and mock fallback.
- Server export: `server/index.js` exports the `app` for unit tests — keep that export when refactoring startup code.

**Logging & monitoring notes (important for changes)**
- Server logging is centralized in `server/utils/logger.js`. Files write to `server/logs/{error.log,combined.log,user-activity.log}`. The logger uses a leveled format and colorized console output.
- Cloud logging: when `NODE_ENV === 'production'` and a `LOGTAIL_SOURCE_TOKEN` is provided, Logtail transport is initialized. This is disabled in CI.
- When you add a new log, follow the repo pattern:
  - Use `logger.debug(...)` for internal flow and variable dumps.
  - Use `logger.info(...)` for successful domain-level events (e.g., `Quest completed`, `User leveled up`).
  - Use `logger.warn(...)` for invalid but expected conditions (e.g., `Quest already completed`).
  - Use `logger.error(...)` for exceptions and failures; include `error.message` and `stack` in metadata.

**Where to add instrumentation**
- API routes: `server/index.js` demonstrates the existing pattern (see `POST /api/workout`, `POST /api/quest/:id/complete`). Mirror these patterns when instrumenting new routes.
- Shared logic: add debug/info logs in `shared/gameLogic.js` when state changes (use `logger` by requiring it in server-only code; for shared pure functions used in both server and serverless, prefer returning event objects for the caller to log).

**Examples (copy/paste patterns)**
- Structured info log:
```
logger.info('Quest completed successfully', {
  userId: mockUser.id,
  questId,
  xpGained: quest.xpReward,
  action: 'QUEST'
});
```
- Error logging with stack:
```
logger.error('Workout processing failed', {
  userId: mockUser.id,
  exercise: req.body.exercise,
  error: error.message,
  stack: error.stack,
  action: 'WORKOUT'
});
```

**Files to read first when changing behavior**
- `server/index.js` — request lifecycle and examples of logging usage.
- `server/utils/logger.js` — logger configuration, env behaviors, helper methods.
- `shared/firebase.js` — DB init + fallback to `mockData.js`.
- `shared/gameLogic.js` — game rules and where domain state changes.
- `api/` — serverless/edge function patterns that reuse `shared/` code.

**Tests & CI hooks**
- Root test runner invokes shared Jest tests via `npm run test:shared`. CI sets `CI=true` so logger emits verbose diagnostics — the logger file already handles this.
- If you need to add unit tests for logging, assert that the correct helper method is called or that files under `server/logs/` receive entries (use dependency injection or spy/stub on `logger` in tests).

**If you change logging configuration**
- Keep CI verbose (`process.env.CI === 'true'` branch) intact unless you also update CI and test expectations.
- When adding cloud log transports, ensure they are only enabled in production and require credentials via environment variables.

**If something is missing**
- Tell me which file/feature you want changed. I can add logs, update the logger configuration, or produce the required “Logging” wiki page and CI permalinks.

---
Last scanned files for this guidance: `server/index.js`, `server/utils/logger.js`, `shared/firebase.js`, `shared/gameLogic.js`, `api/user.js`, `client/package.json`, `server/package.json`, root `package.json`.
