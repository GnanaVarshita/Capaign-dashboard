file_path = 'src/pages/tabs/BudgetRequestTab.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the syntax error - remove the [...] and just show the fallback
old_fallback = ''') : (
                  [...]<option value="">No crops available</option>
                )}'''

new_fallback = ''') : (
                  null
                )}'''

if old_fallback in content:
    content = content.replace(old_fallback, new_fallback)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Fixed crop filter syntax")
else:
    print("❌ Fallback text not found - checking alternative")
    # Try a simpler approach
    if "[...]<option" in content:
        content = content.replace("[...]<option value=\"\">No crops available</option>", "null")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Fixed with alternative method")
