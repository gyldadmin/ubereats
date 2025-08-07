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
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  reporters: ['detox/runners/jest/reporter'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|react-native|react-native-.*|@react-native|@react-native-.*|@react-navigation|expo(nent)?|@expo|expo-.*)'
  ],
};

