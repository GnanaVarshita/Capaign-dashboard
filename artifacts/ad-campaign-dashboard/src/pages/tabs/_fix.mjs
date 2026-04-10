import fs from 'fs';
const path = 'TransactionMasterTab.tsx';
const bytes = fs.readFileSync(path);
let modified = false;
const newBytes = [];
for (let i = 0; i < bytes.length; i++) {
  if (i + 3 < bytes.length && bytes[i] === 92 && bytes[i+1] === 120 && bytes[i+2] === 50 && bytes[i+3] === 55) {
    newBytes.push(39);
    i += 3;
    modified = true;
  } else {
    newBytes.push(bytes[i]);
  }
}
if (modified) {
  fs.writeFileSync(path, Buffer.from(newBytes));
  console.log('Fixed escape sequences');
} else {
  console.log('No escape sequences found');
}