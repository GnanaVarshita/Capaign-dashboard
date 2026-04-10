file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the Activity Filter block and insert Crop Filter
old_text = '''            </div>

            {/* Region Filter (for ZM, RM) */}'''

new_text = '''            </div>

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

            {/* Region Filter (for ZM, RM) */}'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('✅ Crop Filter UI added successfully')
else:
    print('❌ Could not find insertion point')
