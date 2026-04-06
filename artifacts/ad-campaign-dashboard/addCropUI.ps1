$filePath = 'D:\Campaign\campaign-dashboard\Capaign-dashboard\artifacts\ad-campaign-dashboard\src\pages\tabs\BudgetRequestTab.tsx'
$content = [System.IO.File]::ReadAllText($filePath)

# Add Crop Filter UI
$oldMarker = '            </div>

            {/* Region Filter (for ZM, RM) */}'

$newContent = '            </div>

            {/* Crop Filter */}
            <div>
              <Label className=" text-xs font-bold\>Crop</Label>
 <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
 <option value=\\>All Crops</option>
 {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </Select>
 </div>

 {/* Region Filter (for ZM, RM) */}'

$content = $content -replace [regex]::Escape($oldMarker), $newContent
[System.IO.File]::WriteAllText($filePath, $content)
Write-Host 'Crop Filter UI added'
