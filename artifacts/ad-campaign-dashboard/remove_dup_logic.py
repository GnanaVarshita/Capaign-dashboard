file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the duplicate crop filter condition
old_duplicate = '''      } else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);
      } else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);
      }'''

new_fixed = '''      } else if (aimFilters.filterType === 'crop' && aimFilters.selectedValue) {
        filtered = filtered.filter(br => br.crop === aimFilters.selectedValue);
      }'''

if old_duplicate in content:
    content = content.replace(old_duplicate, new_fixed)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Removed duplicate crop filter logic")
else:
    print("⚠️ Could not find duplicate to remove")
