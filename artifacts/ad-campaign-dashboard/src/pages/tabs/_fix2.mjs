import fs from 'fs';
const path = 'TransactionMasterTab.tsx';
const content = fs.readFileSync(path, 'utf-8');
const fixed = content.replace(/underline\\>/g, 'underline\">');
fs.writeFileSync(path, fixed, 'utf-8');
console.log('Fixed malformed className');