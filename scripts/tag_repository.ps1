$ErrorActionPreference = 'Stop'
Write-Host 'LonzilFox / GitHub Topic classifier' -ForegroundColor Red
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host 'GitHub CLI (gh) is required: https://cli.github.com/' -ForegroundColor Yellow
  exit 1
}
& gh auth status
if ($LASTEXITCODE -ne 0) { Write-Host 'Run gh auth login first.'; exit 1 }
$repo = (Read-Host 'Repository name (e.g. OCRCaptureTool)').Trim()
if ($repo -notmatch '^[A-Za-z0-9_.-]+$') { Write-Host 'Invalid repository name'; exit 1 }
Write-Host 'Categories: category-tools, category-game, category-ai, category-web, category-automation, category-creative, category-security'
Write-Host 'Custom categories: category-your-topic. Other normal Topics remain metadata.'
$inputTags = (Read-Host 'Topics to ADD (comma separated)').Trim()
$topics = @($inputTags.Split(',') | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })
if ($topics.Count -eq 0) { Write-Host 'No topics specified'; exit 1 }
foreach ($topic in $topics) {
  if ($topic -notmatch '^[a-z0-9]+(?:-[a-z0-9]+)*$' -or $topic.Length -gt 50) {
    Write-Host "Invalid Topic: $topic"; exit 1
  }
}
$add = $topics -join ','
Write-Host "Would add [$add] to LonzilFox/$repo without removing any existing Topics" -ForegroundColor Cyan
$confirm = (Read-Host 'Confirm? (type YES)').Trim()
if ($confirm -cne 'YES') { Write-Host 'Canceled'; exit 0 }
& gh repo edit "LonzilFox/$repo" --add-topic $add
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Topics updated. Site uses live API; READMEs use scheduled or manual workflows.' -ForegroundColor Green
