param(
  [string]$Path = "app/src"
)

$ErrorActionPreference = "Stop"

if (Get-Command uvx -ErrorAction SilentlyContinue) {
  uvx --from graphifyy graphify $Path --no-viz
  exit $LASTEXITCODE
}

if (Get-Command graphify -ErrorAction SilentlyContinue) {
  graphify $Path --no-viz
  exit $LASTEXITCODE
}

Write-Host "Graphify n'est pas installé." -ForegroundColor Yellow
Write-Host "Installer uv puis relancer :" -ForegroundColor Yellow
Write-Host "  winget install astral-sh.uv"
Write-Host "  .\scripts\GRAPHIFY_CODE.ps1"
exit 1
