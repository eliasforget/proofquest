$ErrorActionPreference = "Stop"
$AppPath = Join-Path $PSScriptRoot "..\app"
Set-Location $AppPath

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js n'est pas installe ou n'est pas dans PATH." -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installation des dependances..."
  npm install
}

npm run dev
