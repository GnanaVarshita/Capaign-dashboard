$file = "src/pages/tabs/BudgetRequestTab.tsx"
$content = [IO.File]::ReadAllText($file)

# More flexible pattern matching
$cropUIBlock = @"

            {/* Crop Filter */}
            <div>
              <Label className=`"text-xs font-bold`">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value=`"`">All Crops</option>
                {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
"@

# Find the line number where to insert
$lines = $content -split "`n"
$insertIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match "{/* Activity Filter" -and $lines[$i+4] -match "{/* Region Filter") {
    $insertIndex = $i + 4
    break
  }
}

if ($insertIndex -gt 0) {
  [array]$newLines = @()
  for ($i = 0; $i -lt $insertIndex; $i++) {
    $newLines += $lines[$i]
  }
  $newLines += $cropUIBlock
  for ($i = $insertIndex; $i -lt $lines.Count; $i++) {
    $newLines += $lines[$i]
  }
  $newContent = $newLines -join "`n"
  [IO.File]::WriteAllText($file, $newContent)
  Write-Host "✅ Crop Filter UI inserted"
} else {
  Write-Host "❌ Could not find insertion point"
}
