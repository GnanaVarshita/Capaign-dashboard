file_path = 'src/types.ts'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Add crop to Entry interface
old_text = '''  activity: string;
  amount: number;
  area: string;'''

new_text = '''  activity: string;
  crop?: string;
  amount: number;
  area: string;'''

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Added crop property to Entry interface")
else:
    print("⚠️ Pattern not found - checking alternative")
