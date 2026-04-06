file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove duplicate crop filter in AIM section
crop_block = '''{aimFilters.filterType === 'crop' && (
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

# Count occurrences
count = content.count(crop_block)
if count > 1:
    # Remove all instances and add back just one
    content = content.replace(crop_block, '')
    # Find where to add the single instance back
    activity_end = content.rfind("{aimFilters.filterType === 'activity' && (")
    if activity_end >= 0:
        # Find the end of activity block
        activity_block_end = content.find(')}', activity_end)
        if activity_block_end >= 0:
            activity_block_end = content.find(')}', activity_block_end + 2)
            if activity_block_end >= 0:
                # Add back the crop block
                content = content[:activity_block_end + 2] + '\n            ' + crop_block + content[activity_block_end + 2:]
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("✅ Removed duplicate crop filter section")
else:
    print("✅ No duplicates found")
