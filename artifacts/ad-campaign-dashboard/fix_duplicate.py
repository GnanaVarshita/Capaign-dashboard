file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove duplicate Crop Filter
crop_filter_block = '''            {/* Crop Filter */}
            <div>
              <Label className=\"text-xs font-bold\">Crop</Label>
              <Select value={viewFilters.crop} onChange={e => setViewFilters({...viewFilters, crop: e.target.value})}>
                <option value=\"\">All Crops</option>
                {[...new Set(visibleRequests.map(r => r.crop).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>'''

# Count occurrences
count = content.count(crop_filter_block)
if count > 1:
    # Remove the duplicate by keeping only the first occurrence
    idx = content.find(crop_filter_block)
    # Find the second occurrence
    idx2 = content.find(crop_filter_block, idx + len(crop_filter_block))
    if idx2 >= 0:
        # Remove the second one
        content = content[:idx2] + content[idx2 + len(crop_filter_block):]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('✅ Duplicate Crop Filter removed')
else:
    print('✅ No duplicates found')
