# E2E Testing Setup

This project uses Detox for End-to-End testing with a clean separation between development and testing modes.

## How it Works

### Development Mode (Default)
- **Environment**: No E2E variables set
- **Behavior**: App shows normal login screen and full authentication flow
- **Usage**: Regular development work

### E2E Mode (Testing Only)
- **Environment**: `E2E=true` or `EXPO_PUBLIC_E2E=true`
- **Behavior**: App bypasses authentication and lands directly on HomeScreen
- **Usage**: Automated testing only

## Running Tests

### In CI (GitHub Actions)
Tests run automatically on push/PR. E2E environment variables are set automatically.

### Locally
```bash
# Option 1: Use the convenience script
npm run test:e2e:local

# Option 2: Manual setup (PowerShell)
$env:E2E = "true"
npx detox test -c ios.sim.release --cleanup
$env:E2E = $null  # Clean up afterward

# Option 3: Manual setup (Bash/Linux)
E2E=true npx detox test -c ios.sim.release --cleanup
```

## Key Files

- **`src/navigation/AppNavigator.tsx`**: Detects E2E mode and bypasses auth
- **`src/screens/HomeScreen.tsx`**: Provides E2E success markers for tests
- **`e2e/schedulerSmoke.e2e.js`**: Tests the 3-minute scheduler button
- **`e2e/pushEmail6Hours.e2e.js`**: Tests the 6-hour scheduler button
- **`.github/workflows/e2e-detox.yml`**: CI configuration
- **`scripts/run-e2e-local.ps1`**: Local testing script

## Test Flow

1. **Launch**: App launches in E2E mode (no auth required)
2. **Navigate**: Tests scroll to find green scheduler buttons
3. **Interact**: Tests tap buttons to trigger scheduling
4. **Verify**: Tests check that no "test failed" modal appears
5. **Success**: Tests wait for `e2eScheduled` marker to appear

## Troubleshooting

- **Dev app stuck in E2E mode**: Clear environment variables with `$env:E2E = $null; $env:EXPO_PUBLIC_E2E = $null`
- **E2E tests can't find buttons**: Check that buttons have correct `testID` attributes
- **Tests timeout**: Ensure app is properly built with E2E configuration embedded
