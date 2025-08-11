#!/bin/bash
# Bash script to run E2E tests locally
# This temporarily sets E2E environment variables and runs Detox tests

echo "Setting E2E environment variables..."
export E2E=true
export EXPO_PUBLIC_E2E=true

echo "Running E2E tests..."
npx detox test -c ios.sim.release --cleanup

echo "Cleaning up E2E environment variables..."
unset E2E
unset EXPO_PUBLIC_E2E
echo "E2E variables cleared."
