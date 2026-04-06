import re

file = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file, 'r') as f:
    content = f.read()

# Look for the duplicate crop filter block
lines = content.split('\n')
new_lines = []
skip_next_crop = False

for i, line in enumerate(lines):
    # If this is a crop filter and the next lines are also crop filter, skip
    if "aimFilters.filterType === 'crop'" in line and i > 0:
        # Check if previous block was also a crop filter
        if i >= 3 and "aimFilters.filterType === 'crop'" in '\n'.join(lines[i-3:i]):
            # This is likely a duplicate, skip it and the next 2-3 lines
            skip_next_crop = 3
            continue
    
    if skip_next_crop > 0:
        skip_next_crop -= 1
        continue
    
    new_lines.append(line)

with open(file, 'w') as f:
    f.write('\n'.join(new_lines))

print("✅ Processed file")
