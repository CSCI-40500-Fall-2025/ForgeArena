# API Testing & CI/CD Documentation

## Overview

Comprehensive test suite for ForgeArena APIs with automated CI/CD pipeline using GitHub Actions.

## Test Structure

```
project-project-4/
├── server/
│   ├── __tests__/
│   │   ├── api.test.js           # Main API integration tests
│   │   ├── routes.test.js        # Route-specific tests
│   │   ├── services.test.js      # Service layer tests
│   │   └── setup.js              # Test configuration
│   ├── jest.config.js            # Jest configuration
│   └── package.json              # Test scripts
├── shared/
│   └── __tests__/
│       ├── gameLogic.test.js     # Game logic tests
│       └── inventory.test.js     # Inventory system tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions workflow
└── package.json                  # Root test scripts
```

## Running Tests

### Local Development

```bash
# From repo root: install server dev deps (includes supertest)
npm run install-deps
```

```bash
# Run all tests
npm test

# Run only server API tests
npm run test:server

# Windows PowerShell tip: if execution policy blocks npm, use
# npm.cmd run test:server

# Run only shared game logic tests
npm run test:shared

# Run only client tests
npm run test:client

# Run server tests in watch mode
cd server && npm run test:watch

# Run tests with coverage
cd server && npm test
```

### CI/CD Pipeline

```bash
# Run tests as they would run in CI
npm run test:ci
```

## Test Coverage

Current test coverage includes:

### API Endpoints (Integration Tests)
- Health check (`/api/health`)
- User profile (`/api/user`)
- Workout logging (`POST /api/workout`)
- Achievements (`/api/achievements/*`)
- Quests (`/api/quests/*`)
- Duels (`/api/duels/*`)
- Activity feed (`/api/activity/*`)
- Leaderboard (`/api/leaderboard/*`)
- Inventory (`/api/inventory`)
- Raids (`/api/raid`)
- Gyms (`/api/gyms`)

### Route-Specific Tests
- Achievement routes (4 endpoints)
- Quest routes (4 endpoints)
- Duel routes (5 endpoints)
- Activity routes (3 endpoints)
- Leaderboard routes (2 endpoints)

### Service Layer Tests
- Achievement service
- Quest service
- Duel service
- Raid service
- Activity service
- Item service

### Game Logic Tests
- Workout processing
- XP calculation
- Level progression
- Item generation

## Configuration

### Jest Configuration (`server/jest.config.js`)

```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}
```

### Environment Variables for Tests

Required environment variables (automatically set in `setup.js`):
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key`
- `FIREBASE_PROJECT_ID=test-project`
- `FIREBASE_PRIVATE_KEY=test-key`
- `FIREBASE_CLIENT_EMAIL=test@test.com`

## CI/CD Pipeline

### GitHub Actions Workflow

The pipeline runs on every push and pull request to `main` and `develop` branches.

#### **Jobs:**

1. **Test** 
   - Runs on Node 20.x
   - Executes all test suites
   - Uploads coverage reports (coverage files available in workflow artifacts)

2. **Lint**
   - Code quality checks
   - Searches for console.log statements
   - Lists TODO/FIXME comments

3. **Build**
   - Builds client application
   - Uploads build artifacts

4. **Security**
   - Runs `npm audit` on all packages
   - Checks for vulnerabilities

5. **Deploy** (main branch only)
   - Deploys to Heroku after successful tests

### Setting Up GitHub Actions

1. **Add Secrets to GitHub Repository:**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `HEROKU_API_KEY`
     - `HEROKU_APP_NAME`
     - `HEROKU_EMAIL`

2. **Enable GitHub Actions:**
   - Push the `.github/workflows/ci-cd.yml` file
   - Actions will run automatically on push/PR

## Writing New Tests

### API Integration Test Example

```javascript
describe('POST /api/new-endpoint', () => {
  it('should handle valid request', async () => {
    const response = await request(app)
      .post('/api/new-endpoint')
      .send({ data: 'test' })
      .expect(200);
    
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Service Test Example

```javascript
describe('MyService', () => {
  it('should process data correctly', async () => {
    const result = await myService.processData('input');
    
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  });
});
```

## Test Best Practices

1. **Use Mocks for External Dependencies**
   - Firebase Admin SDK is mocked
   - Authentication middleware is mocked
   - Database calls are mocked

2. **Test Edge Cases**
   - Invalid inputs
   - Missing required fields
   - Authentication failures

3. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Clean up after tests

4. **Descriptive Test Names**
   - Use clear, descriptive test names
   - Follow pattern: "should [expected behavior] when [condition]"

5. **Assertions**
   - Test both success and failure cases
   - Verify response structure
   - Check status codes

## Coverage Goals

- **Overall coverage target:** 70%
- **Critical paths:** 90%+
  - Workout processing
  - User authentication
  - XP/Level calculations
  - Achievement unlocking

## Debugging Tests

### Run specific test file:
```bash
cd server
npm test -- api.test.js
```

### Run tests with verbose output:
```bash
cd server
npm test -- --verbose
```

### Debug in VS Code:
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/server/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Security Testing

The pipeline includes:
- npm audit for dependency vulnerabilities
- No secrets in code (uses environment variables)
- Automated security scanning on every PR

## Monitoring & Reports

- **Code Coverage:** Uploaded to Codecov after each CI run
- **Test Results:** Available in GitHub Actions tab
- **Build Artifacts:** Client build available for 7 days

## Troubleshooting

### Tests failing locally but passing in CI:
- Check Node.js version (use 16.x)
- Clear Jest cache: `jest --clearCache`
- Check for environment-specific issues

### Firebase Admin errors:
- Ensure Firebase is properly mocked
- Check that `firebase-admin` mock is before imports

### Timeout errors:
- Increase timeout in `jest.config.js`
- Check for unresolved promises
- Verify all async operations complete

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Check coverage doesn't drop
4. Update this documentation if needed
5. Create PR and wait for CI to pass

---

**Last Updated:** December 2025  
**Maintained By:** ForgeArena Team

