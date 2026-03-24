param(
  [string]$TaskName = "LilJohnnyDailyPush",
  [string]$Time = "19:00",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$scriptPath = "C:\Users\johnw\johnny-app\scripts\daily-push.ps1"

if (-not (Test-Path $scriptPath)) {
  throw "Daily push script not found at $scriptPath"
}

$taskAction = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Branch `"$Branch`""

schtasks /Create `
  /TN $TaskName `
  /TR $taskAction `
  /SC DAILY `
  /ST $Time `
  /F

Write-Host "Scheduled task '$TaskName' created for $Time."
