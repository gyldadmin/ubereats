/**
 * Jest configuration dedicated to Detox E2E tests.
 * Uses the Detox-provided test environment and reporter.
 */
module.exports = {
  preset: 'react-native',           // works for Expo projects; Detox overrides env
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testMatch: ['**/*.e2e.js'],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  reporters: ['detox/runners/jest/reporter'],
};

