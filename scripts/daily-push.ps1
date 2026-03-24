param(
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Set-Location "C:\Users\johnw\johnny-app"

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  throw "This folder is not a git repository."
}

$remoteUrl = git remote get-url origin 2>$null
if (-not $remoteUrl) {
  throw "Git remote 'origin' is not configured."
}

git add .

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No staged changes to commit."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$commitMessage = "Daily sync $timestamp"

git commit -m $commitMessage
git push origin $Branch
