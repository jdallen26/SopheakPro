# INSTALL_DEPS.ps1
# Usage: Open PowerShell in this folder and run: .\INSTALL_DEPS.ps1
# This script checks for node and npm, prints versions, and installs dependencies.

# Check for node
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $node -or -not $npm) {
    Write-Host "Node.js and/or npm not found on PATH." -ForegroundColor Yellow
    Write-Host "Please install Node.js (recommended LTS: 18.x or 20.x) or install nvm-windows and then install node." -ForegroundColor Yellow
    Write-Host "Download installer: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "nvm-windows: https://github.com/coreybutler/nvm-windows" -ForegroundColor Cyan
    exit 1
}

# Print versions
Write-Host "node:" (node --version)
Write-Host "npm: " (npm --version)

# Choose install command
nif (Test-Path package-lock.json) {
    Write-Host "Found package-lock.json -> running: npm ci" -ForegroundColor Green
    npm ci
} else {
    Write-Host "Running: npm install" -ForegroundColor Green
    npm install
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully." -ForegroundColor Green
    Write-Host "You can start the dev server: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "npm failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

