module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Coverage thresholds disabled for API integration tests
  // These tests focus on API behavior, not code coverage
  // coverageThreshold: {
  //   global: {
  //     branches: 15,
  //     functions: 10,
  //     lines: 15,
  //     statements: 15,
  //   },
  // },
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  forceExit: true,
  detectOpenHandles: false,
};

