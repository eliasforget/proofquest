param(
  [string]$Path = "app/src"
)

$ErrorActionPreference = "Stop"

function Invoke-Graphify {
  param([string[]]$Args)

  if (Get-Command uvx -ErrorAction SilentlyContinue) {
    & uvx --from graphifyy graphify @Args
    return $LASTEXITCODE
  }

  if (Get-Command graphify -ErrorAction SilentlyContinue) {
    & graphify @Args
    return $LASTEXITCODE
  }

  return 127
}

$code = Invoke-Graphify @($Path, "--no-viz")

if ($code -eq 127) {
  Write-Host "Graphify n'est pas installé." -ForegroundColor Yellow
  Write-Host "Installer uv puis relancer :" -ForegroundColor Yellow
  Write-Host "  winget install astral-sh.uv"
  Write-Host "  .\scripts\GRAPHIFY_CODE.ps1"
  exit 1
}

if ($code -ne 0) {
  exit $code
}

$cluster = Invoke-Graphify @("cluster-only", $Path)
exit $cluster
