/**
 * Jest configuration dedicated to Detox E2E tests.
 * Uses the Detox-provided test environment and reporter.
 */
module.exports = {
  // Ensure <rootDir> resolves to the project root (one level up from this file)
  rootDir: '..',
  // Use react-native preset; we manually whitelist RN/Expo modules below
  preset: 'react-native',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  // Exclude this config file itself from matching by using an extglob negation
  testMatch: ['<rootDir>/e2e/**/!(*jest.config*).e2e.js'],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  // Use default Jest reporter to avoid Detox secondary context reporting bug after success
  // reporters: ['detox/runners/jest/reporter'],
  testTimeout: 300000,
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-native|react-native-.*|@react-native|@react-native-.*|@react-navigation|expo(nent)?|@expo|expo-.*)'
  ],
};

