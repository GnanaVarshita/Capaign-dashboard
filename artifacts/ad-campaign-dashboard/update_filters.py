file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update Clear Filters button
old_reset = \"{ requestCycle: '', sessionNumber: '', product: '', activity: '', region: '', zone: '', area: '' }\"
new_reset = \"{ requestCycle: '', sessionNumber: '', product: '', activity: '', crop: '', region: '', zone: '', area: '' }\"

if old_reset in content:
    content = content.replace(old_reset, new_reset)
    print('✅ Updated Clear Filters button')
else:
    print('⚠️  Clear Filters button not found (may already be updated)')

# Update Filter Summary
old_summary = \"{viewFilters.activity && ' Activity'}\"
new_summary = \"{viewFilters.activity && ' Activity'}{viewFilters.crop && ' Crop'}\"

if old_summary in content:
    content = content.replace(old_summary, new_summary)
    print('✅ Updated Filter Summary')
else:
    print('⚠️  Filter Summary not found (may already be updated)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('💾 File saved')
