file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add crop filter option to AIM filters logic
old_aimfilter = '''} else if (aimFilters.filterType === 'activity' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.activity === aimFilters.selectedValue);
      }'''

new_aimfilter = '''} else if (aimFilters.filterType === 'activity' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.activity === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);
      }'''

if old_aimfilter in content:
    content = content.replace(old_aimfilter, new_aimfilter)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Added crop filter option to AIM filters logic")
else:
    print("⚠️ Could not find aimFilters code to update")
