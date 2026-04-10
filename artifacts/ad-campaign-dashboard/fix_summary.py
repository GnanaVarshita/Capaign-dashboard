file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate crop filter in summary
old_line = "{viewFilters.activity && ' Activity'}{viewFilters.crop && ' Crop'}{viewFilters.crop && ' Crop'}"
new_line = "{viewFilters.activity && ' Activity'}{viewFilters.crop && ' Crop'}"

content = content.replace(old_line, new_line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("✅ Fixed duplicate crop filter in summary")
