file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Change the visibility condition from requiring visibleRequests.length > 0 
# to just showing the filters for managers
old_condition = '''{/* Advanced Filters for Requests (when requests exist) */}
      {(isZonalManager || isRegionalManager || isAreaManager) && visibleRequests.length > 0 && ('''

new_condition = '''{/* Advanced Filters for Requests (when requests exist) */}
      {(isZonalManager || isRegionalManager || isAreaManager) && ('''

if old_condition in content:
    content = content.replace(old_condition, new_condition)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Changed crop filter visibility - now always visible for managers")
else:
    print("⚠️ Could not find visibility condition to update")
