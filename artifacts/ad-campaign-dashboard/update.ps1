$file = "D:\Campaign\campaign-dashboard\Capaign-dashboard\artifacts\ad-campaign-dashboard\src\pages\tabs\BudgetRequestTab.tsx"
$content = [IO.File]::ReadAllText($file)

$find = @"
            </div>

            {/* Region Filter (for ZM, RM) */}
"@

$replace = @"
            </div>

            {/* Crop Filter */}
            <div>
              <Label className="text-xs font-bold">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value="">All Crops</option>
                {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>

            {/* Region Filter (for ZM, RM) */}
"@

$content = $content.Replace($find, $replace)
[IO.File]::WriteAllText($file, $content)
Write-Host "✅ Crop Filter UI added"
