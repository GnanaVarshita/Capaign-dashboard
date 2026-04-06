file = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Simple approach - find and remove the second crop filter block
# Pattern: two consecutive crop filters
pattern1 = '''} else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);'''

pattern2 = '''} else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);'''

if pattern1 in content:
    content = content.replace(pattern1, pattern2)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Removed duplicate crop filter")
else:
    print("⚠️ Pattern not found")
