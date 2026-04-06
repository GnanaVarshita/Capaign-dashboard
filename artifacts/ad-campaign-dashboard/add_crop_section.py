file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add crop filter conditional section to AIM filters
old_activity = '''{aimFilters.filterType === 'activity' && (
              <div>
                <Label>Select Activity</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Activities</option>
                  {getUniqueValues('activity').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>
            )}'''

new_activity = '''{aimFilters.filterType === 'activity' && (
              <div>
                <Label>Select Activity</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Activities</option>
                  {getUniqueValues('activity').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>
              </div>
            )}
            {aimFilters.filterType === 'crop' && (
              <div>
                <Label>Select Crop</Label>
                <Select value={aimFilters.selectedValue} onChange={e => setAimFilters({...aimFilters, selectedValue: e.target.value})}>
                  <option value="">All Crops</option>
                  {crops && crops.length > 0 && crops.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </div>
            )}'''

if old_activity in content:
    content = content.replace(old_activity, new_activity)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Added Crop filter UI section to AIM filters")
else:
    print("⚠️ Could not find activity filter section to update")
