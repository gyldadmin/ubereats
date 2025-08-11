# PowerShell script to run E2E tests locally
# This temporarily sets E2E environment variables and runs Detox tests

Write-Host "Setting E2E environment variables..." -ForegroundColor Yellow
$env:E2E = "true"
$env:EXPO_PUBLIC_E2E = "true"

Write-Host "Running E2E tests..." -ForegroundColor Green
try {
    npx detox test -c ios.sim.release --cleanup
} finally {
    Write-Host "Cleaning up E2E environment variables..." -ForegroundColor Yellow
    $env:E2E = $null
    $env:EXPO_PUBLIC_E2E = $null
    Write-Host "E2E variables cleared." -ForegroundColor Green
}
