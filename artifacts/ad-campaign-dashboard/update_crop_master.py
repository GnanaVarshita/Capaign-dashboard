file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the crop filter to use crops from AppContext instead of visibleRequests
old_crop = '''{/* Crop Filter */}
            <div>
              <Label className="text-xs font-bold">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value="">All Crops</option>
                {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>'''

new_crop = '''{/* Crop Filter */}
            <div>
              <Label className="text-xs font-bold">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value="">All Crops</option>
                {crops && crops.length > 0 ? (
                  crops.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  [...]<option value="">No crops available</option>
                )}
              </Select>
            </div>'''

if old_crop in content:
    content = content.replace(old_crop, new_crop)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Updated crop filter to use Crop Master")
else:
    print("⚠️ Could not find crop filter block")
