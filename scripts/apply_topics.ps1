$ErrorActionPreference = 'Stop'
Write-Host 'LonzilFox / Topic batch planner (AddTopics only)' -ForegroundColor Red
$csv = Join-Path (Split-Path $PSScriptRoot -Parent) 'topics-plan.csv'
if (-not (Test-Path $csv)) { Write-Host 'topics-plan.csv missing'; exit 1 }
$rows = @(Import-Csv -Path $csv | Where-Object { $_.Repository -and $_.AddTopics })
if ($rows.Count -eq 0) {
  Write-Host 'Edit topics-plan.csv first. Example format:'
  Write-Host 'Repository,AddTopics'
  Write-Host 'YourRepo,"category-tools,windows,csharp"'
  Write-Host 'No repositories have been modified.'
  exit 0
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Host 'Install GitHub CLI: https://cli.github.com/'; exit 1 }
& gh auth status
if ($LASTEXITCODE -ne 0) { Write-Host 'Run gh auth login'; exit 1 }
$plan = @()
foreach ($row in $rows) {
  $repo = $row.Repository.Trim()
  if ($repo -notmatch '^[A-Za-z0-9_.-]+$') { Write-Host "Invalid repo: $repo"; exit 1 }
  $topics = @($row.AddTopics.Split(',') | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })
  foreach ($topic in $topics) {
    if ($topic -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$' -or $topic.Length -gt 50) { Write-Host "Invalid Topic: $topic"; exit 1 }
  }
  if ($topics.Count -gt 20) { Write-Host "Too many Topics for $repo"; exit 1 }
  $plan += [PSCustomObject]@{ Repo="LonzilFox/$repo"; Topics=($topics -join ',') }
}
$plan | Format-Table -AutoSize
Write-Host "Planned updates: $($plan.Count). No topics will be removed." -ForegroundColor Cyan
$confirm = Read-Host 'Type APPLY to add these Topics to GitHub'
if ($confirm -cne 'APPLY') { Write-Host 'Canceled. No changes.'; exit 0 }
$failed = 0
foreach ($item in $plan) {
  & gh repo edit $item.Repo --add-topic $item.Topics
  if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $($item.Repo)"; $failed++ }
}
Write-Host "Finished. Failed: $failed"
if ($failed -gt 0) { exit 1 }
